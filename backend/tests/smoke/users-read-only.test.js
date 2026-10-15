const router = require('../../src/routes/users');

// Users and organizations are managed in Central, so Daily only reads them.
describe('users routes', () => {
    const routes = router.stack
        .filter((layer) => layer.route)
        .flatMap((layer) => Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route.path}`));

    test('only expose reads', () => {
        expect(routes.sort()).toEqual(['GET /', 'GET /:id', 'GET /organization']);
    });
});
