const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const mongoose = require('mongoose');

// resolveOrProvisionSsoUser tries a student lookup first unless the relay
// token's source hint says otherwise (ssoUserResolution.js) - mock both
// Central sync modules so the test can tell which one(s) actually ran,
// without depending on a real Central record existing for these emails.
// jest.mock is hoisted above these requires, so the factory can't close
// over an outer variable - require the (now-mocked) modules afterward to
// get references to their jest.fn()s for assertions.
jest.mock('../../src/utils/studentCentralSync', () => ({ syncStudentFromCentral: jest.fn() }));
jest.mock('../../src/utils/employeeCentralSync', () => ({ syncEmployeeFromCentral: jest.fn() }));

const studentCentralSync = require('../../src/utils/studentCentralSync');
const employeeCentralSync = require('../../src/utils/employeeCentralSync');
const cacheService = require('../../src/services/cacheService');
const { app } = require('../../src/app');
const User = require('../../src/models/User');
const UserStudent = require('../../src/models/UserStudent');

const ISSUER = 'mws-hub';
const AUDIENCE = 'daily-checkin';

describe('GET /auth/sso - Hub relay source hint', () => {
    let privateKey;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');

        const pair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        privateKey = pair.privateKey;
        process.env.HUB_SSO_PUBLIC_KEY = pair.publicKey.replace(/\n/g, '\\n');
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(() => {
        cacheService.hasSeenSsoJti = jest.fn().mockReturnValue(false);
        cacheService.markSsoJtiSeen = jest.fn();
        studentCentralSync.syncStudentFromCentral.mockReset().mockResolvedValue(null);
        employeeCentralSync.syncEmployeeFromCentral.mockReset().mockResolvedValue({
            name: 'Test Employee',
            employeeId: '99.99.777',
            jobPosition: 'Staff',
            jobLevel: 'Staff',
            employmentStatus: 'PERMANENT',
            department: 'Operational',
            unit: 'Operational',
        });
    });

    function signRelayToken(payload) {
        return jwt.sign(
            { sub: 'source-hint-check@millennia21.id', jti: crypto.randomUUID(), ...payload },
            privateKey,
            { algorithm: 'RS256', issuer: ISSUER, audience: AUDIENCE, expiresIn: '30s', keyid: 'test-hub-key' },
        );
    }

    it('skips the student lookup entirely when the relay token hints source=employee', async () => {
        const token = signRelayToken({ source: 'employee', tags: ['employee', 'staff'] });

        await request(app).get(`/auth/sso?token=${token}`);

        expect(employeeCentralSync.syncEmployeeFromCentral).toHaveBeenCalledWith('source-hint-check@millennia21.id');
        expect(studentCentralSync.syncStudentFromCentral).not.toHaveBeenCalled();
    });

    it('regression: without the source hint being forwarded, every employee login redundantly checks student first', async () => {
        // No `source` in the token at all - simulates the bug this test
        // guards against (routes/auth.js used to build relayClaims from
        // only `{ tags: payload.tags }`, silently dropping payload.source
        // even though Hub always sends it). resolveOrProvisionSsoUser's
        // own "no hint" fallback is student-first by design, so this is
        // the one case where a student lookup for an employee's own email
        // is expected - anywhere else, it means the hint got lost again.
        const token = signRelayToken({ tags: ['employee', 'staff'] });

        await request(app).get(`/auth/sso?token=${token}`);

        expect(studentCentralSync.syncStudentFromCentral).toHaveBeenCalledWith('source-hint-check@millennia21.id');
        expect(employeeCentralSync.syncEmployeeFromCentral).toHaveBeenCalledWith('source-hint-check@millennia21.id');
    });
});
