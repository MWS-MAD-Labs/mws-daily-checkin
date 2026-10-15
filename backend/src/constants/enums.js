// Values the code compares against. Keep them here so no gate or filter writes a string by hand.

// How much of the dashboard a person may see.
const SCOPE_MODE = Object.freeze({
    ALL: 'all',
    UNIT: 'unit',
    ASSIGNED: 'assigned',
    NONE: 'none',
});

// Same words as person_type in Central.
const PERSON_TYPE = Object.freeze({
    EMPLOYEE: 'employee',
    STUDENT: 'student',
});

// What kind of work a person does, worked out from Central's job level and position. It is a label for reports,
// the contact list and the AI prompt. It never opens or closes anything.
const JOB_KIND = Object.freeze({
    STAFF: 'staff',
    TEACHER: 'teacher',
    SE_TEACHER: 'se_teacher',
    SUPPORT_STAFF: 'support_staff',
    HEAD_UNIT: 'head_unit',
    DIRECTORATE: 'directorate',
    COUNSELOR: 'counselor',
    STUDENT: 'student',
});

// Whether Central still lists the person for this app.
const CENTRAL_STATUS = Object.freeze({
    ACTIVE: 'active',
    NO_ACCESS: 'no_access',
});

module.exports = { SCOPE_MODE, PERSON_TYPE, JOB_KIND, CENTRAL_STATUS };
