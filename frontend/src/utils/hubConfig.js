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

const HUB_SUPPORT_PATH = '/support-hub';
// Shared literally with MTSS's own hubConfig.js and with QuickLogoutButton.jsx
// in this app - naming the target the same everywhere means a Hub tab any of
// them opens gets reused/focused by the others too, not just by repeated
// clicks from one entry point.
const HUB_SUPPORT_WINDOW_NAME = 'mws-hub-support';

// Roles that see the "Support Hub" shortcut (RoleSelectionPage.jsx's old
// standalone button, now folded into QuickLogoutButton.jsx's menu) - students
// don't get one, they never go through Hub's app-launcher UI.
export const SUPPORT_HUB_ROLES = [
    'staff', 'support_staff', 'nurse', 'counselor', 'teacher', 'se_teacher',
    'head_unit', 'principal', 'directorate', 'admin', 'superadmin',
];

export function hasSupportHubAccess(role) {
    return Boolean(role) && SUPPORT_HUB_ROLES.includes(role);
}

// Opened synchronously, still inside the click's own event handler and
// before any await - a window.open() called after an await loses the
// "trusted user gesture" most browsers require and gets popup-blocked.
// An empty URL with this name also reuses/focuses an already-open Hub tab
// (window.open("", name) semantics), same trick Hub's own AppCard.tsx uses
// for the opposite direction.
export function goToHubSupport() {
    const target = window.open('', HUB_SUPPORT_WINDOW_NAME);

    // Checked synchronously, right after the open above - by the time
    // getHubBaseUrl() resolves below, a reused tab may have already started
    // navigating, so this can't wait until then.
    let isFreshWindow = true;
    if (target) {
        try {
            isFreshWindow = target.location.href === 'about:blank' || target.location.href === '';
        } catch {
            // Cross-origin already (it navigated to Hub in an earlier click) -
            // not fresh, and not readable from here either way.
            isFreshWindow = false;
        }
    }

    getHubBaseUrl().then((hubBaseUrl) => {
        const url = hubBaseUrl ? `${hubBaseUrl}${HUB_SUPPORT_PATH}` : HUB_SUPPORT_PATH;
        if (target && isFreshWindow) {
            target.location.href = url;
        } else if (target) {
            // Already open on Hub somewhere - just bring it to front instead
            // of reloading it to the exact same page, which reads as a
            // jarring reload even when nothing actually changed.
            target.focus();
        } else {
            // Popup blocked despite the synchronous open (some browsers are
            // stricter still) - fall back to the previous same-tab behavior
            // rather than silently doing nothing.
            window.location.assign(url);
        }
    });
}
