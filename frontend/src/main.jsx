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

// Initialize auth state from localStorage
const token = getStoredAuthToken();
const user = getStoredAuthUserRaw();

if (token && user) {
    try {
        const userData = JSON.parse(user);
        store.dispatch({
            type: 'auth/setUser',
            payload: { user: userData, token }
        });
        // Validate persisted token before rendering protected pages.
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

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <App />
                <Toaster />
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);
