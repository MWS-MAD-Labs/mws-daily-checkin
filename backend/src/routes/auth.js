const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const { sendSuccess, sendError } = require('../utils/response');
const { hasMtssAccess } = require('../utils/accessControl');
const { buildRequestUser } = require('../middleware/auth');

// Signing in and out belong to the Hub. The Hub keeps a short access token in a cookie on the parent domain, every
// request is checked against it (middleware/auth.js), and the page keeps it fresh (see frontend keepFresh).
// So this app has no sign-in, sign-out or session-revocation routes: signing out of the Hub signs out of every app.

// Where the Hub's card opens Daily Check-in. There is nothing to sign in to: the Hub's session is read from its
// cookie by the pages and the API. This only sends the browser to the app.
router.get('/sso', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174/daily-checkin';
    res.redirect(`${frontendUrl.replace(/\/$/, '')}/`);
});

// Get current user info
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
    try {
        // Fetch fresh user data from database for security
        const user = await Person.findById(req.user.id);

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
        console.log('🔐 /auth/me access - Role validation:', {
            userId: user._id,
            email: user.email,
            role: responseUser.role,
            staffDashboard: responseUser.staffDashboardScope.mode,
            studentDashboard: responseUser.studentDashboardScope.mode,
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
