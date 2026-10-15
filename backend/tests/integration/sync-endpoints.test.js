const request = require('supertest');
const mongoose = require('mongoose');
const { cookieFor } = require('../helpers/hubTestSession');

jest.mock('../../src/utils/hubSession', () => require('../helpers/hubTestSession').hubSessionModule);
jest.mock('../../src/utils/hubSessionUser', () => require('../helpers/hubTestSession').hubSessionUserModule);
jest.mock('../../src/jobs/centralSync', () => ({
    runSync: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
}));

const { app } = require('../../src/app');
const Person = require('../../src/models/Person');
const SyncStatus = require('../../src/models/SyncStatus');
const { runSync } = require('../../src/jobs/centralSync');

describe('Manual Sync Now endpoints', () => {
    let agent;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });

    afterAll(async () => {
        await Person.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await Person.deleteMany({});
        await SyncStatus.deleteMany({});
        runSync.mockResolvedValue({
            status: 'synced',
            summary: { created: 1, updated: 1, revoked: 0 },
            profiles: { updated: 2, deactivated: 0, reactivated: 0, skipped: false },
        });

        const user = await Person.create({
            email: 'sync-test@school.com',
            name: 'Sync Test User',
            personType: 'employee',
            centralPersonId: 'sync-person',
            centralEntitlementId: 'ent-sync-test',
            centralEntitlementApplicationId: 'daily-checkin',
            centralEntitlementOrganizationId: 'org-test',
            centralEntitlementRole: 'operator',
            centralEntitlementPermissions: ['sync.read', 'sync.run'],
            centralEntitlementVersion: 1,
        });
        agent = request.agent(app);
        agent.jar.setCookie(cookieFor('sync-person'));
    });

    it('reports no run yet when nobody has ever triggered a sync', async () => {
        const response = await agent.get('/api/v1/sync/status');
        expect(response.status).toBe(200);
        expect(response.body.data.isRunning).toBe(false);
        expect(response.body.data.lastTriggeredAt).toBeNull();
        expect(response.body.data.cooldownRemainingSeconds).toBe(0);
    });

    it('rejects an unauthenticated status/trigger call', async () => {
        const status = await request(app).get('/api/v1/sync/status');
        expect(status.status).toBe(401);
        const trigger = await request(app).post('/api/v1/sync/trigger');
        expect(trigger.status).toBe(401);
    });

    it('runs the sync once and reports a merged result on trigger', async () => {
        const response = await agent.post('/api/v1/sync/trigger');

        expect(response.status).toBe(200);
        expect(runSync).toHaveBeenCalledWith({ force: true });
        expect(response.body.data.lastResult.access.updated).toBe(2);
        expect(response.body.data.lastResult.profiles.updated).toBe(2);
        expect(response.body.data.lastTriggeredBy).toBe('sync-test@school.com');
        expect(response.body.data.cooldownRemainingSeconds).toBeGreaterThan(0);
    });

    it('rejects a second trigger within the cooldown window without running the jobs again', async () => {
        await agent.post('/api/v1/sync/trigger');
        jest.clearAllMocks();

        const response = await agent.post('/api/v1/sync/trigger');

        expect(response.status).toBe(429);
        expect(runSync).not.toHaveBeenCalled();
        expect(response.body.errors.cooldownRemainingSeconds).toBeGreaterThan(0);
    });

    it('collapses two near-simultaneous triggers into a single real run', async () => {
        const [first, second] = await Promise.all([
            agent.post('/api/v1/sync/trigger'),
            agent.post('/api/v1/sync/trigger'),
        ]);

        const statuses = [first.status, second.status].sort();
        expect(statuses).toEqual([200, 429]);
        expect(runSync).toHaveBeenCalledTimes(1);
    });
});
