const crypto = require('crypto');
const request = require('supertest');
const mongoose = require('mongoose');

// resolveOrProvisionSsoUser tries a student lookup first unless the relay
// token's source hint says otherwise (ssoUserResolution.js) - mock both
// Central sync modules so the test can tell which one(s) actually ran,
// without depending on a real Central record existing for these emails.
// Also mock the code-exchange call (server-to-server to Hub) so this test
// never needs a real Hub instance to talk to - only verifyHubRelayToken
// (against a locally-signed token) is exercised for real.
// jest.mock is hoisted above these requires, so the factory can't close
// over an outer variable - require the (now-mocked) modules afterward to
// get references to their jest.fn()s for assertions.
jest.mock('../../src/utils/studentCentralSync', () => ({ syncStudentFromCentral: jest.fn() }));
jest.mock('../../src/utils/employeeCentralSync', () => ({ syncEmployeeFromCentral: jest.fn() }));
jest.mock('../../src/utils/hubSsoExchange', () => ({ exchangeSsoCode: jest.fn() }));

const studentCentralSync = require('../../src/utils/studentCentralSync');
const employeeCentralSync = require('../../src/utils/employeeCentralSync');
const { exchangeSsoCode } = require('../../src/utils/hubSsoExchange');
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
        await UserStudent.deleteMany({});
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
        exchangeSsoCode.mockReset();
    });

    function base64Url(input) {
        return Buffer.from(input).toString('base64url');
    }

    function signRelayToken(overrides) {
        const now = Math.floor(Date.now() / 1000);
        const header = { alg: 'RS256', typ: 'JWT', kid: 'test-hub-key' };
        const payload = {
            iss: ISSUER,
            aud: AUDIENCE,
            sub: 'person-cuid-source-hint',
            email: 'source-hint-check@millennia21.id',
            tags: [],
            jti: crypto.randomUUID(),
            iat: now,
            exp: now + 30,
            ...overrides,
        };
        const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
        const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
        return `${signingInput}.${signature.toString('base64url')}`;
    }

    it('skips the student lookup entirely when the relay token hints source=employee', async () => {
        const token = signRelayToken({ source: 'employee', tags: ['employee', 'staff'] });
        exchangeSsoCode.mockResolvedValue(token);

        await request(app).get('/auth/sso?code=opaque-code-1');

        expect(exchangeSsoCode).toHaveBeenCalledWith('opaque-code-1');
        expect(employeeCentralSync.syncEmployeeFromCentral).toHaveBeenCalledWith('source-hint-check@millennia21.id');
        expect(studentCentralSync.syncStudentFromCentral).not.toHaveBeenCalled();
    });

    it('regression: source=student is forwarded too, not just employee (guards routes/auth.js dropping payload.source when building relayClaims)', async () => {
        // mws-central-auth's schema requires `source` on every token (Hub
        // always sends it), so the old "source omitted entirely" token this
        // test used to sign is no longer constructible as a validly-signed
        // token - the regression it guards against is really "does
        // routes/auth.js forward payload.source into relayClaims.source at
        // all", which the employee case above already covers one value of.
        // This covers the other enum value, so a `{ tags: payload.tags }`
        // regression that drops `source` (regardless of which value it
        // held) still fails one of the two tests.
        const token = signRelayToken({ source: 'student', tags: [] });
        exchangeSsoCode.mockResolvedValue(token);
        studentCentralSync.syncStudentFromCentral.mockResolvedValue({
            email: 'source-hint-check@millennia21.id',
            name: 'Test Student',
            role: 'student',
            currentGrade: 'Grade 5',
            className: 'Grade 5 - Orion',
        });

        await request(app).get('/auth/sso?code=opaque-code-2');

        expect(studentCentralSync.syncStudentFromCentral).toHaveBeenCalledWith('source-hint-check@millennia21.id');
        expect(employeeCentralSync.syncEmployeeFromCentral).not.toHaveBeenCalled();
    });

    it('redirects to an error page without resolving any user when the code exchange itself fails', async () => {
        exchangeSsoCode.mockRejectedValue(new Error('invalid code'));

        await request(app).get('/auth/sso?code=bad-code');

        expect(employeeCentralSync.syncEmployeeFromCentral).not.toHaveBeenCalled();
        expect(studentCentralSync.syncStudentFromCentral).not.toHaveBeenCalled();
    });
});
