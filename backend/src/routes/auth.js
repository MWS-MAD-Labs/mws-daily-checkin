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
const { hubSso, cookieOptions } = require('../utils/hubSso');
const { resolveOrProvisionSsoUser } = require('../utils/ssoUserResolution');
const { createUserAwareRateLimiter } = require('../middleware/rateLimiter');
const { setAuthCookie, clearAuthCookie, COOKIE_NAME } = require('../utils/authCookie');

// Tighter than the general apiLimiter (which skips /v1/auth entirely) -
// this is a sensitive auth entry point, not a regular auth check.
const ssoLimiter = createUserAwareRateLimiter({ windowMinutes: 1, max: 20, skip: () => false });

router.get('/hub-launch', ssoLimiter, (req, res) => {
    let sso;
    try {
        sso = hubSso();
    } catch {
        return sendError(res, 'Hub login is not configured', 503);
    }
    const { url, cookie } = sso.launch.begin();
    res.cookie(cookie.name, cookie.value, cookieOptions(cookie));
    res.redirect(url);
});

const isCentralLookupError = (error) => {
    const baseUrl = error?.config?.baseURL;
    const path = error?.config?.url;
    return Boolean(
        baseUrl === process.env.MWS_DATA_CENTER_API_URL ||
        (typeof path === 'string' && /^\/(employees|students)\//.test(path))
    );
};

// Hub token-relay SSO handoff. Hub already authenticated the user (its own
// Google login); the browser only ever carries a short opaque, single-use
// code (never the token itself - see hubSsoExchange.js), which this
// backend trades server-to-server for the real relay token before trusting
// anything. The token asserts a stable Central Person.id (`sub`) plus an
// email attribute; we never trust anything beyond those claims - every
// profile field still comes fresh from mws-data-center.
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174/daily-checkin';
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
        return res.redirect(`${frontendUrl}/?error=sso_missing_token`);
    }
    let sso;
    try {
        sso = hubSso();
    } catch {
        return res.redirect(`${frontendUrl}/?error=sso_failed`);
    }
    const cookieName = sso.callback.clearCookie().name;
    const action = sso.callback.decide({ code, state, cookieState: req.cookies?.[cookieName] });
    // The Hub started this login (a card click): Daily starts its own round, and the Hub signs the person in again.
    if (action === 'restart') {
        return res.redirect(`${frontendUrl.replace(/\/$/, '')}/auth/hub-launch`);
    }
    if (action === 'reject') {
        return res.redirect(`${frontendUrl}/?error=sso_invalid_state`);
    }
    res.clearCookie(cookieName, { ...cookieOptions(sso.callback.clearCookie()), maxAge: undefined });

    let token;
    try {
        token = await sso.exchange(code, state);
    } catch (error) {
        console.error('❌ Hub SSO code exchange failed:', error.message);
        return res.redirect(`${frontendUrl}/?error=sso_invalid_token`);
    }

    let payload;
    try {
        payload = await verifyHubRelayToken(token);
    } catch (error) {
        console.error('❌ Hub SSO relay token verification failed:', error.message);
        return res.redirect(`${frontendUrl}/?error=sso_invalid_token`);
    }

    try {
        const dbUser = await resolveOrProvisionSsoUser(payload.email, {
            tags: payload.tags,
            source: payload.source,
            personId: payload.sub,
            entitlement: payload.entitlement,
        });

        if (!dbUser) {
            console.log('❌ No active central record for Hub SSO email:', payload.email);
            return res.redirect(`${frontendUrl}/account-not-found`);
        }

        if (!dbUser.isActive) {
            console.error('❌ Inactive user attempted Hub SSO login:', dbUser.email);
            return res.redirect(`${frontendUrl}/?error=account_inactive`);
        }

        const sessionToken = jwt.sign(
            {
                userId: dbUser._id,
                email: dbUser.email,
                role: dbUser.role,
                sessionVersion: dbUser.sessionVersion || 0,
                entitlementId: dbUser.centralEntitlementId,
                entitlementVersion: dbUser.centralEntitlementVersion,
                entitlementOrganizationId: dbUser.centralEntitlementOrganizationId,
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        setAuthCookie(res, sessionToken);

        const userDataForFrontend = {
            ...buildRequestUser(dbUser),
            lastLogin: dbUser.lastLogin,
            isActive: dbUser.isActive,
            emailVerified: dbUser.emailVerified,
            validatedAt: new Date().toISOString(),
            authMethod: 'hub_sso'
        };

        // Basename-relative - the frontend's own React Router basename
        // (main.jsx) turns this into /daily-checkin/home for the browser.
        const redirectTarget = '/home';

        // No token in this URL - it's already set as an httpOnly cookie above.
        const redirectUrl = `${frontendUrl}/auth/callback#user=${encodeURIComponent(JSON.stringify(userDataForFrontend))}&redirect=${encodeURIComponent(redirectTarget)}`;

        console.log('✅ Hub SSO login successful:', {
            email: dbUser.email,
            role: dbUser.role,
            redirectTarget
        });
        res.redirect(redirectUrl);
    } catch (error) {
        const centralLookupFailed = isCentralLookupError(error);
        console.error('❌ Hub SSO handoff error:', {
            email: payload.email,
            centralLookupFailed,
            status: error?.response?.status,
            path: error?.config?.url,
            message: error?.message
        });
        res.redirect(`${frontendUrl}/?error=${centralLookupFailed ? 'sso_central_lookup_failed' : 'sso_failed'}`);
    }
});

