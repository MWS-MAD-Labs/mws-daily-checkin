const { createHubSso } = require('mws-central-auth/server');

const APP_ID = 'daily-checkin';
const STATE_COOKIE_NAME = 'daily_checkin_hub_nonce';

// The Hub sign-in and sign-out flow comes from the shared package, so every app does it the same way.
function hubSso() {
    if (!process.env.HUB_BASE_URL || !process.env.HUB_INTERNAL_SECRET) {
        throw new Error('HUB_BASE_URL or HUB_INTERNAL_SECRET is not configured');
    }
    return createHubSso({
        hubBaseUrl: process.env.HUB_BASE_URL,
        appId: APP_ID,
        internalSecret: process.env.HUB_INTERNAL_SECRET,
        stateCookieName: STATE_COOKIE_NAME,
    });
}

// Express cookie options from the package's descriptor. The gateway strips /daily-checkin before the backend
// sees the request, so the path can be set from the environment.
function cookieOptions(cookie) {
    const configuredPath = String(process.env.HUB_STATE_COOKIE_PATH || cookie.path).trim();
    if (!configuredPath.startsWith('/') || configuredPath.includes(';')) {
        throw new Error('HUB_STATE_COOKIE_PATH must be an absolute cookie path');
    }
    return {
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        secure: process.env.NODE_ENV === 'production',
        path: configuredPath,
        maxAge: cookie.maxAgeSeconds * 1000,
    };
}

module.exports = { hubSso, cookieOptions, STATE_COOKIE_NAME };
