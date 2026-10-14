const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../../src/utils/hubSession', () => require('../helpers/hubTestSession').hubSessionModule);
jest.mock('../../src/utils/hubSessionUser', () => require('../helpers/hubTestSession').hubSessionUserModule);

const { cookieFor } = require('../helpers/hubTestSession');
const { app } = require('../../src/app');
const User = require('../../src/models/User');

// The Hub owns signing in and out; this app only reads the Hub's session (see middleware/auth.js).
describe('Authentication API', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    describe('GET /auth/me', () => {
        it('answers 401 without a Hub session', async () => {
            const response = await request(app).get('/auth/me');
            expect(response.status).toBe(401);
        });

        it('answers 403 for a person this application has no record of', async () => {
            const response = await request(app).get('/auth/me').set('Cookie', cookieFor('nobody'));
            expect(response.status).toBe(403);
        });

        it('answers 403 for a deactivated account', async () => {
            await User.create({ email: 'off@school.com', password: 'password123', name: 'Off', role: 'staff', centralPersonId: 'off-person', isActive: false });
            const response = await request(app).get('/auth/me').set('Cookie', cookieFor('off-person'));
            expect(response.status).toBe(403);
        });

        it('returns the signed-in person', async () => {
            await User.create({ email: 'on@school.com', password: 'password123', name: 'On', role: 'staff', centralPersonId: 'on-person' });
            const response = await request(app).get('/auth/me').set('Cookie', cookieFor('on-person'));
            expect(response.status).toBe(200);
            expect(response.body.data.user.email).toBe('on@school.com');
        });
    });

    describe('GET /auth/sso (where the Hub card opens the app)', () => {
        it('sends the browser to the frontend, with no code to handle', async () => {
            process.env.FRONTEND_URL = 'http://localhost:5174/daily-checkin';
            const response = await request(app).get('/auth/sso?code=ignored');
            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('http://localhost:5174/daily-checkin/');
        });
    });

    describe('routes that belonged to the old sign-in', () => {
        it.each([
            ['post', '/auth/login'],
            ['post', '/auth/logout'],
            ['get', '/auth/hub-launch'],
            ['get', '/auth/logout-silent'],
            ['post', '/auth/revoke-session'],
        ])('%s %s is gone', async (method, path) => {
            const response = await request(app)[method](path);
            expect(response.status).toBe(404);
        });
    });
});
