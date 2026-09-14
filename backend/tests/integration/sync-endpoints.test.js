const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../../src/utils/employeeCentralSync', () => ({
    syncEmployeeFromCentral: jest.fn().mockResolvedValue({
        name: 'Test User',
        employeeId: '99.99.001',
        jobPosition: 'Staff',
        jobLevel: 'Staff',
        employmentStatus: 'Permanent',
        department: 'Operational',
        unit: 'Operational',
    }),
}));

jest.mock('../../src/jobs/studentRosterSync', () => ({
    syncStudentRoster: jest.fn(),
}));
jest.mock('../../src/jobs/employeeRosterSync', () => ({
    syncEmployeeRoster: jest.fn(),
}));

const { app } = require('../../src/app');
const User = require('../../src/models/User');
const SyncStatus = require('../../src/models/SyncStatus');
const { syncStudentRoster } = require('../../src/jobs/studentRosterSync');
const { syncEmployeeRoster } = require('../../src/jobs/employeeRosterSync');

describe('Manual Sync Now endpoints', () => {
    let agent;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await User.deleteMany({});
        await SyncStatus.deleteMany({});
        syncStudentRoster.mockResolvedValue({ checked: 10, updated: 2, deactivated: 0, skipped: false });
        syncEmployeeRoster.mockResolvedValue({ checked: 5, updated: 1, deactivated: 0, roleDriftDetected: 0, skipped: false });

        await User.create({
            email: 'sync-test@school.com',
            password: 'password123',
            name: 'Sync Test User',
            role: 'staff',
        });
        agent = request.agent(app);
        await agent.post('/auth/login').send({ email: 'sync-test@school.com', password: 'password123' });
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

    it('runs every roster job and reports a merged result on trigger', async () => {
        const response = await agent.post('/api/v1/sync/trigger');

        expect(response.status).toBe(200);
        expect(syncStudentRoster).toHaveBeenCalledTimes(1);
        expect(syncEmployeeRoster).toHaveBeenCalledTimes(1);
        expect(response.body.data.lastResult.studentRoster.updated).toBe(2);
        expect(response.body.data.lastResult.employeeRoster.updated).toBe(1);
        expect(response.body.data.lastTriggeredBy).toBe('sync-test@school.com');
        expect(response.body.data.cooldownRemainingSeconds).toBeGreaterThan(0);
    });

    it('rejects a second trigger within the cooldown window without running the jobs again', async () => {
        await agent.post('/api/v1/sync/trigger');
        jest.clearAllMocks();

        const response = await agent.post('/api/v1/sync/trigger');

        expect(response.status).toBe(429);
        expect(syncStudentRoster).not.toHaveBeenCalled();
        expect(syncEmployeeRoster).not.toHaveBeenCalled();
        expect(response.body.errors.cooldownRemainingSeconds).toBeGreaterThan(0);
    });

    it('collapses two near-simultaneous triggers into a single real run', async () => {
        const [first, second] = await Promise.all([
            agent.post('/api/v1/sync/trigger'),
            agent.post('/api/v1/sync/trigger'),
        ]);

        const statuses = [first.status, second.status].sort();
        expect(statuses).toEqual([200, 429]);
        expect(syncStudentRoster).toHaveBeenCalledTimes(1);
        expect(syncEmployeeRoster).toHaveBeenCalledTimes(1);
    });
});
