const { JOB_KIND, PERSON_TYPE } = require('../constants/enums');

// Central's job level names, as they are written there.
const BY_JOB_LEVEL = {
    'teacher': JOB_KIND.TEACHER,
    'se teacher': JOB_KIND.SE_TEACHER,
    'support staff': JOB_KIND.SUPPORT_STAFF,
    'head unit': JOB_KIND.HEAD_UNIT,
    'director': JOB_KIND.DIRECTORATE,
    'staff': JOB_KIND.STAFF,
};

// A few positions need their own kind whatever the level says.
const BY_JOB_POSITION = {
    "school's psychologist": JOB_KIND.COUNSELOR,
};

const clean = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

// Label only. Never read it to allow or deny anything.
function deriveJobKind({ personType, jobLevel, jobPosition } = {}) {
    if (personType === PERSON_TYPE.STUDENT) return JOB_KIND.STUDENT;
    return BY_JOB_POSITION[clean(jobPosition)] || BY_JOB_LEVEL[clean(jobLevel)] || JOB_KIND.STAFF;
}

module.exports = { deriveJobKind };
