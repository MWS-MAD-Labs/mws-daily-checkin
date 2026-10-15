const mongoose = require('mongoose');

jest.mock('../../src/services/mwsDataCenterClient', () => ({
    lookupApplicationEntitlement: jest.fn(),
}));
jest.mock('../../src/utils/employeeCentralSync', () => ({
    syncEmployeeFromCentral: jest.fn(),
    mapCentralEmployee: jest.fn(),
}));
jest.mock('../../src/utils/studentCentralSync', () => ({
    syncStudentFromCentral: jest.fn(),
}));

const { lookupApplicationEntitlement } = require('../../src/services/mwsDataCenterClient');
const { syncEmployeeFromCentral } = require('../../src/utils/employeeCentralSync');
const { resolveSessionUser, clearEntitlementCache } = require('../../src/utils/hubSessionUser');
const Person = require('../../src/models/Person');

const EMPLOYEE_FIELDS = {
    centralPersonId: 'person-session',
    name: 'Session Person',
    employeeId: '99.99.077',
    jobPosition: 'Staff',
    jobLevel: 'Staff',
    employmentStatus: 'Permanent',
    department: 'Operational',
    unit: 'Operational',
};

const entitlement = (over = {}) => ({
    id: 'ent-session',
    person_id: 'person-session',
    application_id: 'daily-checkin',
    organization_id: 'org-test',
    role: 'STAFF',
    permissions: ['checkin.self.read'],
    version: 1,
    is_active: true,
    ...over,
});
const claims = { sub: 'person-session', email: 'session-person@sso-test-checkin.millennia21.id', source: 'employee', tags: [] };

describe('resolveSessionUser', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });

    afterAll(async () => {
        await Person.deleteMany({ email: /@sso-test-checkin\.millennia21\.id$/ });
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        clearEntitlementCache();
        await Person.deleteMany({ email: /@sso-test-checkin\.millennia21\.id$/ });
        syncEmployeeFromCentral.mockResolvedValue({ ...EMPLOYEE_FIELDS });
    });

    test('gives nobody access when Central has nothing for them, or it is not active', async () => {
        lookupApplicationEntitlement.mockResolvedValueOnce(null);
        expect(await resolveSessionUser(claims)).toBeNull();
        clearEntitlementCache();
        lookupApplicationEntitlement.mockResolvedValueOnce(entitlement({ is_active: false }));
        expect(await resolveSessionUser(claims)).toBeNull();
    });

    test('gives nobody access for another organization', async () => {
        lookupApplicationEntitlement.mockResolvedValueOnce(entitlement({ organization_id: 'other-org' }));
        expect(await resolveSessionUser(claims)).toBeNull();
    });

    test('creates the local record on the first visit and keeps what Central allows', async () => {
        lookupApplicationEntitlement.mockResolvedValue(entitlement());
        const user = await resolveSessionUser(claims);
        expect(user.email).toBe(claims.email);
        expect(user.centralPersonId).toBe('person-session');
        expect(user.centralEntitlementPermissions).toEqual(['checkin.self.read']);
        expect(syncEmployeeFromCentral).toHaveBeenCalledTimes(1);
    });

    test('does not go back to Central for the record while nothing changed', async () => {
        lookupApplicationEntitlement.mockResolvedValue(entitlement());
        await resolveSessionUser(claims);
        clearEntitlementCache();
        await resolveSessionUser(claims);
        expect(syncEmployeeFromCentral).toHaveBeenCalledTimes(1);
    });

    test('keeps the answer for a minute, so most requests do not ask Central', async () => {
        lookupApplicationEntitlement.mockResolvedValue(entitlement());
        await resolveSessionUser(claims);
        await resolveSessionUser(claims);
        expect(lookupApplicationEntitlement).toHaveBeenCalledTimes(1);
    });

    test('brings the local record in line when Central changed what the person may do', async () => {
        lookupApplicationEntitlement.mockResolvedValue(entitlement());
        await resolveSessionUser(claims);
        clearEntitlementCache();
        lookupApplicationEntitlement.mockResolvedValue(entitlement({ version: 2, permissions: ['checkin.self.read', 'checkin.self.submit'] }));
        const user = await resolveSessionUser(claims);
        expect(user.centralEntitlementVersion).toBe(2);
        expect(user.centralEntitlementPermissions).toEqual(['checkin.self.read', 'checkin.self.submit']);
    });

    test('lets the caller tell "no access" from "Central could not be asked"', async () => {
        lookupApplicationEntitlement.mockRejectedValue(new Error('Central is down'));
        await expect(resolveSessionUser(claims)).rejects.toThrow('Central is down');
    });
});
