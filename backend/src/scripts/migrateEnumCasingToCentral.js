// One-time migration: remaps UserStudent.status/gender and User.gender from
// the old local lowercase vocabulary to Central's exact enum casing (see
// models/UserStudent.js, models/User.js, and utils/studentUserHelpers.js's
// normalizeStatus/normalizeGender for the schema/sync-side half of this
// change). employmentStatus needs no migration here - it was already
// storing Central's raw employment_type unmodified (no enum on this app's
// User.employmentStatus).
//
// A value with no Central equivalent (gender: 'other', or any status this
// app never had real data for) is cleared rather than guessed - Central
// doesn't know it either, so neither should the local copy.
//
// Dry-run by default (prints what would change, writes nothing). Pass
// --apply to actually write.
//
// Usage:
//   node src/scripts/migrateEnumCasingToCentral.js            (dry-run)
//   node src/scripts/migrateEnumCasingToCentral.js --apply    (writes)
require('dotenv').config();
const mongoose = require('mongoose');
const UserStudent = require('../models/UserStudent');
const User = require('../models/User');

const STATUS_MAP = {
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    graduated: 'GRADUATED',
    transferred: 'TRANSFERRED',
    pending: 'REGISTERED',
};

const GENDER_MAP = {
    male: 'MALE',
    female: 'FEMALE',
    // 'other' has no Central equivalent - cleared, not mapped.
};

const APPLY = process.argv.includes('--apply');

async function migrateUserStudents() {
    const docs = await UserStudent.find({}).select('email status gender');
    let statusChanged = 0;
    let genderChanged = 0;
    let genderCleared = 0;

    for (const doc of docs) {
        const update = {};
        const unset = {};

        if (doc.status && STATUS_MAP[doc.status]) {
            update.status = STATUS_MAP[doc.status];
            statusChanged += 1;
        }

        if (doc.gender) {
            if (GENDER_MAP[doc.gender]) {
                update.gender = GENDER_MAP[doc.gender];
                genderChanged += 1;
            } else {
                unset.gender = '';
                genderCleared += 1;
            }
        }

        if (!Object.keys(update).length && !Object.keys(unset).length) continue;

        console.log(`  UserStudent ${doc.email}: ${JSON.stringify(update)}${Object.keys(unset).length ? ` (clearing ${Object.keys(unset).join(', ')})` : ''}`);
        if (APPLY) {
            const ops = {};
            if (Object.keys(update).length) ops.$set = update;
            if (Object.keys(unset).length) ops.$unset = unset;
            await UserStudent.updateOne({ _id: doc._id }, ops, { runValidators: true });
        }
    }

    console.log(`UserStudent: ${docs.length} checked, ${statusChanged} status remapped, ${genderChanged} gender remapped, ${genderCleared} gender cleared (no Central equivalent)`);
}

async function migrateEmployeeUsers() {
    const docs = await User.find({}).select('email gender');
    let genderChanged = 0;
    let genderCleared = 0;

    for (const doc of docs) {
        if (!doc.gender) continue;

        const update = {};
        const unset = {};
        if (GENDER_MAP[doc.gender]) {
            update.gender = GENDER_MAP[doc.gender];
            genderChanged += 1;
        } else {
            unset.gender = '';
            genderCleared += 1;
        }

        console.log(`  User ${doc.email}: ${JSON.stringify(update)}${Object.keys(unset).length ? ` (clearing gender)` : ''}`);
        if (APPLY) {
            const ops = {};
            if (Object.keys(update).length) ops.$set = update;
            if (Object.keys(unset).length) ops.$unset = unset;
            await User.updateOne({ _id: doc._id }, ops, { runValidators: true });
        }
    }

    console.log(`User (employee): ${docs.length} checked, ${genderChanged} gender remapped, ${genderCleared} gender cleared (no Central equivalent)`);
}

async function run() {
    console.log(`${APPLY ? '✍️  Applying' : '👀 Dry-run of'} enum-casing migration to Central's casing\n`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}\n`);

    await migrateUserStudents();
    await migrateEmployeeUsers();

    if (!APPLY) {
        console.log('\nDry-run only - nothing was written. Re-run with --apply to write these changes.');
    }

    await mongoose.connection.close();
}

if (require.main === module) {
    run().catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exitCode = 1;
    });
}

module.exports = run;
