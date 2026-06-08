import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import checkinReducer from './slices/checkinSlice';
import dashboardReducer from './slices/dashboardSlice';
import supportReducer from './slices/supportSlice';
import userReducer from './slices/userSlice';
import aiChatReducer from './slices/aiChatSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        checkin: checkinReducer,
        dashboard: dashboardReducer,
        support: supportReducer,
        users: userReducer,
        // Registered for shared app-shell components (UtilityDock,
        // ThemeSpellOverlay) that read state.aiChat. AI chat is not a
        // daily-checkin feature, so the profile stays at its initial null.
        aiChat: aiChatReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});
