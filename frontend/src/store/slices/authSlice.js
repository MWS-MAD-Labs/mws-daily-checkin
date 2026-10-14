import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCurrentUser } from '../../services/authService';
import { goToHubHome } from '@/utils/hubSession';
import { clearStoredAuthSession, setStoredAuthSession, setStoredAuthUser } from '@/utils/authStorage';

// There is no sign-out here: the Hub owns it. This clears what this tab holds and goes to the Hub front page.
export const leaveToHub = createAsyncThunk('auth/leaveToHub', async () => {
    await goToHubHome();
});

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getCurrentUser();
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue({
                status: error.response?.status || null,
                message: error.response?.data?.message || 'Failed to fetch user'
            });
        }
    }
);

// Initial state
// No `token` field - the session lives in an httpOnly cookie the browser
// manages on its own (see backend utils/authCookie.js). isAuthenticated is
// the one source of truth for "does this tab currently have a session".
const initialState = {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    // The Hub knows the person but Central gave them no access to this app.
    noAccess: false,
};

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setUser: (state, action) => {
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
            setStoredAuthSession(action.payload);
        },
        clearAuth: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(leaveToHub.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.error = null;
                clearStoredAuthSession();
            })
            // Fetch current user
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                const userData = action.payload?.user || action.payload?.data?.user;
                state.user = userData || null;
                state.isAuthenticated = !!userData;
                state.noAccess = false;
                state.error = null;
                if (userData) {
                    setStoredAuthUser(userData);
                }
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.loading = false;
                const payload = action.payload || {};
                const message = typeof payload === 'string' ? payload : payload?.message;
                const status = typeof payload === 'string' ? null : payload?.status;
                state.error = message || 'Failed to fetch user';
                state.noAccess = status === 403;

                const normalizedMessage = String(message || '').toLowerCase();
                const shouldClearAuth =
                    status === 401 ||
                    status === 403 ||
                    normalizedMessage.includes('unauthorized') ||
                    normalizedMessage.includes('token expired') ||
                    normalizedMessage.includes('invalid token') ||
                    normalizedMessage.includes('access token required') ||
                    normalizedMessage.includes('authentication required');

                if (shouldClearAuth) {
                    state.isAuthenticated = false;
                    state.user = null;
                    clearStoredAuthSession();
                }
            });
    },
});

export const { clearError, setUser, clearAuth, loginSuccess } = authSlice.actions;
export default authSlice.reducer;
