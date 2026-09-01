const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function () {
            // Password is required only if not using Google OAuth
            return !this.googleId;
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
        enum: ['student', 'staff', 'teacher', 'admin', 'superadmin', 'directorate', 'support_staff', 'head_unit', 'se_teacher', 'counselor'],
        default: 'staff'
    },
    department: {
        // No enum — mws-data-center is the source of truth for unit names,
        // synced as-is on every login (see employeeCentralSync.js).
        type: String,
        trim: true
    },
    employeeId: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
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
    username: {
        type: String,
        trim: true
    },
    jobLevel: {
        // No enum — mws-data-center is the source of truth for job level
        // names, synced as-is on every login (see employeeCentralSync.js).
        type: String,
        trim: true
    },
    unit: {
        // No enum — mws-data-center is the source of truth for unit names,
        // synced as-is on every login (see employeeCentralSync.js).
        type: String,
        trim: true
    },
    jobPosition: {
        type: String,
        trim: true
    },
    employmentStatus: {
        // No enum — mws-data-center's EmploymentType has more values than we
        // used to allow (PART_TIME, FREELANCE, WFH); synced as-is now.
        type: String,
        default: 'Permanent'
    },
    joinDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    workingPeriod: {
        years: { type: Number, default: 0 },
        months: { type: Number, default: 0 },
        days: { type: Number, default: 0 }
    },
    reportsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    subordinates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    classes: [{
        grade: String,
        className: { type: String, trim: true },
        subject: String,
        role: { type: String, enum: ['Homeroom Teacher', 'Subject Teacher', 'Special Education Teacher', 'Principal'] }
    }],
    lastLogin: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        trim: true
    },
    mtssAccess: {
        enabled: {
            type: Boolean,
            default: undefined
        },
        accessLevel: {
            type: String,
            enum: ['observer', 'teacher', 'leader', 'admin'],
            default: null
        },
        note: {
            type: String,
            trim: true
        },
        grantedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        grantedAt: {
            type: Date
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);
