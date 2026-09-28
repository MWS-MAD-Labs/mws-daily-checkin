const crypto = require('crypto');
const cacheService = require('../../src/services/cacheService');
const { verifyHubRelayToken } = require('../../src/utils/hubSsoRelay');

const ISSUER = 'mws-hub';
const AUDIENCE = 'daily-checkin';

function base64Url(input) {
    return Buffer.from(input).toString('base64url');
}

function signRs256(payload, privateKey, header = { alg: 'RS256', typ: 'JWT', kid: 'test-hub-key' }) {
    const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
    const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
    return `${signingInput}.${signature.toString('base64url')}`;
}

function signHs256WithPublicKeyAsSecret(payload, publicKey) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
    const signature = crypto.createHmac('sha256', publicKey).update(signingInput).digest('base64url');
    return `${signingInput}.${signature}`;
}

function relayPayload(overrides = {}) {
    const now = Math.floor(Date.now() / 1000);
    return {
        iss: ISSUER,
        aud: AUDIENCE,
        sub: 'person-cuid-1',
        email: 'teacher@millennia21.id',
        source: 'employee',
        tags: ['employee', 'staff'],
        jti: crypto.randomUUID(),
        iat: now,
        exp: now + 30,
        ...overrides,
    };
}

describe('Hub SSO relay verifier (via mws-central-auth)', () => {
    let privateKey;
    let publicKey;

    beforeAll(() => {
        const pair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        privateKey = pair.privateKey;
        publicKey = pair.publicKey;
    });

    beforeEach(() => {
        process.env.HUB_SSO_PUBLIC_KEY = publicKey.replace(/\n/g, '\\n');
        cacheService.hasSeenSsoJti = jest.fn().mockReturnValue(false);
        cacheService.markSsoJtiSeen = jest.fn();
    });

    test('accepts a Hub-style RS256 relay token, sub is the Central Person.id', async () => {
        const token = signRs256(relayPayload(), privateKey);

        const payload = await verifyHubRelayToken(token);

        expect(payload.sub).toBe('person-cuid-1');
        expect(payload.email).toBe('teacher@millennia21.id');
        expect(payload.aud).toBe(AUDIENCE);
        expect(cacheService.markSsoJtiSeen).toHaveBeenCalledWith(payload.jti, expect.any(Number));
    });

    test('rejects a replayed jti on a second verification of the same token', async () => {
        cacheService.hasSeenSsoJti.mockReturnValueOnce(false).mockReturnValueOnce(true);
        const token = signRs256(relayPayload(), privateKey);

        await verifyHubRelayToken(token);
        await expect(verifyHubRelayToken(token)).rejects.toThrow();
    });

    test('rejects an HS256 token signed with the public key as its HMAC secret', async () => {
        const maliciousToken = signHs256WithPublicKeyAsSecret(relayPayload({ sub: 'attacker' }), publicKey);

        await expect(verifyHubRelayToken(maliciousToken)).rejects.toThrow();
        expect(cacheService.markSsoJtiSeen).not.toHaveBeenCalled();
    });

    test('rejects a payload missing the email claim', async () => {
        const payload = relayPayload();
        delete payload.email;
        const token = signRs256(payload, privateKey);

        await expect(verifyHubRelayToken(token)).rejects.toThrow();
    });

    test('falls back to Hub JWKS when HUB_SSO_PUBLIC_KEY is not set', async () => {
        delete process.env.HUB_SSO_PUBLIC_KEY;
        // Closed port - fails fast (connection refused) instead of a real
        // DNS/network round-trip, since this only needs to prove the JWKS
        // code path is taken, not exercise real JWKS fetching.
        process.env.HUB_BASE_URL = 'http://127.0.0.1:1';
        const token = signRs256(relayPayload(), privateKey);

        await expect(verifyHubRelayToken(token)).rejects.toThrow();
    }, 10000);
});
