export const registerServiceWorkerUpdates = () => {
    if (!('serviceWorker' in navigator)) return;

    let refreshedForServiceWorker = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshedForServiceWorker) return;
        refreshedForServiceWorker = true;
        window.location.reload();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'LEGACY_SW_UNREGISTERED') {
            window.location.reload();
        }
    });

    navigator.serviceWorker.ready.then((registration) => {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                registration.update().catch(() => {});
            }
        });
    }).catch(() => {});
};
