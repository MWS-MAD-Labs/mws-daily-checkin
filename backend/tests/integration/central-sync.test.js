const mongoose = require('mongoose');
const Person = require('../../src/models/Person');
const CentralSyncState = require('../../src/models/CentralSyncState');
const { runSync, syncAccess, syncProfiles, syncIntervalMs } = require('../../src/jobs/centralSync');

const row = (over = {}) => ({
    id: 'ent-1',
    person_id: 'p-1',
    organization_id: 'org-test',
    role: 'TEACHER',
    permissions: ['checkin.self.read', 'student_checkins.read'],
    version: 1,
    person: { full_name: 'Teacher One', email: 'one@sync-test.id' },
    ...over,
});
const employee = (over = {}) => ({
    person_id: 'p-1', email: 'one@sync-test.id', full_name: 'Teacher One', employee_id: '01.01.001',
    job_level: 'Teacher', job_position: 'Math Teacher', unit: 'Elementary', employment_type: 'PERMANENT', gender: 'MALE', ...over,
});
const fakeApi = (over = {}) => ({
    getApplicationEntitlementKey: jest.fn().mockResolvedValue('key-1'),
    listApplicationEntitlements: jest.fn().mockResolvedValue({ rows: [row()], key: 'key-1' }),
    lookupEmployeeByPersonId: jest.fn().mockResolvedValue(employee()),
    lookupStudentByEmail: jest.fn().mockResolvedValue(null),
    listActiveEmployees: jest.fn().mockResolvedValue([employee()]),
    listStudentsByStatus: jest.fn().mockResolvedValue([]),
    listClassTeacherAssignments: jest.fn().mockResolvedValue([]),
    ...over,
});

