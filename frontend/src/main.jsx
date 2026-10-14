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
import { clearStoredAuthSession, getStoredAuthUserRaw } from '@/utils/authStorage';
import { stripRestoredMarker } from '@/utils/hubSession';

syncInitialTheme();

// The session is the Hub's cookie, which this code cannot read, so the backend is asked who is signed in. A cached
// copy of the person keeps protected pages from flashing a loading screen while it answers.
const cachedUser = getStoredAuthUserRaw();
if (cachedUser) {
    try {
        store.dispatch({ type: 'auth/setUser', payload: { user: JSON.parse(cachedUser) } });
    } catch (error) {
        console.error('Error parsing stored user data:', error);
        clearStoredAuthSession();
    }
}
store.dispatch(fetchCurrentUser()).then((action) => {
    if (fetchCurrentUser.fulfilled.match(action)) stripRestoredMarker();
});

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

    // The browser only re-checks the SW script on a genuine network
    // navigation - a tab or installed PWA left open/backgrounded for days
    // (the common case on mobile, where people rarely force-quit) never
    // triggers that check on its own, so controllerchange above never
    // fires and the page keeps running whatever bundle it booted with.
    // Force a check whenever the tab actually becomes visible again.
    navigator.serviceWorker.ready.then((registration) => {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                registration.update().catch(() => {});
            }
        });
    }).catch(() => {});
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
