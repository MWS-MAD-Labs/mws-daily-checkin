const { verifyRelayToken } = require('mws-central-auth/server');
const { getHubReplayStore } = require('./hubReplayStore');
const { validateEntitlement } = require('./centralEntitlement');

const AUDIENCE = 'daily-checkin';

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

    const payload = await verifyRelayToken(token, {
        audience: AUDIENCE,
        replayStore: getHubReplayStore(),
        ...(publicKeyPem
            ? { publicKeyPem }
            : { jwksUrl: `${hubBaseUrl.replace(/\/$/, '')}/.well-known/jwks.json` }),
    });

    return { ...payload, entitlement: validateEntitlement(payload.entitlement) };
}

module.exports = { verifyHubRelayToken };
