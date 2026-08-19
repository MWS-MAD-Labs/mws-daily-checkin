const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const { normalizeEmail, deriveUnitFromGrade } = require('./studentUserHelpers');
const { syncEmployeeFromCentral } = require('./employeeCentralSync');
const { syncStudentFromCentral } = require('./studentCentralSync');
const { mapJobLevelToRole } = require('./jobLevelRoleMapping');

// Resolves (or auto-provisions) a local user record for an email Hub has
// already authenticated via its own Google login. Mirrors
// googleOAuthVerify's central-lookup-first resolution order (student, then
// staff) minus the Google-profile-specific bits - there's no googleId to
// link here, and every field still comes from mws-data-center, never from
// the relay token itself. Returns the saved user doc, or null if the email
// has no active record in either the local DB or Central.
async function resolveOrProvisionSsoUser(rawEmail) {
    const email = normalizeEmail(rawEmail);
    if (!email) return null;

    let userStudent = await UserStudent.findOne({ email });
    if (userStudent) {
        userStudent.emailVerified = true;
        userStudent.lastLogin = new Date();
        if (!userStudent.unit || !userStudent.department) {
            const unitInfo = deriveUnitFromGrade(userStudent.currentGrade, userStudent.className);
            if (unitInfo.unit) userStudent.unit = unitInfo.unit;
            if (unitInfo.department) userStudent.department = unitInfo.department;
        }
        await userStudent.save();
        return userStudent;
    }

    // A lookup miss or error here just means this account isn't a student -
    // fall through to the staff check, same as googleOAuthVerify.
    try {
        const centralStudentFields = await syncStudentFromCentral(email);
        if (centralStudentFields) {
            userStudent = new UserStudent({
                ...centralStudentFields,
                emailVerified: true,
                lastLogin: new Date(),
            });
            await userStudent.save();
            return userStudent;
        }
    } catch (error) {
        console.error('⚠️ SSO student lookup failed, falling back to staff check:', error.message);
    }

    let user = await User.findOne({ email });

    // Staff identity is re-validated against Central on every login, same
    // posture as Google OAuth and manual login - a network failure here
    // propagates so the caller can tell "not found" apart from "couldn't check".
    const centralFields = await syncEmployeeFromCentral(email);
    if (!centralFields) {
        return null;
    }

    if (user) {
        Object.assign(user, centralFields);
        user.emailVerified = true;
        user.lastLogin = new Date();
        await user.save();
        return user;
    }

    user = new User({
        email,
        username: email.split('@')[0],
        role: mapJobLevelToRole(centralFields.jobLevel) || 'staff',
        ...centralFields,
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(),
    });
    await user.save();
    return user;
}

module.exports = { resolveOrProvisionSsoUser };
