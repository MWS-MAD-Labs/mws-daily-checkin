const { lookupStudentByEmail } = require('../services/mwsDataCenterClient');
const { buildStudentUserPayload } = require('./studentUserHelpers');

// Returns the UserStudent fields to sync from mws-data-center, or null if
// the email has no active student record there (caller should treat this
// account as not-a-student, e.g. fall through to the employee check).
// mws-data-center's /students/lookup only ever returns ACTIVE students, so
// there's no status other than "active" to map here.
async function syncStudentFromCentral(email) {
    const centralStudent = await lookupStudentByEmail(email);
    if (!centralStudent) return null;

    return buildStudentUserPayload({
        email: centralStudent.email,
        name: centralStudent.full_name,
        nickname: centralStudent.nick_name,
        status: centralStudent.status,
        currentGrade: centralStudent.current_grade,
        className: centralStudent.current_class,
    });
}

module.exports = { syncStudentFromCentral };
