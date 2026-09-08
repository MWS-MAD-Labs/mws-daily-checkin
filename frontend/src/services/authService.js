import axios from 'axios';
import { startGlobalLoading, stopGlobalLoading } from '@/lib/loadingManager';
import { clearStoredAuthSession, getStoredAuthToken } from '@/utils/authStorage';

// Default to versioned API to match backend routing
const API_BASE_URL = import.meta.env.VITE_API_BASE || '/api/v1';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 45000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (!config?.skipGlobalLoading) {
            startGlobalLoading();
        }
        const token = getStoredAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
            // 401s from our own API (default baseURL) as a real auth failure.
            const isOwnApiRequest = !requestBaseUrl || requestBaseUrl === API_BASE_URL;
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
                    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
                        window.location.assign('/');
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

// Auth API functions
export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response;
};

export const logout = async () => {
    const response = await api.post('/auth/logout');

    clearStoredAuthSession();

    // The backend tells us where to go so the Hub session ends too. It has to
    // be a real navigation: Hub's cookie lives on Hub's domain, so nothing
    // this app calls from the background can clear it. Every caller of
    // logout() gets this for free by living in one place.
    const hubLogoutUrl = response?.data?.data?.hubLogoutUrl;
    if (hubLogoutUrl) {
        window.location.assign(hubLogoutUrl);
    }

    return response;
};

export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response;
};

export const registerUser = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response;
};

export default api;
