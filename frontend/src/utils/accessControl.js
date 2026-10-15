import { ASSISTANT_PROFILE, DASHBOARD, PERSON_TYPE, SCOPE_MODE } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';

// Everything a person may open comes from the permissions Central gave them, plus the dashboard scopes the
// server worked out from those permissions (see backend utils/accessScope.js). Nothing here reads a role.

export const hasPermission = (user, permission) => (
    Array.isArray(user?.permissions) && user.permissions.includes(permission)
);

export const hasAnyPermission = (user, permissions = []) => (
    permissions.some((permission) => hasPermission(user, permission))
);

export const isStudent = (user) => user?.personType === PERSON_TYPE.STUDENT;

const scopeOf = (user, dashboard) => (
    dashboard === DASHBOARD.STUDENT ? user?.studentDashboardScope : user?.staffDashboardScope
);

// 'all', 'unit', 'assigned' or 'none'.
export const getDashboardScopeMode = (user, dashboard) => scopeOf(user, dashboard)?.mode || SCOPE_MODE.NONE;

export const hasDashboard = (user, dashboard) => getDashboardScopeMode(user, dashboard) !== SCOPE_MODE.NONE;

// How the AI assistant should treat this person. Derived from permissions, never stored.
export const getAssistantProfile = (user) => {
    if (isStudent(user)) return ASSISTANT_PROFILE.STUDENT;
    if (hasPermission(user, PERMISSIONS.USERS_READ)) return ASSISTANT_PROFILE.ADMIN;
    if (hasDashboard(user, DASHBOARD.STAFF)) return ASSISTANT_PROFILE.LEADER;
    if (hasDashboard(user, DASHBOARD.STUDENT)) return ASSISTANT_PROFILE.TEACHER;
    return ASSISTANT_PROFILE.STAFF;
};

export const hasEmotionalDashboardAccess = (user) => hasDashboard(user, DASHBOARD.STAFF);
