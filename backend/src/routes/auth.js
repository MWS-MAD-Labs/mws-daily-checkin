const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const { sendSuccess, sendError } = require('../utils/response');
const { hasDashboardAccess, hasMtssAccess } = require('../utils/accessControl');
const { buildRequestUser } = require('../middleware/auth');

// Signing in and out belong to the Hub. The Hub keeps a short access token in a cookie on the parent domain, every
// request is checked against it (middleware/auth.js), and the page keeps it fresh (see frontend keepFresh).
// So this app has no sign-in, sign-out or session-revocation routes: signing out of the Hub signs out of every app.

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
