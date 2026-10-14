const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const { sendError } = require('../utils/response');
const { hubSession } = require('../utils/hubSession');
const { resolveSessionUser } = require('../utils/hubSessionUser');
const {
    buildDashboardAccessProfile,
    buildMtssAccessProfile,
    hasMtssAccess,
    hasMtssAdminAccess,
    hasMtssWriteAccess
} = require('../utils/accessControl');

const buildRequestUser = (user) => {
    const dashboardAccess = buildDashboardAccessProfile(user);
    const mtssAccess = buildMtssAccessProfile(user);

    return {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        username: user.username,
        employeeId: user.employeeId,
        department: user.department,
        jobLevel: user.jobLevel,
        unit: user.unit,
        jobPosition: user.jobPosition,
        employmentStatus: user.employmentStatus,
        googleId: user.googleId,
        classes: user.classes || [],
        currentGrade: user.currentGrade,
        className: user.className,
        nickname: user.nickname,
        gender: user.gender || '',
        joinAcademicYear: user.joinAcademicYear,
        reportsTo: user.reportsTo,
        subordinates: user.subordinates || [],
        dashboardRole: dashboardAccess.effectiveRole,
        dashboardAccess,
        mtssRole: mtssAccess.effectiveRole,
        mtssAccess,
        permissions: user.centralEntitlementPermissions || [],
        entitlementRole: user.centralEntitlementRole || null,
        entitlementId: user.centralEntitlementId || null,
        entitlementVersion: user.centralEntitlementVersion ?? null,
        entitlementOrganizationId: user.centralEntitlementOrganizationId || null,
    };
};

// Who is making the request: the Hub's access token (a cookie on the parent domain) says who they are, and Central
// says what they may do in this app. See utils/hubSession.js and utils/hubSessionUser.js.
const authenticate = async (req, res, next) => {
    try {
        const claims = await hubSession().fromCookieHeader(req.headers.cookie);
        if (!claims) {
            return sendError(res, 'Authentication required', 401);
        }

        const user = await resolveSessionUser(claims);
        if (!user) {
            return sendError(res, 'No access to Daily Check-in', 403);
        }
        if (!user.isActive) {
            return sendError(res, 'Account is deactivated', 403);
        }

        // Attach user to request object
        req.user = buildRequestUser(user);
        req.hubClaims = claims;

        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        return sendError(res, 'Could not verify your access. Try again shortly.', 503);
    }
};

const requirePermission = (permission) => (req, res, next) => {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    if (!req.user.permissions.includes(permission)) return sendError(res, 'Insufficient permissions', 403);
    next();
};

const requireAnyPermission = (...permissions) => (req, res, next) => {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    if (!permissions.some((permission) => req.user.permissions.includes(permission))) {
        return sendError(res, 'Insufficient permissions', 403);
    }
    next();
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 'Authentication required', 401);
        }

        if (!roles.includes(req.user.role)) {
            return sendError(res, 'Insufficient permissions', 403);
        }

        next();
    };
};

// Admin and above roles
const requireAdmin = authorize('admin', 'superadmin', 'directorate');
const requireMTSSAdmin = authorize('admin', 'superadmin', 'directorate', 'head_unit');
const requireMTSSAccess = (req, res, next) => {
    if (!req.user) {
        return sendError(res, 'Authentication required', 401);
    }
    if (!hasMtssAccess(req.user)) {
        return sendError(res, 'You do not have access to MTSS.', 403);
    }
    next();
};

const requireMTSSWriteAccess = (req, res, next) => {
    if (!req.user) {
        return sendError(res, 'Authentication required', 401);
    }
    if (!hasMtssWriteAccess(req.user)) {
        return sendError(res, 'You do not have write access to MTSS.', 403);
    }
    next();
};

const requireScopedMTSSAdmin = (req, res, next) => {
    if (!req.user) {
        return sendError(res, 'Authentication required', 401);
    }
    if (!hasMtssAdminAccess(req.user)) {
        return sendError(res, 'You do not have admin access to MTSS.', 403);
    }
    next();
};

// Super admin and directorate only
const requireSuperAdmin = authorize('superadmin', 'directorate');

// Staff and teacher access (for their own data) - now includes student for Google OAuth users
const requireStaffOrTeacher = authorize('staff', 'teacher', 'admin', 'superadmin', 'directorate', 'student', 'support_staff', 'se_teacher', 'head_unit', 'counselor');
const requireTeacherAccess = authorize('teacher', 'se_teacher');

// Any authenticated user
const requireAuthenticated = (req, res, next) => {
    if (!req.user) {
        return sendError(res, 'Authentication required', 401);
    }
    next();
};

module.exports = {
    authenticate,
    authorize,
    requireAdmin,
    requireMTSSAdmin,
    requireMTSSAccess,
    requireMTSSWriteAccess,
    requireScopedMTSSAdmin,
    requireSuperAdmin,
    requireStaffOrTeacher,
    requireTeacherAccess,
    requireAuthenticated,
    buildRequestUser,
    requirePermission,
    requireAnyPermission,
};
