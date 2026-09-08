const request = require('supertest');
const { app } = require('../../src/app');

describe('public config route', () => {
    const originalHubBaseUrl = process.env.HUB_BASE_URL;

    afterEach(() => {
        if (originalHubBaseUrl === undefined) {
            delete process.env.HUB_BASE_URL;
        } else {
            process.env.HUB_BASE_URL = originalHubBaseUrl;
        }
    });

    test('returns HUB_BASE_URL from backend env without trailing slash', async () => {
        process.env.HUB_BASE_URL = 'http://localhost:5175/';

        const res = await request(app)
            .get('/api/v1/config/public')
            .expect(200);

        expect(res.body).toMatchObject({
            success: true,
            data: {
                hubBaseUrl: 'http://localhost:5175'
            }
        });
    });
});
