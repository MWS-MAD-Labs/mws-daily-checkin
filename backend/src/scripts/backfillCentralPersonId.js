// One-time backfill: fills centralPersonId on existing User/UserStudent
// docs by looking their current email up against mws-data-center, so
// /auth/revoke-session and SSO re-login can match them by Central's stable
// Person.id right away instead of waiting for each person's next login to
// self-heal it (see ssoUserResolution.js's centralPersonId-first lookup).
//
// Skips docs that already have centralPersonId (safe to re-run). A lookup
// miss (email no longer matches an active Central record, or the Central
// call itself fails) is logged and skipped, never treated as a reason to
// clear or touch the doc - this script only ever adds information.
//
// Dry-run by default (prints what would change, writes nothing). Pass
// --apply to actually write.
//
// Usage:
//   node src/scripts/backfillCentralPersonId.js            (dry-run)
//   node src/scripts/backfillCentralPersonId.js --apply    (writes)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const { lookupEmployeeByEmail, lookupStudentByEmail } = require('../services/mwsDataCenterClient');

const APPLY = process.argv.includes('--apply');

async function backfillEmployees() {
    const docs = await User.find({ centralPersonId: { $exists: false } }).select('email');
    let filled = 0;
    let missed = 0;
    let failed = 0;

    for (const doc of docs) {
        let centralEmployee;
        try {
            centralEmployee = await lookupEmployeeByEmail(doc.email);
        } catch (error) {
            console.error(`  ⚠️  User ${doc.email}: Central lookup failed - ${error.message}`);
            failed += 1;
            continue;
        }

        if (!centralEmployee?.person_id) {
            missed += 1;
            continue;
        }

        console.log(`  User ${doc.email}: centralPersonId -> ${centralEmployee.person_id}`);
        filled += 1;
        if (APPLY) {
            await User.updateOne({ _id: doc._id }, { $set: { centralPersonId: centralEmployee.person_id } });
        }
    }

    console.log(`User (employee): ${docs.length} missing centralPersonId, ${filled} filled, ${missed} no active Central match, ${failed} lookup failures`);
}

async function backfillStudents() {
    const docs = await UserStudent.find({ centralPersonId: { $exists: false } }).select('email');
    let filled = 0;
    let missed = 0;
    let failed = 0;

    for (const doc of docs) {
        let centralStudent;
        try {
            centralStudent = await lookupStudentByEmail(doc.email);
        } catch (error) {
            console.error(`  ⚠️  UserStudent ${doc.email}: Central lookup failed - ${error.message}`);
            failed += 1;
            continue;
        }

        if (!centralStudent?.person_id) {
            missed += 1;
            continue;
        }

        console.log(`  UserStudent ${doc.email}: centralPersonId -> ${centralStudent.person_id}`);
        filled += 1;
        if (APPLY) {
            await UserStudent.updateOne({ _id: doc._id }, { $set: { centralPersonId: centralStudent.person_id } });
        }
    }

    console.log(`UserStudent: ${docs.length} missing centralPersonId, ${filled} filled, ${missed} no active Central match, ${failed} lookup failures`);
}

async function run() {
    console.log(`${APPLY ? '✍️  Applying' : '👀 Dry-run of'} centralPersonId backfill\n`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ Connected to MongoDB: ${mongoose.connection.name}\n`);

    await backfillEmployees();
    await backfillStudents();

    if (!APPLY) {
        console.log('\nDry-run only - nothing was written. Re-run with --apply to write these changes.');
    }

    await mongoose.connection.close();
}

if (require.main === module) {
    run().catch((error) => {
        console.error('❌ Backfill failed:', error);
        process.exitCode = 1;
    });
}

module.exports = run;