// Manual login route
router.post('/login', (req, res) => {
    clearAuthCookie(res);
    sendError(res, 'Local password login is disabled. Launch Daily Check-in from Hub.', 410);
});

// Logout — clears the httpOnly session cookie server-side (the client can't
// do this itself the way it could with localStorage.removeItem).
router.post('/logout', (req, res) => {
    // Read who this was before the cookie goes: the Hub uses the email to end their sessions in the other apps.
    let email = null;
    try {
        const token = req.cookies?.[COOKIE_NAME];
        if (token) email = jwt.verify(token, process.env.JWT_SECRET).email;
    } catch {
        // expired or invalid token: nobody to attribute
    }

    clearAuthCookie(res);

    // The client goes to the Hub in the same tab. The Hub ends the sessions elsewhere, keeps its own, and shows
    // its front page.
    let hubLogoutUrl = null;
    try {
        hubLogoutUrl = hubSso().logoutUrl(email || undefined);
    } catch {
        // Hub not configured: nothing to go to
    }

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
    // This request is same-origin to daily-checkin (just framed by Hub's
    // different origin), so clearing our own cookie here still works even
    // though Hub can't touch it directly.
    clearAuthCookie(res);
    res.type('html').send(
        `<!doctype html><html><body><script>try{localStorage.removeItem('daily.auth_token');localStorage.removeItem('daily.auth_user');sessionStorage.removeItem('daily.auth_token');sessionStorage.removeItem('daily.auth_user');}catch(e){}</script></body></html>`
    );
});

// Back-channel session revocation. Hub calls this directly (server to server) when a person signed out of
// another app or this application was retired. Bumping sessionVersion invalidates every JWT already issued for
// them the next time middleware/auth.js checks it, whether or not the browser comes back.
router.post('/revoke-session', async (req, res) => {
    let sso;
    try {
        sso = hubSso();
    } catch {
        return sendError(res, 'Hub is not configured', 503);
    }
    const result = await sso.revoke.handle({
        secret: req.headers['x-hub-internal-secret'],
        body: req.body,
        apply: async ({ personId, email, all }) => {
            // Matching central_id too means a session still ends when the email here went stale.
            const conditions = [];
            if (email) conditions.push({ email: email.trim().toLowerCase() });
            if (personId) conditions.push({ centralPersonId: personId.trim() });
            const userMatch = all ? {} : conditions.length === 1 ? conditions[0] : { $or: conditions };
            const [employees, students] = await Promise.all([
                all ? User.updateMany(userMatch, { $inc: { sessionVersion: 1 } }) : User.updateOne(userMatch, { $inc: { sessionVersion: 1 } }),
                all ? UserStudent.updateMany(userMatch, { $inc: { sessionVersion: 1 } }) : UserStudent.updateOne(userMatch, { $inc: { sessionVersion: 1 } }),
            ]);
            return (employees.modifiedCount || 0) + (students.modifiedCount || 0) > 0;
        },
    });
    res.status(result.status).json(result.body);
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
