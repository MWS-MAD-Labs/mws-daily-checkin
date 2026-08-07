// mws-data-center's MasterJobLevel is a small controlled enum - maps
// cleanly onto this app's role field for everything except admin/superadmin
// (no HR equivalent - those stay manual-only, see EXEMPT_ROLES in
// employeeRosterSync.js and the googleOAuth.js JIT-provisioning path).
const JOB_LEVEL_TO_ROLE = {
    'Teacher': 'teacher',
    'SE Teacher': 'se_teacher',
    'Support Staff': 'support_staff',
    'Head Unit': 'head_unit',
    'Director': 'directorate',
    'Staff': 'staff',
};

// Returns null for missing/unrecognized job levels - callers decide what
// that means (both current call sites just leave role untouched/default).
function mapJobLevelToRole(jobLevel) {
    const key = typeof jobLevel === 'string' ? jobLevel.trim() : '';
    return JOB_LEVEL_TO_ROLE[key] || null;
}

module.exports = { JOB_LEVEL_TO_ROLE, mapJobLevelToRole };
