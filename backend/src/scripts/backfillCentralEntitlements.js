require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const { validateEntitlement, entitlementProjection, projectionChanged } = require('../utils/centralEntitlement');

const apply = process.argv.includes('--apply');
const inputPath = process.env.CENTRAL_ENTITLEMENT_BACKFILL_FILE;

function validateBackfillRecord(record) {
    const centralPersonId = String(record?.central_person_id || '').trim();
    if (!centralPersonId) throw new Error('Every record requires central_person_id');
    if (record.source !== 'employee' && record.source !== 'student') {
        throw new Error(`Backfill source must be employee or student for ${centralPersonId}`);
    }
    return { centralPersonId, entitlement: validateEntitlement(record.entitlement) };
}

function assertNoEntitlementRollback(user, entitlement) {
    const currentVersion = user.centralEntitlementVersion;
    // Versions only compare within one entitlement.
    const sameEntitlement = user.centralEntitlementId === entitlement.id;
    if (sameEntitlement && Number.isFinite(currentVersion) && entitlement.version < currentVersion) {
        throw new Error(`Refusing entitlement version rollback for ${user.centralPersonId}: ${currentVersion} -> ${entitlement.version}`);
    }
}

async function main() {
    if (!inputPath) throw new Error('CENTRAL_ENTITLEMENT_BACKFILL_FILE is required');
    const records = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    if (!Array.isArray(records)) throw new Error('Backfill input must be a JSON array');

    await connectDB();
    const summary = { scanned: records.length, matched: 0, changed: 0, unchanged: 0, missing: 0 };

    for (const record of records) {
        const { centralPersonId, entitlement } = validateBackfillRecord(record);
        const Model = record.source === 'student' ? UserStudent : User;
        const user = await Model.findOne({ centralPersonId });
        if (!user) {
            summary.missing += 1;
            console.warn(`Missing ${record.source || 'employee'}: ${centralPersonId}`);
            continue;
        }

        summary.matched += 1;
        assertNoEntitlementRollback(user, entitlement);
        const projection = entitlementProjection(entitlement);
        if (!projectionChanged(user, projection)) {
            summary.unchanged += 1;
            continue;
        }

        summary.changed += 1;
        if (apply) {
            await Model.updateOne(
                { _id: user._id },
                { $set: projection, $inc: { sessionVersion: 1 } },
            );
        }
    }

    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...summary }, null, 2));
}

if (require.main === module) {
    main()
        .catch((error) => {
            console.error(error.message);
            process.exitCode = 1;
        })
        .finally(() => mongoose.connection.close());
}

module.exports = { validateBackfillRecord, assertNoEntitlementRollback };
