const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const {
    deriveUnitFromGrade,
    normalizeEmail
} = require('../utils/studentUserHelpers');
const { syncEmployeeFromCentral } = require('../utils/employeeCentralSync');
const { syncStudentFromCentral } = require('../utils/studentCentralSync');
const { mapJobLevelToRole } = require('../utils/jobLevelRoleMapping');

const googleOAuthConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URL
);

async function googleOAuthVerify(accessToken, refreshToken, profile, done) {
    try {
        const rawEmail = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        const normalizedEmail = normalizeEmail(rawEmail);

        console.log('?? Google OAuth Profile:', {
            id: profile.id,
            email: rawEmail,
            name: profile.displayName,
            domain: rawEmail ? rawEmail.split('@')[1] : ''
        });

        if (!normalizedEmail) {
            return done(new Error('Email is required for Google OAuth'), null);
        }

        // Check if student user exists with this Google ID
        let userStudent = await UserStudent.findOne({ googleId: profile.id });

        if (userStudent) {
            console.log('? Found existing student by Google ID:', userStudent._id);
            userStudent.email = normalizedEmail;
            userStudent.googleProfile = profile;
            userStudent.emailVerified = true;
            userStudent.lastLogin = new Date();
            if (!userStudent.username) {
                userStudent.username = normalizedEmail.split('@')[0];
            }
            if (!userStudent.unit || !userStudent.department) {
                const unitInfo = deriveUnitFromGrade(userStudent.currentGrade, userStudent.className);
                if (unitInfo.unit) userStudent.unit = unitInfo.unit;
                if (unitInfo.department) userStudent.department = unitInfo.department;
            }
            await userStudent.save();
            return done(null, userStudent);
        }

        // Check if student user exists with this email
        userStudent = await UserStudent.findOne({ email: normalizedEmail });

        if (userStudent) {
            console.log('? Found existing student by email, linking Google account:', userStudent._id);
            userStudent.googleId = profile.id;
            userStudent.googleProfile = profile;
            userStudent.emailVerified = true;
            userStudent.lastLogin = new Date();
            if (!userStudent.username) {
                userStudent.username = normalizedEmail.split('@')[0];
            }
            if (!userStudent.unit || !userStudent.department) {
                const unitInfo = deriveUnitFromGrade(userStudent.currentGrade, userStudent.className);
                if (unitInfo.unit) userStudent.unit = unitInfo.unit;
                if (unitInfo.department) userStudent.department = unitInfo.department;
            }
            await userStudent.save();
            return done(null, userStudent);
        }

        // No local student record by Google ID or email - mws-data-center
        // is the source of truth for student identity too (same posture
        // as the staff sync below), so a student who's never logged in
        // here before still gets auto-provisioned from their active
        // central record. A lookup miss (or a lookup error) here isn't
        // fatal - it just means this account isn't a student, so we fall
        // through to the staff check next.
        try {
            const centralStudentFields = await syncStudentFromCentral(normalizedEmail);
            if (centralStudentFields) {
                console.log('🆕 Creating new student user from mws-data-center record:', normalizedEmail);
                userStudent = new UserStudent({
                    ...centralStudentFields,
                    googleId: profile.id,
                    googleProfile: profile,
                    emailVerified: true,
                    lastLogin: new Date()
                });
                await userStudent.save();
                console.log('✅ New student created:', userStudent._id);
                return done(null, userStudent);
            }
        } catch (error) {
            console.error('⚠️ mws-data-center student lookup failed, falling back to staff check:', error.message);
        }

        // Check if staff user exists with this Google ID, then by email
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.findOne({ email: normalizedEmail });
        }

        // mws-data-center is the source of truth for employee identity —
        // every login re-validates against it instead of trusting the
        // Google profile or a stale local record alone.
        let centralFields;
        try {
            centralFields = await syncEmployeeFromCentral(normalizedEmail);
        } catch (error) {
            console.error('❌ mws-data-center lookup failed:', error.message);
            return done(new Error('Unable to verify employee with central database'), null);
        }

        if (!centralFields) {
            console.log('❌ No active employee record in mws-data-center for:', normalizedEmail);
            return done(new Error('Employee not found or inactive in central database'), null);
        }

        if (user) {
            console.log('✅ Found existing staff user, syncing from mws-data-center:', user._id);
            Object.assign(user, centralFields);
            user.googleId = profile.id;
            user.googleProfile = profile;
            user.emailVerified = true;
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
        }

        console.log('🆕 Creating new staff user from mws-data-center record:', normalizedEmail);
        const username = normalizedEmail.split('@')[0];
        user = new User({
            googleId: profile.id,
            email: normalizedEmail,
            username,
            role: mapJobLevelToRole(centralFields.jobLevel) || 'staff',
            ...centralFields,
            googleProfile: profile,
            isActive: true,
            emailVerified: true,
            lastLogin: new Date()
        });
        await user.save();
        console.log('✅ New user created:', user._id);
        return done(null, user);
    } catch (error) {
        console.error('? Google OAuth error:', error);
        return done(error, null);
    }
}

if (googleOAuthConfigured) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URL
    }, googleOAuthVerify));
} else {
    console.warn('⚠️ Google OAuth is not configured. OAuth routes will stay unavailable until credentials are provided.');
}

passport.serializeUser((user, done) => {
    if (!user) return done(null, null);
    done(null, { id: user.id, model: user.constructor?.modelName || 'User' });
});

passport.deserializeUser(async (id, done) => {
    try {
        if (!id) return done(null, null);
        const modelName = typeof id === 'object' && id.model ? id.model : 'User';
        const userId = typeof id === 'object' && id.id ? id.id : id;
        const Model = modelName === 'UserStudent' ? UserStudent : User;
        const user = await Model.findById(userId);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.googleOAuthConfigured = googleOAuthConfigured;
passport.googleOAuthVerify = googleOAuthVerify;

module.exports = passport;
