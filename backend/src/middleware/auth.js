const { sendError } = require('../utils/response');
const { hubSession } = require('../utils/hubSession');
const { resolveSessionUser } = require('../utils/hubSessionUser');
const {
    buildMtssAccessProfile,
    hasMtssAccess,
    hasMtssAdminAccess,
    hasMtssWriteAccess
} = require('../utils/accessControl');
const { resolveStudentScope, resolveStaffScope } = require('../utils/accessScope');
const { SCOPE_MODE } = require('../constants/enums');

const buildRequestUser = (user) => {
    const mtssAccess = buildMtssAccessProfile(user);

    const requestUser = {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        jobKind: user.jobKind,
        workingPeriod: user.workingPeriod,
        joinDate: user.joinDate,
        username: user.username,
        employeeId: user.employeeId,
        department: user.department,
        jobLevel: user.jobLevel,
        unit: user.unit,
        jobPosition: user.jobPosition,
        employmentStatus: user.employmentStatus,
        classes: user.classes || [],
        currentGrade: user.currentGrade,
        className: user.className,
        nickname: user.nickname,
        gender: user.gender || '',
        joinAcademicYear: user.joinAcademicYear,
        mtssRole: mtssAccess.effectiveRole,
        mtssAccess,
        permissions: user.centralEntitlementPermissions || [],
        entitlementRole: user.centralEntitlementRole || null,
        entitlementId: user.centralEntitlementId || null,
        entitlementVersion: user.centralEntitlementVersion ?? null,
        entitlementOrganizationId: user.centralEntitlementOrganizationId || null,
        personType: user.personType,
    };

    // How much of each dashboard this person may open, worked out from what Central gave them.
    requestUser.studentDashboardScope = resolveStudentScope(requestUser);
    requestUser.staffDashboardScope = resolveStaffScope(requestUser);
    return requestUser;
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

// A route is gated by what Central gave the person, never by a role kept here. The guard remembers what it asks
// for so a test can check that every route has one.
const requireAnyPermission = (...permissions) => {
    const guard = (req, res, next) => {
        if (!req.user) return sendError(res, 'Authentication required', 401);
        if (!permissions.some((permission) => req.user.permissions.includes(permission))) {
            return sendError(res, 'Insufficient permissions', 403);
        }
        next();
    };
    guard.permissions = permissions;
    return guard;
};

const requirePermission = (permission) => requireAnyPermission(permission);

// Reading the dashboard is not enough: the person also needs a scope that shows somebody.
const requireStaffDashboardScope = (req, res, next) => {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    if (req.user.staffDashboardScope.mode === SCOPE_MODE.NONE) {
        return sendError(res, 'No staff are open to your dashboard', 403);
    }
    next();
};

const requireStudentDashboardScope = (req, res, next) => {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    if (req.user.studentDashboardScope.mode === SCOPE_MODE.NONE) {
        return sendError(res, 'No students are open to your dashboard', 403);
    }
    next();
};

module.exports = {
    authenticate,
    requireStaffDashboardScope,
    requireStudentDashboardScope,
    buildRequestUser,
    requirePermission,
    requireAnyPermission,
};
