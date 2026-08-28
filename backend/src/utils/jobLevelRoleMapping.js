// mws-data-center's MasterJobLevel is a small controlled enum - maps
// cleanly onto this app's role field for everything except admin/superadmin
// (no HR equivalent - those stay manual-only).
//
// Kept only for scripts/syncLatestUserRoster.js, a manual local-file import
// tool with no Hub relay token in play at all (nothing to get tags from) -
// every SSO-driven path below uses deriveRoleFromCentralTags instead.
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

// Once Hub's relayed tags say someone is teaching-adjacent staff at all
// (tag "teacher" or the baseline "staff" every active employee gets), this
// is the only place left that needs to know this app's own
// sub-classification - job_level only fine-tunes which flavor of teaching
// staff they are once the outer bucket is "teacher". Unrecognized job_level
// values fall through to 'teacher' rather than 'staff', so an unmapped
// title never loses access - it only loses the cosmetic sub-label.
//
// Central has no fixed role vocabulary of its own - job_position/job_level
// are free-text, admin-editable master data. Hub already turns that text
// into a broad access-tag verdict for its own app catalog (see
// AppsService.accessTagsFor in mws-hub); relaying those signed tags here
// means this app agrees with Hub about the same person from the same
// Central data, instead of maintaining a second, narrower dictionary that
// can silently miss a job title Hub already recognizes - this is what
// JOB_LEVEL_TO_ROLE used to do on its own: anyone outside its 6-entry table
// (a Principal, a Director) silently fell to the 'staff' default.
const TEACHER_FAMILY_BY_JOB_LEVEL = {
    'Teacher': 'teacher',
    'SE Teacher': 'se_teacher',
    'Support Staff': 'support_staff',
    'Staff': 'staff',
};

function deriveRoleFromCentralTags(tags, jobLevel) {
    const tagSet = new Set(Array.isArray(tags) ? tags : []);
    const level = typeof jobLevel === 'string' ? jobLevel.trim() : '';

    if (tagSet.has('director')) return 'directorate';
    if (tagSet.has('head-unit') || tagSet.has('principal')) return 'head_unit';
    if (tagSet.has('admin')) return 'admin';
    if (tagSet.has('teacher') || tagSet.has('staff') || tagSet.has('employee')) {
        return TEACHER_FAMILY_BY_JOB_LEVEL[level] || 'teacher';
    }

    return null;
}

module.exports = {
    JOB_LEVEL_TO_ROLE,
    mapJobLevelToRole,
    TEACHER_FAMILY_BY_JOB_LEVEL,
    deriveRoleFromCentralTags,
};
