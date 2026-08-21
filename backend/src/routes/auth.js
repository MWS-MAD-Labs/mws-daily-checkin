const express = require('express');
const router = express.Router();
const passport = require('../config/googleOAuth');
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

// Session middleware is only needed for Google OAuth flow.
// Email/password login and JWT-based routes do NOT require sessions.
const buildOAuthMiddleware = () => {
    const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
    if (!secret) return [];
    return [
        require('express-session')({ secret, resave: false, saveUninitialized: false }),
        passport.initialize(),
        passport.session()
    ];
};
const oauthMiddleware = buildOAuthMiddleware();

// Tighter than the general apiLimiter (which skips /v1/auth entirely) -
// this is a sensitive auth entry point, not a regular auth check.
const ssoLimiter = createUserAwareRateLimiter({ windowMinutes: 1, max: 20, skip: () => false });

// Extracted so redirect-branching is unit-testable without mocking passport.
function resolveOAuthFailureRedirect(info) {
    // "Not registered in central at all" gets its own page instead of a
    // toast - central_lookup_failed (transient/network) stays on the
    // generic toast path, it's a different, retry-able case.
    if (info?.message === 'central_inactive') {
        return '/account-not-found';
    }
    return `/?error=${encodeURIComponent(info?.message || 'oauth_failed')}`;
}

const isCentralLookupError = (error) => {
    const baseUrl = error?.config?.baseURL;
    const path = error?.config?.url;
    return Boolean(
        baseUrl === process.env.MWS_DATA_CENTER_API_URL ||
        (typeof path === 'string' && /^\/(employees|students)\//.test(path))
    );
};

const ensureGoogleOAuthConfigured = (req, res, next) => {
    if (passport.googleOAuthConfigured) {
        return next();
    }

    const missingVariables = passport.googleOAuthStatus?.missingVariables || [];
    const callbackURL = passport.googleOAuthStatus?.callbackURL || null;

    return sendError(
        res,
        `Google OAuth is not configured${missingVariables.length ? `: missing ${missingVariables.join(', ')}` : ''}`,
        503,
        {
            missingVariables,
            callbackURL
        }
    );
};

// Google OAuth routes
router.get('/google',
    ...oauthMiddleware,
    ensureGoogleOAuthConfigured,
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        hd: 'millennia21.id' // Restrict to millennia21.id domain
    })
);

router.get('/google/callback',
    ...oauthMiddleware,
    ensureGoogleOAuthConfigured,
    (req, res, next) => {
        // Custom callback instead of { failureRedirect } so the specific
        // failure reason (set via done(null, false, info) in googleOAuthVerify)
        // reaches the frontend as ?error=<code> instead of a generic one.
        passport.authenticate('google', (err, user, info) => {
            if (err) {
                console.error('❌ Google OAuth error:', err);
                return res.redirect('/?error=oauth_failed');
            }
            if (!user) {
                return res.redirect(resolveOAuthFailureRedirect(info));
            }
            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    console.error('❌ Google OAuth session login error:', loginErr);
                    return res.redirect('/?error=oauth_failed');
                }
                next();
            });
        })(req, res, next);
    },
    async (req, res) => {
        try {
            console.log('✅ Google OAuth successful for user:', req.user.email);

            // Validate user exists in database and get authoritative user data
            const userModel = req.user?.constructor?.modelName === 'UserStudent' ? UserStudent : User;
            const dbUser = await userModel.findById(req.user._id).select('-password -googleProfile');

            if (!dbUser) {
                console.error('❌ User not found in database after OAuth:', req.user.email);
                return res.redirect('/?error=user_not_found');
            }

            // Check if user is active
            if (!dbUser.isActive) {
                console.error('❌ Inactive user attempted OAuth login:', req.user.email);
                return res.redirect('/?error=account_inactive');
            }

            // Update last login
            dbUser.lastLogin = new Date();
            await dbUser.save();

            // Log role validation for security
            console.log('🔐 Role validation for OAuth user:', {
                email: dbUser.email,
                role: dbUser.role,
                isHeadUnit: dbUser.role === 'head_unit',
                isDirectorate: dbUser.role === 'directorate',
                department: dbUser.department,
                unit: dbUser.unit
            });

            // Generate JWT token with database-validated user data
            const token = jwt.sign(
                {
                    userId: dbUser._id,
                    email: dbUser.email,
                    role: dbUser.role
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Send database-validated user data to frontend
            const userDataForFrontend = {
                ...buildRequestUser(dbUser),
                lastLogin: dbUser.lastLogin,
                isActive: dbUser.isActive,
                emailVerified: dbUser.emailVerified,
                // Add validation metadata
                validatedAt: new Date().toISOString(),
                authMethod: 'google_oauth'
            };

            // Redirect to frontend with validated user data
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const redirectTarget = dbUser.role === 'student'
                ? '/emotional-checkin'
                : (userDataForFrontend.mtssAccess?.hasAccess ? '/support-hub' : '/select-role');
            const redirectUrl = `${frontendUrl}/auth/callback#token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userDataForFrontend))}&redirect=${encodeURIComponent(redirectTarget)}`;

            const canViewDashboard = hasDashboardAccess(userDataForFrontend);

            // Debug log for FRONTEND_URL configuration
            console.log('🌐 OAuth redirect config:', {
                FRONTEND_URL_ENV: process.env.FRONTEND_URL || 'NOT SET (using fallback)',
                NODE_ENV: process.env.NODE_ENV || 'NOT SET',
                frontendUrl,
                redirectTarget
            });

            console.log('🔄 Redirecting to frontend with database-validated user data');
            console.log('📋 User role for dashboard access:', {
                role: dbUser.role,
                dashboardRole: userDataForFrontend.dashboardRole,
                delegatedFrom: userDataForFrontend.dashboardAccess?.delegatedFromEmail || null,
                hasDashboardAccess: canViewDashboard,
                hasMtssAccess: hasMtssAccess(userDataForFrontend),
                mtssRole: userDataForFrontend.mtssRole || null
            });

            res.redirect(redirectUrl);

        } catch (error) {
            console.error('❌ OAuth callback error:', error);
            res.redirect('/?error=oauth_failed');
        }
    }
);

// Hub token-relay SSO handoff. Hub already authenticated the user (its own
// Google login) and mints a short-lived, single-use, audience-scoped token
// asserting "this email"; we never trust anything beyond that email claim -
// every profile field still comes fresh from mws-data-center, same as the
// Google OAuth path above. On any failure this falls back to the same
// generic error redirects the OAuth flow already uses, so a failed relay
// token can't be distinguished from a failed OAuth attempt by the browser.
router.get('/sso', ssoLimiter, async (req, res) => {
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
        const dbUser = await resolveOrProvisionSsoUser(payload.sub);

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
// Passport session logout only applies when OAuth session is active.
router.post('/logout', (req, res) => {
    if (typeof req.logout === 'function') {
        req.logout((err) => {
            if (err) console.error('Passport logout error:', err);
        });
    }
    sendSuccess(res, 'Logged out successfully');
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
module.exports.resolveOAuthFailureRedirect = resolveOAuthFailureRedirect;
