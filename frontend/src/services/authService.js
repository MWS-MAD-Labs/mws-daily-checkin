import axios from 'axios';
import { startGlobalLoading, stopGlobalLoading } from '@/lib/loadingManager';
import { clearStoredAuthSession } from '@/utils/authStorage';

// import.meta.env.BASE_URL is '/daily-checkin/' in production
// (vite.config.js), '/' in standalone local dev. Deliberately NOT reading
// VITE_API_BASE here anymore - Komodo has had this build arg set to a bare
// '/api/v1' (missing the gateway prefix) at least once already, which
// silently overrode a correct fallback and 404s in production (no nginx
// location matches a bare '/api/v1'). Deriving straight from BASE_URL, the
// same source AUTH_BASE_URL below already relies on, can't drift out of
// sync with it the way a separately-configured env var can.
const GATEWAY_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const API_BASE_URL = `${GATEWAY_BASE}/api/v1`;

// The backend mounts /auth as its own sibling namespace next to /api
// (see backend/src/app.js: app.use('/auth', ...) and app.use('/api', ...)
// are two separate registrations) - it is NOT nested under /api/v1. Calls
// below that reuse API_BASE_URL for an /auth/* path would silently target
// a URL like /daily-checkin/api/v1/auth/login, which nginx happily proxies
// to the backend, but the backend has no such route and 404s.
const AUTH_BASE_URL = GATEWAY_BASE;

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 45000,
    // The session lives in an httpOnly cookie now (see backend
    // utils/authCookie.js) instead of a token this app attaches itself -
    // withCredentials is what makes the browser actually send it.
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - loading indicator only now. Auth is carried by the
// httpOnly cookie automatically; there's no token for this app's own JS to
// attach anymore.
api.interceptors.request.use(
    (config) => {
        if (!config?.skipGlobalLoading) {
            startGlobalLoading();
        }
        return config;
    },
    (error) => {
        if (!error?.config?.skipGlobalLoading) {
            stopGlobalLoading();
        }
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => {
        if (!response?.config?.skipGlobalLoading) {
            stopGlobalLoading();
        }
        return response;
    },
    (error) => {
        if (!error?.config?.skipGlobalLoading) {
            stopGlobalLoading();
        }
        if (error.response?.status === 401) {
            const requestBaseUrl = error?.config?.baseURL;
            // Requests to other proxied services (e.g. /mtss/api/v1) override
            // baseURL per-call - a 401 there is that service's own auth
            // rejecting us, not a sign our own session is invalid. Only treat
            // 401s from our own API or auth routes (this app's two own
            // baseURLs) as a real auth failure.
            const isOwnApiRequest =
                !requestBaseUrl || requestBaseUrl === API_BASE_URL || requestBaseUrl === AUTH_BASE_URL;
            const requestPath = String(error?.config?.url || '');
            const isLoginRequest = /\/auth\/login$/i.test(requestPath);
            if (isOwnApiRequest && !isLoginRequest) {
                const msg = String(error.response?.data?.message || '').toLowerCase();
                const authFailureHints = [
                    'token expired',
                    'invalid token',
                    'jwt expired',
                    'access token required',
                    'authentication required',
                    'user not found or inactive',
                ];
                const shouldResetAuth = !msg || authFailureHints.some((hint) => msg.includes(hint));
                if (shouldResetAuth) {
                    clearStoredAuthSession();
                    // import.meta.env.BASE_URL is '/daily-checkin/' in
                    // production (vite.config.js), '/' in standalone local
                    // dev - this bypasses React Router, so it needs the
                    // prefix added explicitly rather than getting it from a
                    // basename.
                    if (typeof window !== 'undefined' && window.location.pathname !== import.meta.env.BASE_URL) {
                        window.location.assign(import.meta.env.BASE_URL);
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

// Auth API functions
export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password }, { baseURL: AUTH_BASE_URL });
    return response;
};

export const logout = async () => {
    const response = await api.post('/auth/logout', undefined, { baseURL: AUTH_BASE_URL });

    clearStoredAuthSession();

    // The backend tells us where to go so the Hub session ends too. It has to
    // be a real navigation: Hub's cookie lives on Hub's domain, so nothing
    // this app calls from the background can clear it. Every caller of
    // logout() gets this for free by living in one place.
    const hubLogoutUrl = response?.data?.data?.hubLogoutUrl;
    if (hubLogoutUrl) {
        window.location.assign(hubLogoutUrl);
        // Signal callers to NOT also navigate locally - that would race
        // against this cross-origin navigation and can flash/override it.
        return { redirectedToHub: true };
    }

    return { redirectedToHub: false };
};

export const getCurrentUser = async () => {
    const response = await api.get('/auth/me', { baseURL: AUTH_BASE_URL });
    return response;
};

export const registerUser = async (userData) => {
    const response = await api.post('/auth/register', userData, { baseURL: AUTH_BASE_URL });
    return response;
};

export default api;
