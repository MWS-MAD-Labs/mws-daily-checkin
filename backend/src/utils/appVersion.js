// The commit the image was built from, passed in at build time. A deploy waits for it on the health address.
function appVersion(env = process.env) {
    return (env.APP_VERSION || '').trim() || 'unknown';
}

module.exports = { appVersion };
