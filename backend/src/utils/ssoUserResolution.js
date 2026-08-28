const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const { normalizeEmail, deriveUnitFromGrade } = require('./studentUserHelpers');
const { syncEmployeeFromCentral } = require('./employeeCentralSync');
const { syncStudentFromCentral } = require('./studentCentralSync');
const { deriveRoleFromCentralTags } = require('./jobLevelRoleMapping');

// superadmin has no Central/Hub concept at all - it can only ever be
// granted locally, so the automated sync must never downgrade it back to
// whatever Central-derived role would otherwise apply.
function nextRole(derivedRole, existingRole) {
    if (existingRole === 'superadmin') return existingRole;
    return derivedRole || existingRole || 'staff';
}

// Resolves (or auto-provisions) a local user record for an email Hub has
// already authenticated via its own Google login. Mirrors
// googleOAuthVerify's central-lookup-first resolution order (student, then
// staff) minus the Google-profile-specific bits - there's no googleId to
// link here, and every field still comes from mws-data-center, never from
// the relay token itself (only the access-tag verdict is trusted from the
// token - see mws-hub's sso-relay.ts for why). Returns the saved user doc,
// or null if the email has no active record in either the local DB or
// Central.
async function resolveOrProvisionSsoUser(rawEmail, relayClaims = {}) {
    const email = normalizeEmail(rawEmail);
    if (!email) return null;

    const tags = Array.isArray(relayClaims.tags) ? relayClaims.tags : [];

    let userStudent = await UserStudent.findOne({ email });
    if (userStudent) {
        userStudent.emailVerified = true;
        userStudent.lastLogin = new Date();
        userStudent.ssoProvisioned = true;
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
                ssoProvisioned: true,
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

    const derivedRole = deriveRoleFromCentralTags(tags, centralFields.jobLevel);

    if (user) {
        Object.assign(user, centralFields);
        user.role = nextRole(derivedRole, user.role);
        user.isActive = true;
        user.emailVerified = true;
        user.lastLogin = new Date();
        user.ssoProvisioned = true;
        await user.save();
        return user;
    }

    user = new User({
        email,
        username: email.split('@')[0],
        role: derivedRole || 'staff',
        ...centralFields,
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(),
        ssoProvisioned: true,
    });
    await user.save();
    return user;
}

module.exports = { resolveOrProvisionSsoUser, nextRole };
