const jwt = require('jsonwebtoken');
const cacheService = require('../services/cacheService');

const ISSUER = 'mws-hub';
const AUDIENCE = 'daily-checkin';

// Verifies a Hub-minted relay token: signature, issuer, audience, expiry
// (all via jwt.verify's own options), then enforces single-use via jti so a
// leaked/logged token can't be replayed within its own short validity
// window. Throws on any failure - callers redirect to a generic error page,
// never leak which specific check failed to the browser.
function verifyHubRelayToken(token) {
    const secret = process.env.HUB_SSO_SECRET;
    if (!secret) {
        throw new Error('HUB_SSO_SECRET is not configured');
    }

    const payload = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: ISSUER,
        audience: AUDIENCE,
    });

    if (!payload.jti || !payload.sub) {
        throw new Error('Relay token missing required claims');
    }

    if (cacheService.hasSeenSsoJti(payload.jti)) {
        throw new Error('Relay token already used');
    }
    cacheService.markSsoJtiSeen(payload.jti);

    return payload;
}

module.exports = { verifyHubRelayToken };
