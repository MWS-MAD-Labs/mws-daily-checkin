// Legacy root-scope service worker kill switch.
//
// Before this app moved under /daily-checkin/, its service worker was
// registered at scope '/' from either /sw.js or /mws-sw.js. Neither path
// exists at the server root anymore (the build now lives entirely under
// /daily-checkin/), so any browser still running that old worker gets
// served THIS file at its old exact script path instead. Different bytes
// than what's cached means the browser installs it as an update - once
// that happens, this immediately clears every cache it owns, unregisters
// itself, and force-navigates any page it still controls into the current
// app, instead of leaving a stale cached shell sitting there until the
// user manually reloads.
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
            await self.registration.unregister();

            const clients = await self.clients.matchAll({ type: 'window' });
            clients.forEach((client) => {
                client.navigate('/daily-checkin/').catch(() => {});
            });
        })()
    );
});
