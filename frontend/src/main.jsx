import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import App from '@/App';
import '@/index.css';
import { Toaster } from '@/components/ui/toaster';
import { syncInitialTheme } from '@/lib/theme';
import { fetchCurrentUser } from '@/store/slices/authSlice';
import { clearStoredAuthSession, getStoredAuthToken, getStoredAuthUserRaw } from '@/utils/authStorage';

syncInitialTheme();

// Optimistically seed auth state from the cached user profile so protected
// pages don't flash a login screen while fetchCurrentUser() below confirms
// the real session - which lives in an httpOnly cookie now, not here.
// hasSessionMarker is a non-sensitive marker (see utils/authStorage.js),
// not a credential.
const hasSessionMarker = getStoredAuthToken();
const user = getStoredAuthUserRaw();

if (hasSessionMarker && user) {
    try {
        const userData = JSON.parse(user);
        store.dispatch({
            type: 'auth/setUser',
            payload: { user: userData }
        });
        // Validate against the actual cookie-backed session before
        // rendering protected pages.
        store.dispatch(fetchCurrentUser());
    } catch (error) {
        console.error('Error parsing stored user data:', error);
        clearStoredAuthSession();
    }
}

// Service worker registration is handled by Vite PWA plugin
if ('serviceWorker' in navigator) {
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
}

// daily-checkin is served under /daily-checkin by the gateway. The router
// basename must match vite `base` (import.meta.env.BASE_URL = '/daily-checkin/').
// Drop the trailing slash for the React Router basename (e.g. '/daily-checkin') -
// same as MTSS's own main.jsx does for '/mtss/'. Every existing
// navigate()/<Link to> call keeps working unchanged once this is set -
// React Router applies the prefix transparently, and useLocation().pathname
// already strips it back off.
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '');

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter basename={ROUTER_BASENAME}>
                <App />
                <Toaster />
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);
