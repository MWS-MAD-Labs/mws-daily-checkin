// A pretend Hub session for tests that need a signed-in person without a real Hub or Central.
// The cookie is `hub_at=test:<centralPersonId>`, and the person is the local user with that centralPersonId.
//
// In a test file:
//   jest.mock('../../src/utils/hubSession', () => require('../helpers/hubTestSession').hubSessionModule);
//   jest.mock('../../src/utils/hubSessionUser', () => require('../helpers/hubTestSession').hubSessionUserModule);
//   ... .set('Cookie', cookieFor('person-1'))

const cookieFor = (personId) => `hub_at=test:${personId}`;

const hubSessionModule = {
    hubSession: () => ({
        fromCookieHeader: async (header) => {
            const match = /(?:^|;\s*)hub_at=test:([^;]+)/.exec(header || '');
            if (!match) return null;
            return {
                sub: match[1],
                email: `${match[1]}@test.local`,
                source: 'employee',
                tags: [],
                sid: 'test-session',
                exp: Math.floor(Date.now() / 1000) + 300,
            };
        },
    }),
};

const hubSessionUserModule = {
    resolveSessionUser: async (claims) => {
        const User = require('../../src/models/User');
        const UserStudent = require('../../src/models/UserStudent');
        return (await User.findOne({ centralPersonId: claims.sub })) || (await UserStudent.findOne({ centralPersonId: claims.sub }));
    },
    clearEntitlementCache: () => {},
};

module.exports = { cookieFor, hubSessionModule, hubSessionUserModule };
