import { syncInitialTheme } from '@/lib/theme';
import { fetchCurrentUser } from '@/store/slices/authSlice';
import { clearStoredAuthSession, getStoredAuthUserRaw } from '@/utils/authStorage';
import { stripRestoredMarker } from '@/utils/hubSession';
import { registerServiceWorkerUpdates } from './registerServiceWorkerUpdates';

const restoreCachedUser = (store) => {
    const cachedUser = getStoredAuthUserRaw();
    if (!cachedUser) return;

    try {
        store.dispatch({ type: 'auth/setUser', payload: { user: JSON.parse(cachedUser) } });
    } catch (error) {
        console.error('Error parsing stored user data:', error);
        clearStoredAuthSession();
    }
};

const refreshCurrentUser = (store) => {
    store.dispatch(fetchCurrentUser()).then((action) => {
        if (fetchCurrentUser.fulfilled.match(action)) stripRestoredMarker();
    });
};

export const initializeApp = (store) => {
    syncInitialTheme();
    restoreCachedUser(store);
    refreshCurrentUser(store);
    registerServiceWorkerUpdates();
};