describe('sync with Central', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });
    afterAll(async () => {
        await Person.deleteMany({ email: /@sync-test\.id$/ });
        await CentralSyncState.deleteMany({});
        await mongoose.connection.close();
    });
    beforeEach(async () => {
        await Person.deleteMany({ email: /@sync-test\.id$/ });
        await CentralSyncState.deleteMany({});
    });

    it('makes people Central lists even if they never signed in', async () => {
        const { summary } = await syncAccess(fakeApi());
        expect(summary).toMatchObject({ created: 1, updated: 0, revoked: 0 });
        const person = await Person.findOne({ centralPersonId: 'p-1' });
        expect(person).toMatchObject({ personType: 'employee', jobKind: 'teacher', unit: 'Elementary', centralStatus: 'active' });
        expect(person.centralEntitlementPermissions).toEqual(['checkin.self.read', 'student_checkins.read']);
    });

    it('updates a changed role, leaves an unchanged one, and revokes who Central no longer lists', async () => {
        await syncAccess(fakeApi());
        const same = await syncAccess(fakeApi());
        expect(same.summary).toMatchObject({ created: 0, updated: 0, unchanged: 1 });

        const changed = await syncAccess(fakeApi({ listApplicationEntitlements: jest.fn().mockResolvedValue({ rows: [row({ version: 2, permissions: ['checkin.self.read'] })], key: 'key-2' }) }));
        expect(changed.summary.updated).toBe(1);
        expect((await Person.findOne({ centralPersonId: 'p-1' })).centralEntitlementPermissions).toEqual(['checkin.self.read']);

        const gone = await syncAccess(fakeApi({ listApplicationEntitlements: jest.fn().mockResolvedValue({ rows: [], key: 'key-3' }) }));
        expect(gone.summary.revoked).toBe(1);
        const revoked = await Person.findOne({ centralPersonId: 'p-1' });
        expect(revoked.centralStatus).toBe('no_access');
        expect(revoked.centralEntitlementPermissions).toEqual([]);
    });

    it('counts somebody Central lists but knows as neither employee nor student, and makes no record', async () => {
        const api = fakeApi({ lookupEmployeeByPersonId: jest.fn().mockResolvedValue(null) });
        const { summary } = await syncAccess(api);
        expect(summary.unmapped).toBe(1);
        expect(await Person.countDocuments({ email: /@sync-test\.id$/ })).toBe(0);
    });

    it('reads the full list only when the key moved', async () => {
        const api = fakeApi();
        const first = await runSync({ api, now: new Date('2026-10-15T10:00:00Z') });
        expect(first.status).toBe('synced');
        expect(api.listApplicationEntitlements).toHaveBeenCalledTimes(1);

        const second = await runSync({ api, now: new Date('2026-10-15T10:01:00Z') });
        expect(second.status).toBe('unchanged');
        expect(api.listApplicationEntitlements).toHaveBeenCalledTimes(1);

        api.getApplicationEntitlementKey.mockResolvedValue('key-2');
        const third = await runSync({ api, now: new Date('2026-10-15T10:02:00Z') });
        expect(third.status).toBe('synced');
        expect(api.listApplicationEntitlements).toHaveBeenCalledTimes(2);
    });

    it('lets only one instance sync at a time', async () => {
        const slow = fakeApi({ getApplicationEntitlementKey: jest.fn(() => new Promise((resolve) => setTimeout(() => resolve('key-1'), 150))) });
        const now = new Date();
        const [a, b] = await Promise.all([runSync({ api: slow, now }), runSync({ api: fakeApi(), now })]);
        expect([a.status, b.status]).toContain('locked');
    });

    it('records the error and releases the lease when Central cannot be asked', async () => {
        const down = fakeApi({ getApplicationEntitlementKey: jest.fn().mockRejectedValue(new Error('Central is down')) });
        const result = await runSync({ api: down });
        expect(result).toMatchObject({ status: 'error', message: 'Central is down' });
        const state = await CentralSyncState.findById('daily-checkin');
        expect(state.lastError).toBe('Central is down');
        expect(state.lockedUntil).toBeNull();
    });

    it('copies unit, job and teaching classes from the profile lists, and deactivates who is gone', async () => {
        await syncAccess(fakeApi());
        const api = fakeApi({
            listActiveEmployees: jest.fn().mockResolvedValue([employee({ unit: 'Junior High' })]),
            listClassTeacherAssignments: jest.fn().mockResolvedValue([
                { employee_email: 'one@sync-test.id', grade_name: 'Grade 7', class_name: 'Coding', role: 'HOMEROOM' },
            ]),
        });
        const result = await syncProfiles(api);
        expect(result.updated).toBe(1);
        const person = await Person.findOne({ centralPersonId: 'p-1' });
        expect(person.unit).toBe('Junior High');
        expect(person.classes.map((c) => `${c.grade}|${c.className}|${c.role}`)).toEqual(['Grade 7|Coding|Homeroom Teacher']);

        const gone = await syncProfiles(fakeApi({ listActiveEmployees: jest.fn().mockResolvedValue([]) }));
        expect(gone.deactivated).toBe(1);
        expect((await Person.findOne({ centralPersonId: 'p-1' })).isActive).toBe(false);
    });

    it('never deactivates anyone when a list could not be read in full', async () => {
        await syncAccess(fakeApi());
        const result = await syncProfiles(fakeApi({ listActiveEmployees: jest.fn().mockRejectedValue(new Error('page 2 failed')) }));
        expect(result.warnings).toEqual(['Employees skipped: page 2 failed']);
        expect((await Person.findOne({ centralPersonId: 'p-1' })).isActive).toBe(true);
    });

    it('finds an employee by person id and a student by email, and keeps going when Central refuses one lookup', async () => {
        const refused = Object.assign(new Error('Request failed with status code 403'), {
            response: { status: 403, data: { message: "Forbidden: missing required scope 'students:read'" } },
        });
        const rows = [row(), row({ id: 'ent-2', person_id: 'p-2', person: { full_name: 'Kid', email: 'kid@sync-test.id' }, role: 'STUDENT' })];
        const api = fakeApi({
            listApplicationEntitlements: jest.fn().mockResolvedValue({ rows, key: 'k' }),
            lookupEmployeeByPersonId: jest.fn((id) => Promise.resolve(id === 'p-1' ? employee() : null)),
            lookupStudentByEmail: jest.fn().mockRejectedValue(refused),
        });
        const { summary, warnings } = await syncAccess(api);
        expect(api.lookupEmployeeByPersonId).toHaveBeenCalledWith('p-1');
        expect(api.lookupStudentByEmail).toHaveBeenCalledWith('kid@sync-test.id');
        expect(summary).toMatchObject({ created: 1, unmapped: 1 });
        expect(warnings).toEqual(["Daily's API token is missing the scope students:read"]);
    });

    it('skips only the list Central refuses, and says which', async () => {
        await syncAccess(fakeApi());
        const refused = Object.assign(new Error('403'), { response: { status: 403, data: { message: "Forbidden: missing required scope 'class_teacher_assignments:read'" } } });
        const api = fakeApi({
            listActiveEmployees: jest.fn().mockResolvedValue([employee({ unit: 'Junior High' })]),
            listClassTeacherAssignments: jest.fn().mockRejectedValue(refused),
        });
        const result = await syncProfiles(api);
        expect(result.skipped).toBe(false);
        expect(result.updated).toBe(1);
        expect(result.warnings).toEqual(["Class assignments skipped: Daily's API token is missing the scope class_teacher_assignments:read"]);
        expect((await Person.findOne({ centralPersonId: 'p-1' })).unit).toBe('Junior High');
    });

    it('stores the warnings with the sync status', async () => {
        const refused = Object.assign(new Error('403'), { response: { status: 403, data: { message: "Forbidden: missing required scope 'students:read'" } } });
        const api = fakeApi({ listStudentsByStatus: jest.fn().mockRejectedValue(refused) });
        const result = await runSync({ api });
        expect(result.warnings).toEqual(["Students skipped: Daily's API token is missing the scope students:read"]);
        expect((await CentralSyncState.findById('daily-checkin')).warnings).toEqual(result.warnings);
    });

    it('lets two people share one group entitlement id', async () => {
        const rows = [
            row({ id: 'group:staff', person_id: 'p-1' }),
            row({ id: 'group:staff', person_id: 'p-3', person: { full_name: 'Teacher Two', email: 'two@sync-test.id' } }),
        ];
        const api = fakeApi({
            listApplicationEntitlements: jest.fn().mockResolvedValue({ rows, key: 'k' }),
            lookupEmployeeByPersonId: jest.fn((id) => Promise.resolve(employee({ person_id: id, email: id === 'p-1' ? 'one@sync-test.id' : 'two@sync-test.id' }))),
        });
        const { summary } = await syncAccess(api);
        expect(summary.created).toBe(2);
    });

    it('reads the interval the way Exima does: 60 seconds, never under 15, 0 is off', () => {
        expect(syncIntervalMs(undefined)).toBe(60000);
        expect(syncIntervalMs('5')).toBe(15000);
        expect(syncIntervalMs('0')).toBe(0);
        expect(syncIntervalMs('abc')).toBe(60000);
        expect(syncIntervalMs('120')).toBe(120000);
    });
});
