const request = require('supertest');
const mongoose = require('mongoose');

// /auth/login re-verifies staff identity against mws-data-center on every
// login now (routes/auth.js) - mock it rather than depending on a real
// Central record existing for this test's fake email.
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
        it('should login successfully with valid credentials', async () => {
            // Create test user
            const testUser = {
                email: 'test@school.com',
                password: 'password123',
                name: 'Test User',
                role: 'staff'
            };

            await User.create(testUser);

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@school.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /auth/me', () => {
        // request.agent keeps the httpOnly cookie from the login response
        // and resends it automatically on later requests through the same
        // agent, the same way a real browser session would - there's no
        // token in the response body anymore to carry over by hand.
        let agent;
        let testUser;

        beforeEach(async () => {
            testUser = await User.create({
                email: 'test@school.com',
                password: 'password123',
                name: 'Test User',
                role: 'staff'
            });

            agent = request.agent(app);
            await agent
                .post('/auth/login')
                .send({
                    email: 'test@school.com',
                    password: 'password123'
                });
        });

        it('should return current user profile', async () => {
            const response = await agent.get('/auth/me');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.user.name).toBe(testUser.name);
        });

        it('should return 401 without token', async () => {
            const response = await request(app).get('/auth/me');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});
