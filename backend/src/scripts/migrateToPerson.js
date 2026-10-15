// One-time move from the two user collections (users for employees, userstudents for students) to the single
// people collection. Each person keeps the _id they had, so every reference in check-ins, notifications and
// support requests stays valid. The old collections are not touched, so going back is deploying the old code.
//
// Safe to run again: a person who already exists in people is left as it is, so a later sync is never overwritten.
// Dry-run by default (prints, writes nothing).
//
// Usage:
//   node src/scripts/migrateToPerson.js                dry-run
//   node src/scripts/migrateToPerson.js --apply        writes
//   node src/scripts/migrateToPerson.js --resolve      also asks Central for the person id of accounts without one
require('dotenv').config();
const mongoose = require('mongoose');
const { PERSON_TYPE, JOB_KIND, CENTRAL_STATUS } = require('../constants/enums');
const { deriveJobKind } = require('../utils/jobKind');

const KNOWN_KINDS = new Set(Object.values(JOB_KIND));

const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

const entitlementFields = (doc) => ({
    centralEntitlementId: doc.centralEntitlementId,
    centralEntitlementApplicationId: doc.centralEntitlementApplicationId,
    centralEntitlementOrganizationId: doc.centralEntitlementOrganizationId,
    centralEntitlementRole: doc.centralEntitlementRole,
    centralEntitlementPermissions: doc.centralEntitlementPermissions || [],
    centralEntitlementVersion: doc.centralEntitlementVersion,
    centralEntitlementUpdatedAt: doc.centralEntitlementUpdatedAt,
});

const common = (doc, personType, centralPersonId) => ({
    _id: doc._id,
    centralPersonId,
    email: String(doc.email).trim().toLowerCase(),
    name: doc.name,
    username: text(doc.username),
    nickname: text(doc.nickname),
    gender: doc.gender,
    personType,
    isActive: doc.isActive !== false,
    centralStatus: doc.centralEntitlementId ? CENTRAL_STATUS.ACTIVE : CENTRAL_STATUS.NO_ACCESS,
    lastLogin: doc.lastLogin,
    ...entitlementFields(doc),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});

function personFromEmployee(doc, centralPersonId = doc.centralPersonId) {
    const derived = deriveJobKind({ personType: PERSON_TYPE.EMPLOYEE, jobLevel: doc.jobLevel, jobPosition: doc.jobPosition });
    // The old role is only a fallback for a job level Central names in a way the mapping does not know.
    const jobKind = derived === JOB_KIND.STAFF && KNOWN_KINDS.has(doc.role) && doc.role !== JOB_KIND.STUDENT ? doc.role : derived;
    return {
        ...common(doc, PERSON_TYPE.EMPLOYEE, centralPersonId),
        jobKind,
        employeeId: text(doc.employeeId),
        department: text(doc.department),
        unit: text(doc.unit),
        jobLevel: text(doc.jobLevel),
        jobPosition: text(doc.jobPosition),
        employmentStatus: doc.employmentStatus,
        joinDate: doc.joinDate,
        endDate: doc.endDate,
        classes: doc.classes || [],
        mtssAccess: doc.mtssAccess,
    };
}

function personFromStudent(doc, centralPersonId = doc.centralPersonId) {
    return {
        ...common(doc, PERSON_TYPE.STUDENT, centralPersonId),
        jobKind: JOB_KIND.STUDENT,
        status: doc.status,
        currentGrade: text(doc.currentGrade),
        className: text(doc.className),
        joinAcademicYear: text(doc.joinAcademicYear),
        department: text(doc.department),
        unit: text(doc.unit),
    };
}

const strip = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

