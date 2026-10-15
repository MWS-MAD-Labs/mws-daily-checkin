const request = require('supertest');
const mongoose = require('mongoose');
const { cookieFor } = require('../helpers/hubTestSession');

jest.mock('../../src/utils/hubSession', () => require('../helpers/hubTestSession').hubSessionModule);
jest.mock('../../src/utils/hubSessionUser', () => require('../helpers/hubTestSession').hubSessionUserModule);

const { app } = require('../../src/app');
const Person = require('../../src/models/Person');
const CentralSyncState = require('../../src/models/CentralSyncState');

const entitlement = (permissions) => ({
    centralEntitlementId: 'ent-sync-status',
    centralEntitlementApplicationId: 'daily-checkin',
    centralEntitlementOrganizationId: 'org-test',
    centralEntitlementRole: 'operator',
    centralEntitlementPermissions: permissions,
    centralEntitlementVersion: 1,
});

describe('sync status', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });
    afterAll(async () => {
        await Person.deleteMany({ email: /@sync-status\.id$/ });
        await CentralSyncState.deleteMany({});
        await mongoose.connection.close();
    });
    beforeEach(async () => {
        await Person.deleteMany({ email: /@sync-status\.id$/ });
        await CentralSyncState.deleteMany({});
        await Person.create({ email: 'reader@sync-status.id', name: 'Reader', personType: 'employee', centralPersonId: 'reader', ...entitlement(['sync.read']) });
    });

    it('reports what the last sync saw, warnings included', async () => {
        await CentralSyncState.create({
            _id: 'daily-checkin',
            checkedAt: new Date(),
            syncedAt: new Date(),
            lastError: null,
            warnings: ['Students skipped: Daily\'s API token is missing the scope students:read'],
        });
        const response = await request(app).get('/api/v1/sync/status').set('Cookie', cookieFor('reader'));
        expect(response.status).toBe(200);
        expect(response.body.data.warnings).toHaveLength(1);
        expect(response.body.data.lastError).toBeNull();
    });

    it('needs the sync.read permission and has no way to start a sync by hand', async () => {
        const noAuth = await request(app).get('/api/v1/sync/status');
        expect(noAuth.status).toBe(401);
        const trigger = await request(app).post('/api/v1/sync/trigger').set('Cookie', cookieFor('reader'));
        expect(trigger.status).toBe(404);
    });
});
