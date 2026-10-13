const request = require('supertest');
const mongoose = require('mongoose');

const { app } = require('../../src/app');
const User = require('../../src/models/User');

describe('Authentication API', () => {
    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });

    afterAll(async () => {
        // Clean up and close connection
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear users before each test
        await User.deleteMany({});
    });

    // /auth is a sibling top-level mount to /api (see app.js), not nested
    // under it - and the session lives in an httpOnly cookie set on this
    // response now (authCookie.js), not a token in the body.
    describe('POST /auth/login', () => {
        it('returns 410 even when valid legacy credentials exist', async () => {
            await User.create({ email: 'test@school.com', password: 'password123', name: 'Test User', role: 'staff' });
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'test@school.com', password: 'password123' });

            expect(response.status).toBe(410);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toMatch(/Hub/);
        });

        it('returns 410 for invalid credentials without disclosing account existence', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@school.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(410);
            expect(response.body.success).toBe(false);
        });

        it('returns 410 without validating password payloads', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({});

            expect(response.status).toBe(410);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /auth/me', () => {
        it('should return 401 without token', async () => {
            const response = await request(app).get('/auth/me');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});
