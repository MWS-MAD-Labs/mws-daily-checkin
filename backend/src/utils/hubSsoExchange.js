const axios = require('axios');

const APP_ID = 'daily-checkin';

// Server-to-server trade of the short opaque code Hub's /auth/sso redirect
// now carries (instead of the relay token itself) for the actual token.
// Never called from the browser - this app's own backend is the only thing
// that ever sees the real token, over a channel a leaked/logged URL can't
// reach. See mws-hub's sso-code-store.ts / sso-exchange-controller.ts for
// the other side of this call.
async function exchangeSsoCode(code) {
    const hubBaseUrl = process.env.HUB_BASE_URL;
    const internalSecret = process.env.HUB_INTERNAL_SECRET;
    if (!hubBaseUrl || !internalSecret) {
        throw new Error('HUB_BASE_URL or HUB_INTERNAL_SECRET is not configured');
    }

    const { data } = await axios.post(
        `${hubBaseUrl.replace(/\/$/, '')}/sso/exchange`,
        { code, appId: APP_ID },
        {
            headers: { 'X-Hub-Internal-Secret': internalSecret },
            timeout: 5000,
        },
    );

    return data.data.token;
}

module.exports = { exchangeSsoCode };
