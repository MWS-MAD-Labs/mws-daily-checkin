import api from '@/services/authService';

// Cached for the lifetime of the page - every caller wants the same value,
// and it only ever changes on a redeploy (backend env var), never per user
// session. A build-time VITE_HUB_BASE_URL env var would need Komodo to set
// it correctly at image-build time (it hasn't, more than once this session)
// - reading it from the backend at runtime instead means a Komodo env var
// fix takes effect on restart, no rebuild required.
let hubBaseUrlPromise = null;

export function getHubBaseUrl() {
    if (!hubBaseUrlPromise) {
        hubBaseUrlPromise = api
            .get('/config/public', { skipGlobalLoading: true })
            .then((response) => String(response?.data?.data?.hubBaseUrl || '').trim().replace(/\/+$/, ''))
            .catch(() => '');
    }
    return hubBaseUrlPromise;
}
