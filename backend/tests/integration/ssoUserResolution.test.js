const mongoose = require('mongoose');

jest.mock('../../src/utils/studentCentralSync', () => ({
    syncStudentFromCentral: jest.fn(),
}));
jest.mock('../../src/utils/employeeCentralSync', () => ({
    syncEmployeeFromCentral: jest.fn(),
}));

const { syncStudentFromCentral } = require('../../src/utils/studentCentralSync');
const { syncEmployeeFromCentral } = require('../../src/utils/employeeCentralSync');
const { resolveOrProvisionSsoUser } = require('../../src/utils/ssoUserResolution');
const User = require('../../src/models/User');
const UserStudent = require('../../src/models/UserStudent');

const EMPLOYEE_FIELDS = {
    name: 'Test Staff',
    employeeId: '99.99.002',
    jobPosition: 'Staff',
    jobLevel: 'Staff',
    employmentStatus: 'Permanent',
    department: 'Operational',
    unit: 'Operational',
};

// Mirrors buildStudentUserPayload's real output shape (studentUserHelpers.js)
// since syncStudentFromCentral is mocked wholesale here, not just its
// Central HTTP call - UserStudent.email/role are required fields set from
// this object directly (new UserStudent({ ...centralStudentFields })), not
// supplied separately the way tryResolveAsEmployee supplies User.email.
const STUDENT_FIELDS = {
    email: 'student@sso-test-checkin.millennia21.id',
    name: 'Test Student',
    role: 'student',
    currentGrade: 'Grade 5',
    className: 'Grade 5 - Orion',
};

describe('resolveOrProvisionSsoUser - source-hinted lookup order', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await User.deleteMany({ email: /@sso-test-checkin\.millennia21\.id$/ });
        await UserStudent.deleteMany({ email: /@sso-test-checkin\.millennia21\.id$/ });
    });

    test("source: 'employee' resolves without ever calling the student lookup", async () => {
        syncEmployeeFromCentral.mockResolvedValue(EMPLOYEE_FIELDS);

        const user = await resolveOrProvisionSsoUser('staff@sso-test-checkin.millennia21.id', {
            tags: ['employee', 'staff'],
            source: 'employee',
        });

        expect(user).not.toBeNull();
        expect(syncEmployeeFromCentral).toHaveBeenCalledTimes(1);
        expect(syncStudentFromCentral).not.toHaveBeenCalled();
    });

    test("source: 'student' resolves without ever calling the employee lookup", async () => {
        syncStudentFromCentral.mockResolvedValue(STUDENT_FIELDS);

        const student = await resolveOrProvisionSsoUser('student@sso-test-checkin.millennia21.id', {
            tags: [],
            source: 'student',
        });

        expect(student).not.toBeNull();
        expect(student.name).toBe('Test Student');
        expect(syncStudentFromCentral).toHaveBeenCalledTimes(1);
        expect(syncEmployeeFromCentral).not.toHaveBeenCalled();
    });

    test("source: 'employee' falls through to the student check when the hint misses", async () => {
        syncEmployeeFromCentral.mockResolvedValue(null);
        syncStudentFromCentral.mockResolvedValue({
            ...STUDENT_FIELDS,
            email: 'mislabeled@sso-test-checkin.millennia21.id',
        });

        const result = await resolveOrProvisionSsoUser('mislabeled@sso-test-checkin.millennia21.id', {
            tags: [],
            source: 'employee',
        });

        expect(result).not.toBeNull();
        expect(result.name).toBe('Test Student');
        expect(syncEmployeeFromCentral).toHaveBeenCalledTimes(1);
        expect(syncStudentFromCentral).toHaveBeenCalledTimes(1);
    });

    test('no source hint falls back to the original student-first order', async () => {
        syncStudentFromCentral.mockResolvedValue(null);
        syncEmployeeFromCentral.mockResolvedValue(EMPLOYEE_FIELDS);

        const user = await resolveOrProvisionSsoUser('legacy-caller@sso-test-checkin.millennia21.id', {
            tags: ['employee'],
        });

        expect(user).not.toBeNull();
        expect(syncStudentFromCentral).toHaveBeenCalledTimes(1);
        expect(syncEmployeeFromCentral).toHaveBeenCalledTimes(1);
    });

    // The actual regression this exists for: Central's email is editable,
    // so a login after an email change must still find the same account by
    // centralPersonId (Hub relay token's `sub`) instead of creating a
    // second, duplicate one under the new email.
    test('finds an existing employee by centralPersonId even when the live login email has changed', async () => {
        const existing = await new User({
            email: 'before-rename@sso-test-checkin.millennia21.id',
            centralPersonId: 'person-rename-1',
            name: 'Test Staff',
            role: 'staff',
            ssoProvisioned: true,
        }).save();

        syncEmployeeFromCentral.mockResolvedValue({
            ...EMPLOYEE_FIELDS,
            email: 'after-rename@sso-test-checkin.millennia21.id',
            centralPersonId: 'person-rename-1',
        });

        const user = await resolveOrProvisionSsoUser('after-rename@sso-test-checkin.millennia21.id', {
            tags: ['employee'],
            source: 'employee',
            personId: 'person-rename-1',
        });

        expect(user._id.toString()).toBe(existing._id.toString());
        expect(user.email).toBe('after-rename@sso-test-checkin.millennia21.id');
        expect(await User.countDocuments({ centralPersonId: 'person-rename-1' })).toBe(1);
    });

    test('finds an existing student by centralPersonId even when the live login email has changed', async () => {
        const existing = await new UserStudent({
            email: 'before-rename@sso-test-checkin.millennia21.id',
            centralPersonId: 'person-rename-2',
            name: 'Test Student',
            role: 'student',
            ssoProvisioned: true,
        }).save();

        syncStudentFromCentral.mockResolvedValue({
            ...STUDENT_FIELDS,
            email: 'after-rename-student@sso-test-checkin.millennia21.id',
            centralPersonId: 'person-rename-2',
        });

        const student = await resolveOrProvisionSsoUser('after-rename-student@sso-test-checkin.millennia21.id', {
            tags: [],
            source: 'student',
            personId: 'person-rename-2',
        });

        expect(student._id.toString()).toBe(existing._id.toString());
        expect(student.email).toBe('after-rename-student@sso-test-checkin.millennia21.id');
        expect(await UserStudent.countDocuments({ centralPersonId: 'person-rename-2' })).toBe(1);
    });
});
