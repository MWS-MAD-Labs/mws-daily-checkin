import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSupportContacts } from '../../services/supportService';

// Async thunks
export const fetchSupportContacts = createAsyncThunk(
    'support/fetchSupportContacts',
    async (_, { rejectWithValue, getState }) => {
        try {
            // Check if user is authenticated
            const { auth } = getState();
            if (!auth.isAuthenticated || !auth.token) {
                return rejectWithValue('User not authenticated');
            }

            const response = await getSupportContacts();
            // Extract the data array from the nested response
            const { data } = response.data;
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch support contacts');
        }
    }
);

// Initial state
const initialState = {
    contacts: [],
    loading: false,
    error: null,
};

// Slice
const supportSlice = createSlice({
    name: 'support',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch support contacts
            .addCase(fetchSupportContacts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSupportContacts.fulfilled, (state, action) => {
                state.loading = false;
                state.contacts = action.payload;
                state.error = null;
            })
            .addCase(fetchSupportContacts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError } = supportSlice.actions;
export default supportSlice.reducer;
