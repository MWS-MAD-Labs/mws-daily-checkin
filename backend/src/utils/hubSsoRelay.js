const { verifyRelayToken } = require('mws-central-auth/server');
const cacheService = require('../services/cacheService');

const AUDIENCE = 'daily-checkin';

// Wraps this app's own NodeCache-backed cacheService as mws-central-auth's
// ReplayStore interface, rather than relying on that package's in-process
// default - cacheService is already a real module-level singleton (proven,
// already deployed), so there's no reason to hand this app a second, less-
// tested replay implementation.
const replayStore = {
    hasSeen: (jti) => cacheService.hasSeenSsoJti(jti),
    markSeen: (jti, ttlSeconds) => cacheService.markSsoJtiSeen(jti, ttlSeconds),
};

// Verifies a Hub-minted relay token through the shared mws-central-auth
// package (RS256 signature, issuer/audience/expiry, single-use jti) rather
// than this app's own parallel jsonwebtoken implementation - one
// verification engine every satellite app shares, not one per app that can
// quietly drift from the others.
//
// Prefers the static HUB_SSO_PUBLIC_KEY (this app's existing, already-
// deployed config - no new env var required to keep working) and falls
// back to Hub's JWKS endpoint via HUB_BASE_URL when that isn't set, which
// survives a Hub signing-key rotation without a redeploy here.
async function verifyHubRelayToken(token) {
    const publicKeyPem = process.env.HUB_SSO_PUBLIC_KEY?.replace(/\\n/g, '\n');
    const hubBaseUrl = process.env.HUB_BASE_URL;

    if (!publicKeyPem && !hubBaseUrl) {
        throw new Error('Neither HUB_SSO_PUBLIC_KEY nor HUB_BASE_URL is configured');
    }

    return verifyRelayToken(token, {
        audience: AUDIENCE,
        replayStore,
        ...(publicKeyPem
            ? { publicKeyPem }
            : { jwksUrl: `${hubBaseUrl.replace(/\/$/, '')}/.well-known/jwks.json` }),
    });
}

module.exports = { verifyHubRelayToken };
