const { PERMISSIONS } = require('../constants/permissions');
const { SCOPE_MODE } = require('../constants/enums');

const has = (user, permission) => Array.isArray(user?.permissions) && user.permissions.includes(permission);
const unitOf = (user) => String(user?.unit || user?.department || '').trim();
const hasClasses = (user) => Array.isArray(user?.classes) && user.classes.some((item) => item?.grade || item?.className);

// Which students the person may see on the student dashboard. Reading it is one permission, how much of the
// school they see is another. With neither scope permission it is only the classes Central assigned to them.
function resolveStudentScope(user) {
    if (!has(user, PERMISSIONS.STUDENT_CHECKINS_READ)) return { mode: SCOPE_MODE.NONE };
    if (has(user, PERMISSIONS.STUDENT_CHECKINS_SCOPE_ALL)) return { mode: SCOPE_MODE.ALL };
    if (has(user, PERMISSIONS.STUDENT_CHECKINS_SCOPE_UNIT)) {
        return unitOf(user) ? { mode: SCOPE_MODE.UNIT, unit: unitOf(user) } : { mode: SCOPE_MODE.NONE };
    }
    return hasClasses(user) ? { mode: SCOPE_MODE.ASSIGNED } : { mode: SCOPE_MODE.NONE };
}

// Which staff the person may see on the staff dashboard. Central has no reports-to line, so without a scope
// permission there is nobody assigned to them and the dashboard stays closed.
function resolveStaffScope(user) {
    if (!has(user, PERMISSIONS.DASHBOARD_READ)) return { mode: SCOPE_MODE.NONE };
    if (has(user, PERMISSIONS.DASHBOARD_SCOPE_ALL)) return { mode: SCOPE_MODE.ALL };
    if (has(user, PERMISSIONS.DASHBOARD_SCOPE_UNIT)) {
        return unitOf(user) ? { mode: SCOPE_MODE.UNIT, unit: unitOf(user) } : { mode: SCOPE_MODE.NONE };
    }
    return { mode: SCOPE_MODE.NONE };
}

// Whether one staff member falls inside a staff scope.
function staffInScope(scope, target) {
    if (scope?.mode === SCOPE_MODE.ALL) return true;
    if (scope?.mode !== SCOPE_MODE.UNIT || !target) return false;
    return target.unit === scope.unit || target.department === scope.unit;
}

module.exports = { resolveStudentScope, resolveStaffScope, staffInScope };