// Builds the plan from the two old collections. `resolvePersonId(email, personType)` may answer an id for an
// account that has none (only used with --resolve).
async function plan(db, { resolvePersonId } = {}) {
    const [employees, students, existing] = await Promise.all([
        db.collection('users').find({}).toArray(),
        db.collection('userstudents').find({}).toArray(),
        db.collection('people').find({}, { projection: { _id: 1, email: 1, centralPersonId: 1 } }).toArray(),
    ]);
    const already = new Set(existing.map((row) => String(row._id)));

    const result = { create: [], alreadyThere: 0, needsReview: [], duplicates: [] };
    // People already written count as taken, so a second run does not try to place the same email twice.
    const seenEmails = new Map(existing.map((row) => [row.email, String(row._id)]));
    const seenPersonIds = new Map(existing.map((row) => [row.centralPersonId, String(row._id)]));

    const rows = [
        ...employees.map((doc) => ({ doc, type: PERSON_TYPE.EMPLOYEE })),
        ...students.map((doc) => ({ doc, type: PERSON_TYPE.STUDENT })),
    ];

    for (const { doc, type } of rows) {
        if (already.has(String(doc._id))) {
            result.alreadyThere += 1;
            continue;
        }
        let personId = text(doc.centralPersonId);
        if (!personId && resolvePersonId) personId = await resolvePersonId(doc.email, type);
        if (!personId) {
            result.needsReview.push({ id: String(doc._id), email: doc.email, type, reason: 'no Central person id' });
            continue;
        }
        const email = String(doc.email).trim().toLowerCase();
        const clash = seenEmails.get(email) || seenPersonIds.get(personId);
        if (clash) {
            result.duplicates.push({ id: String(doc._id), email, type, sameAs: clash });
            continue;
        }
        seenEmails.set(email, String(doc._id));
        seenPersonIds.set(personId, String(doc._id));
        result.create.push(strip(type === PERSON_TYPE.EMPLOYEE ? personFromEmployee(doc, personId) : personFromStudent(doc, personId)));
    }
    return result;
}

async function apply(db, create) {
    if (create.length === 0) return 0;
    const operations = create.map((person) => {
        const { _id, ...rest } = person;
        return { updateOne: { filter: { _id }, update: { $setOnInsert: rest }, upsert: true } };
    });
    const result = await db.collection('people').bulkWrite(operations, { ordered: false });
    return result.upsertedCount;
}

async function main() {
    const write = process.argv.includes('--apply');
    const resolve = process.argv.includes('--resolve');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    let resolvePersonId;
    if (resolve) {
        const { lookupEmployeeByEmail, lookupStudentByEmail } = require('../services/mwsDataCenterClient');
        resolvePersonId = async (email, type) => {
            try {
                const found = type === PERSON_TYPE.STUDENT ? await lookupStudentByEmail(email) : await lookupEmployeeByEmail(email);
                return found?.person_id;
            } catch (error) {
                console.warn(`  lookup failed for ${email}: ${error.message}`);
                return undefined;
            }
        };
    }

    const result = await plan(db, { resolvePersonId });
    console.log(`to create: ${result.create.length} (${result.create.filter((p) => p.personType === PERSON_TYPE.EMPLOYEE).length} employees, ${result.create.filter((p) => p.personType === PERSON_TYPE.STUDENT).length} students)`);
    console.log(`already in people: ${result.alreadyThere}`);
    console.log(`needs review (not migrated): ${result.needsReview.length}`);
    result.needsReview.slice(0, 50).forEach((row) => console.log(`  ${row.type} ${row.email} (${row.id}): ${row.reason}`));
    console.log(`duplicates (not migrated): ${result.duplicates.length}`);
    result.duplicates.slice(0, 50).forEach((row) => console.log(`  ${row.type} ${row.email} (${row.id}) same person or email as ${row.sameAs}`));

    if (write) {
        const created = await apply(db, result.create);
        console.log(`written: ${created}`);
    } else {
        console.log('dry-run: nothing written. Run again with --apply to write.');
    }
    await mongoose.disconnect();
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { plan, apply, personFromEmployee, personFromStudent };
