const express = require('express');
const router = express.Router();
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const { sendSuccess, sendError } = require('../utils/response');
const { hasDashboardAccess, hasMtssAccess } = require('../utils/accessControl');
const { buildRequestUser } = require('../middleware/auth');
const { syncEmployeeFromCentral } = require('../utils/employeeCentralSync');
const { verifyHubRelayToken } = require('../utils/hubSsoRelay');
const { resolveOrProvisionSsoUser } = require('../utils/ssoUserResolution');
const { createUserAwareRateLimiter } = require('../middleware/rateLimiter');

// Tighter than the general apiLimiter (which skips /v1/auth entirely) -
// this is a sensitive auth entry point, not a regular auth check.
const ssoLimiter = createUserAwareRateLimiter({ windowMinutes: 1, max: 20, skip: () => false });

const isCentralLookupError = (error) => {
    const baseUrl = error?.config?.baseURL;
    const path = error?.config?.url;
    return Boolean(
        baseUrl === process.env.MWS_DATA_CENTER_API_URL ||
        (typeof path === 'string' && /^\/(employees|students)\//.test(path))
    );
};

// Hub token-relay SSO handoff. Hub already authenticated the user (its own
// Google login) and mints a short-lived, single-use, audience-scoped token
// asserting "this email"; we never trust anything beyond that email claim -
// every profile field still comes fresh from mws-data-center.
//
// app.js's global helmet() defaults Cross-Origin-Opener-Policy to
// 'same-origin'. That header forces the browser to sever this navigation
// into a brand-new browsing-context group, which breaks Hub's
// window.open("", name) tab-reuse trick (see mws-hub's AppCard.tsx) -
// every relaunch reopens a fresh tab instead of finding and refreshing the
// one already open, no matter what name Hub asks for. Scope the
// relaxation to just this transient redirect hop rather than touching the
// app-wide default.
router.get('/sso', helmet.crossOriginOpenerPolicy({ policy: 'unsafe-none' }), ssoLimiter, async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        return res.redirect(`${frontendUrl}/?error=sso_missing_token`);
    }

    let payload;
    try {
        payload = verifyHubRelayToken(token);
    } catch (error) {
        console.error('❌ Hub SSO relay token verification failed:', error.message);
        return res.redirect(`${frontendUrl}/?error=sso_invalid_token`);
    }

    try {
        const dbUser = await resolveOrProvisionSsoUser(payload.sub, { tags: payload.tags });

        if (!dbUser) {
            console.log('❌ No active central record for Hub SSO email:', payload.sub);
            return res.redirect(`${frontendUrl}/account-not-found`);
        }

        if (!dbUser.isActive) {
            console.error('❌ Inactive user attempted Hub SSO login:', dbUser.email);
            return res.redirect(`${frontendUrl}/?error=account_inactive`);
        }

        const token7d = jwt.sign(
            { userId: dbUser._id, email: dbUser.email, role: dbUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const userDataForFrontend = {
            ...buildRequestUser(dbUser),
            lastLogin: dbUser.lastLogin,
            isActive: dbUser.isActive,
            emailVerified: dbUser.emailVerified,
            validatedAt: new Date().toISOString(),
            authMethod: 'hub_sso'
        };

        const redirectTarget = '/select-role';

        const redirectUrl = `${frontendUrl}/auth/callback#token=${encodeURIComponent(token7d)}&user=${encodeURIComponent(JSON.stringify(userDataForFrontend))}&redirect=${encodeURIComponent(redirectTarget)}`;

        console.log('✅ Hub SSO login successful:', {
            email: dbUser.email,
            role: dbUser.role,
            redirectTarget
        });
        res.redirect(redirectUrl);
    } catch (error) {
        const centralLookupFailed = isCentralLookupError(error);
        console.error('❌ Hub SSO handoff error:', {
            email: payload.sub,
            centralLookupFailed,
            status: error?.response?.status,
            path: error?.config?.url,
            message: error?.message
        });
        res.redirect(`${frontendUrl}/?error=${centralLookupFailed ? 'sso_central_lookup_failed' : 'sso_failed'}`);
    }
});

// Manual login route
router.post('/login', require('../middleware/validation').validate(require('../utils/validationSchemas').userLoginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        // Find user by email (staff first, then students)
        let user = await User.findOne({ email: normalizedEmail }).select('+password');
        let userModel = User;
        if (!user) {
            user = await UserStudent.findOne({ email: normalizedEmail }).select('+password');
            userModel = UserStudent;
        }

        if (!user) {
            return sendError(res, 'Invalid credentials', 401);
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return sendError(res, 'Invalid credentials', 401);
        }

        // Staff identity is validated/synced against mws-data-center on every
        // login — students aren't covered by that API yet, so left as-is.
        if (userModel === User) {
            let centralFields;
            try {
                centralFields = await syncEmployeeFromCentral(normalizedEmail);
            } catch (error) {
                console.error('mws-data-center lookup failed:', error.message);
                return sendError(res, 'Unable to verify employee with central database', 502);
            }

            if (!centralFields) {
                return sendError(res, 'Employee not found or inactive in central database', 403);
            }

            Object.assign(user, centralFields);
        }

        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data and token
        const userData = {
            user: buildRequestUser(user),
            token
        };

        sendSuccess(res, 'Login successful', userData);

    } catch (error) {
        console.error('Login error:', error);
        sendError(res, 'Login failed', 500);
    }
});

