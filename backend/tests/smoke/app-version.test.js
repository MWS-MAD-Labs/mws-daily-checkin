const { appVersion } = require('../../src/utils/appVersion');

describe('app version', () => {
    it('is the commit the image was built from', () => {
        expect(appVersion({ APP_VERSION: ' abc123 ' })).toBe('abc123');
    });

    it('says unknown without one, so a deploy never matches by accident', () => {
        expect(appVersion({})).toBe('unknown');
        expect(appVersion({ APP_VERSION: '' })).toBe('unknown');
    });
});
