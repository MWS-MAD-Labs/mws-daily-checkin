const mongoose = require('mongoose');
const { plan, apply } = require('../../src/scripts/migrateToPerson');

const employee = {
    _id: new mongoose.Types.ObjectId(),
    email: 'Teacher.One@school.id',
    name: 'Teacher One',
    role: 'admin',
    employeeId: '01.01.001',
    jobLevel: 'Teacher',
    jobPosition: 'Math Teacher',
    unit: 'Elementary',
    department: 'Elementary',
    joinDate: new Date('2020-01-15'),
    centralPersonId: 'p-teacher',
    centralEntitlementId: 'ent-1',
    centralEntitlementPermissions: ['checkin.self.read'],
    classes: [{ grade: 'Grade 4', className: 'Cheetah' }],
    isActive: true,
};
const student = {
    _id: new mongoose.Types.ObjectId(),
    email: 'kid@school.id',
    name: 'Kid',
    role: 'student',
    currentGrade: 'Grade 4',
    className: 'Cheetah',
    unit: 'Elementary',
    centralPersonId: 'p-kid',
    isActive: true,
};
const noId = { _id: new mongoose.Types.ObjectId(), email: 'noid@school.id', name: 'No Id', role: 'staff' };
const sameEmail = { _id: new mongoose.Types.ObjectId(), email: 'kid@school.id', name: 'Kid Again', centralPersonId: 'p-kid-2' };

describe('migrate users to people', () => {
    let db;
    beforeAll(async () => {
        await mongoose.connect('mongodb://localhost:27017/integra-learn-test-migrate');
        db = mongoose.connection.db;
    });
    afterAll(async () => {
        await db.dropDatabase();
        await mongoose.disconnect();
    });
    beforeEach(async () => {
        await Promise.all(['users', 'userstudents', 'people'].map((name) => db.collection(name).deleteMany({})));
        await db.collection('users').insertMany([employee, noId]);
        await db.collection('userstudents').insertMany([student, sameEmail]);
    });

    it('plans without writing, and keeps what cannot be placed for review', async () => {
        const result = await plan(db);
        expect(result.create.map((p) => p.centralPersonId).sort()).toEqual(['p-kid', 'p-teacher']);
        expect(result.needsReview.map((r) => r.email)).toEqual(['noid@school.id']);
        expect(result.duplicates.map((r) => r.email)).toEqual(['kid@school.id']);
        expect(await db.collection('people').countDocuments()).toBe(0);
    });

    it('keeps the old _id and takes the job kind from Central, not from the old role', async () => {
        const result = await plan(db);
        await apply(db, result.create);
        const teacher = await db.collection('people').findOne({ _id: employee._id });
        expect(teacher).toMatchObject({ personType: 'employee', jobKind: 'teacher', email: 'teacher.one@school.id', unit: 'Elementary' });
        expect(teacher.centralEntitlementPermissions).toEqual(['checkin.self.read']);
        const kid = await db.collection('people').findOne({ _id: student._id });
        expect(kid).toMatchObject({ personType: 'student', jobKind: 'student', currentGrade: 'Grade 4' });
    });

    it('can run again without touching a person who is already there', async () => {
        await apply(db, (await plan(db)).create);
        await db.collection('people').updateOne({ _id: employee._id }, { $set: { unit: 'Changed By Sync' } });
        const again = await plan(db);
        expect(again.create).toHaveLength(0);
        expect(again.alreadyThere).toBe(2);
        await apply(db, again.create);
        expect((await db.collection('people').findOne({ _id: employee._id })).unit).toBe('Changed By Sync');
    });

    it('asks Central for the id of an account without one when told to', async () => {
        const result = await plan(db, { resolvePersonId: async (email) => (email === 'noid@school.id' ? 'p-noid' : undefined) });
        expect(result.create.map((p) => p.centralPersonId)).toContain('p-noid');
        expect(result.needsReview).toHaveLength(0);
    });
});