// Logout — JWT auth is stateless; client drops the token.
router.post('/logout', (req, res) => {
    // Signing out here should also end the Hub session, otherwise the user
    // lands back on the hub still logged in and one click re-enters this app.
    //
    // Hub's session is a cookie on Hub's domain, so only the browser can
    // clear it - no server-to-server call can. We hand the client a URL to
    // navigate to instead of trying to do it from here.
    const hubBaseUrl = process.env.HUB_BASE_URL;
    const hubLogoutUrl = hubBaseUrl
        ? `${hubBaseUrl.replace(/\/$/, '')}/auth/logout?redirect=${encodeURIComponent(
              process.env.FRONTEND_URL || 'https://app.millenniaws.sch.id'
          )}`
        : null;

    sendSuccess(res, 'Logged out successfully', hubLogoutUrl ? { hubLogoutUrl } : null);
});

// Hub-initiated logout fan-out: Hub loads this in a hidden iframe when the
// user logs out from Hub or another app, so this app's own session ends too
// without the user visiting it directly. No-UI by design - just clears
// local session state. Needs its own CSP relaxation (and X-Frame-Options
// removed) since helmet's app-wide default blocks any cross-origin framing,
// which would otherwise stop Hub's hidden iframe from ever loading this.
router.get('/logout-silent', (req, res) => {
    const hubOrigin = (process.env.HUB_BASE_URL || '').replace(/\/$/, '');
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', `frame-ancestors 'self'${hubOrigin ? ` ${hubOrigin}` : ''}`);
    res.type('html').send(
        `<!doctype html><html><body><script>try{localStorage.removeItem('auth_token');localStorage.removeItem('auth_user');}catch(e){}</script></body></html>`
    );
});

// Get current user info
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
    try {
        // Fetch fresh user data from database for security
        const userModel = req.user.role === 'student' ? UserStudent : User;
        const user = await userModel.findById(req.user.id).select('-password -googleProfile');

        if (!user) {
            console.error('❌ User not found in /auth/me endpoint:', req.user.id);
            return sendError(res, 'User not found', 404);
        }

        // Additional security check - ensure user is still active
        if (!user.isActive) {
            console.error('❌ Inactive user accessed /auth/me:', user.email);
            return sendError(res, 'Account is deactivated', 403);
        }

        const responseUser = buildRequestUser(user);

        // Log role access for security monitoring
        const canViewDashboard = hasDashboardAccess(responseUser);
        console.log('🔐 /auth/me access - Role validation:', {
            userId: user._id,
            email: user.email,
            role: responseUser.role,
            dashboardRole: responseUser.dashboardRole,
            delegatedFrom: responseUser.dashboardAccess?.delegatedFromEmail || null,
            hasDashboardAccess: canViewDashboard,
            hasMtssAccess: hasMtssAccess(responseUser),
            mtssRole: responseUser.mtssRole || null,
            department: responseUser.department,
            unit: responseUser.unit
        });

        sendSuccess(res, 'User info retrieved', { user: responseUser });
    } catch (error) {
        console.error('❌ /auth/me error:', error);
        sendError(res, 'Failed to get user info', 500);
    }
});

module.exports = router;
