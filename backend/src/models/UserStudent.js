const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    // Central's stable Person.id - see the matching note on User.js.
    centralPersonId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    centralEntitlementId: { type: String, unique: true, sparse: true, trim: true },
    centralEntitlementApplicationId: { type: String, trim: true },
    centralEntitlementOrganizationId: { type: String, trim: true, index: true },
    centralEntitlementRole: { type: String, trim: true },
    centralEntitlementPermissions: [{ type: String, trim: true }],
    centralEntitlementVersion: { type: Number, min: 0 },
    centralEntitlementUpdatedAt: { type: Date },
    password: {
        type: String,
        required: function () {
            // Not required for Hub SSO-provisioned accounts (they never set
            // a local password, or the legacy googleId - Hub owns identity
            // now) or accounts still carrying the old direct-Google-OAuth
            // googleId from before that migration.
            return !this.googleId && !this.ssoProvisioned;
        },
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['student'],
        default: 'student'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Incremented to force every previously-issued JWT for this user
    // invalid at once (see middleware/auth.js's authenticate) - the
    // back-channel session revocation Hub calls on logout bumps this
    // instead of trying to invalidate one specific token.
    sessionVersion: {
        type: Number,
        default: 0
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    googleProfile: {
        type: Object
    },
    // Set by ssoUserResolution.js when this account was created or last
    // logged in via Hub's SSO relay - exempts it from the password
    // requirement above, since Hub (not this app) owns the login flow.
    ssoProvisioned: {
        type: Boolean,
        default: false
    },
    username: {
        type: String,
        trim: true
    },
    nickname: {
        type: String,
        trim: true
    },
    // Central's exact Gender enum (mws-data-center/server/prisma/schema.prisma)
    // - no local "other" sentinel, Central itself only has MALE/FEMALE.
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE'],
        trim: true
    },
    // Central's exact StudentStatus enum - stored as-is, no local narrowing.
    status: {
        type: String,
        enum: ['REGISTERED', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'ARCHIVED'],
        trim: true
    },
    currentGrade: {
        type: String,
        trim: true
    },
    className: {
        type: String,
        trim: true
    },
    joinAcademicYear: {
        type: String,
        trim: true
    },
    // Only these three - a student is only ever enrolled in Elementary,
    // Junior High, or Kindergarten (confirmed with the product owner); the
    // rest of Central's units (Directorate, MAD Lab, Pelangi, CARE, BRIDGE,
    // COMPASS, RISE, SAFE, SHIELD) are staff-only. deriveUnitFromGrade
    // (studentUserHelpers.js) only ever derives one of these three anyway -
    // Operational/Finance never appeared in Central's real unit list at all.
    department: {
        type: String,
        enum: ['Elementary', 'Junior High', 'Kindergarten'],
        trim: true
    },
    // See the matching note on department above.
    unit: {
        type: String,
        enum: ['Elementary', 'Junior High', 'Kindergarten'],
        trim: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

studentUserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

studentUserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

studentUserSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = mongoose.model('UserStudent', studentUserSchema);
