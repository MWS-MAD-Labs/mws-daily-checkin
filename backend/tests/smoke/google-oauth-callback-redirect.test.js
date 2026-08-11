const { resolveOAuthFailureRedirect } = require('../../src/routes/auth');

describe('resolveOAuthFailureRedirect (Google OAuth /google/callback branching)', () => {
    test('central_inactive (not registered/inactive in central) redirects to the dedicated page', () => {
        expect(resolveOAuthFailureRedirect({ message: 'central_inactive' })).toBe('/account-not-found');
    });

    test('central_lookup_failed (transient/network) stays on the generic toast path, not the dedicated page', () => {
        expect(resolveOAuthFailureRedirect({ message: 'central_lookup_failed' })).toBe('/?error=central_lookup_failed');
    });

    test('other known codes keep going through the generic toast path', () => {
        expect(resolveOAuthFailureRedirect({ message: 'account_inactive' })).toBe('/?error=account_inactive');
    });

    test('missing info falls back to oauth_failed on the generic toast path', () => {
        expect(resolveOAuthFailureRedirect(undefined)).toBe('/?error=oauth_failed');
    });
});
