import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import checkinReducer from './slices/checkinSlice';
import dashboardReducer from './slices/dashboardSlice';
import supportReducer from './slices/supportSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        checkin: checkinReducer,
        dashboard: dashboardReducer,
        support: supportReducer,
        users: userReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});
