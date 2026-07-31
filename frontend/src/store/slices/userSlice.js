import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/authService';

// Async thunks
export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (params = {}, { rejectWithValue }) => {
        try {
            const { skipGlobalLoading, ...queryParams } = params;
            const response = await api.get('/users', {
                params: queryParams,
                skipGlobalLoading
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
        }
    }
);

export const fetchUserById = createAsyncThunk(
    'users/fetchUserById',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/users/${userId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
        }
    }
);

export const createUser = createAsyncThunk(
    'users/createUser',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/users', userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create user');
        }
    }
);

export const updateUser = createAsyncThunk(
    'users/updateUser',
    async ({ userId, userData, skipGlobalLoading }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/users/${userId}`, userData, {
                skipGlobalLoading
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update user');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'users/deleteUser',
    async (payload, { rejectWithValue }) => {
        try {
            const userId = typeof payload === 'object' ? payload.userId : payload;
            const skipGlobalLoading = typeof payload === 'object' ? payload.skipGlobalLoading : false;

            await api.delete(`/users/${userId}`, {
                skipGlobalLoading
            });
            return userId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
        }
    }
);

export const fetchOrganizationStructure = createAsyncThunk(
    'users/fetchOrganizationStructure',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/users/organization');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch organization structure');
        }
    }
);

export const assignUserToOrganization = createAsyncThunk(
    'users/assignUserToOrganization',
    async (assignmentData, { rejectWithValue }) => {
        try {
            const response = await api.post('/users/assign-organization', assignmentData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to assign user');
        }
    }
);

export const getOrganizationMembers = createAsyncThunk(
    'users/getOrganizationMembers',
    async (organizationId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/users/organization/${organizationId}/members`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to get organization members');
        }
    }
);

export const getUserOrganizations = createAsyncThunk(
    'users/getUserOrganizations',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/users/${userId}/organizations`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to get user organizations');
        }
    }
);

export const createOrganization = createAsyncThunk(
    'users/createOrganization',
    async (organizationData, { rejectWithValue }) => {
        try {
            const response = await api.post('/users/organization', organizationData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create organization');
        }
    }
);

// Initial state
const initialState = {
    users: [],
    currentUser: null,
    organizationStructure: null,
    organizationMembers: null,
    userOrganizations: null,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        hasNext: false,
        hasPrev: false
    },
    filters: {
        role: '',
        department: '',
        unit: '',
        jobLevel: '',
        employmentStatus: '',
        search: ''
    },
    loading: false,
    error: null,
    lastUpdated: null
};

// Slice
const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setFilters: (state, action) => {
            state.filters = {
                page: 1,
                limit: state.filters.limit || 20,
                ...action.payload
            };
        },
        resetFilters: (state) => {
            state.filters = initialState.filters;
        },
        setCurrentUser: (state, action) => {
            state.currentUser = action.payload;
        },
        clearCurrentUser: (state) => {
            state.currentUser = null;
        },
        updateUserInList: (state, action) => {
            const updatedUser = action.payload;
            const updatedUserId = updatedUser?._id || updatedUser?.id;
            const index = state.users.findIndex(user => (user._id || user.id) === updatedUserId);
            if (index !== -1) {
                state.users[index] = { ...state.users[index], ...updatedUser };
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch users
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload.data?.users || action.payload.users || [];
                state.pagination = action.payload.data?.pagination || action.payload.pagination || initialState.pagination;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch user by ID
            .addCase(fetchUserById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload.user;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create user
            .addCase(createUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.loading = false;
                state.users.unshift(action.payload.user);
                state.pagination.totalUsers += 1;
            })
            .addCase(createUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update user
            .addCase(updateUser.pending, (state) => {
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                const updatedUser = action.payload.data?.user || action.payload.user;
                const updatedUserId = updatedUser?._id || updatedUser?.id;

                if (!updatedUser || !updatedUserId) {
                    return;
                }

                const shouldRemoveFromInactiveView = state.filters.isActive === false && updatedUser.isActive === true;
                const shouldRemoveFromActiveView = state.filters.isActive === true && updatedUser.isActive === false;

                if (shouldRemoveFromInactiveView || shouldRemoveFromActiveView) {
                    state.users = state.users.filter(user => (user._id || user.id) !== updatedUserId);
                    state.pagination.totalUsers = Math.max(0, state.pagination.totalUsers - 1);
                    return;
                }

                const index = state.users.findIndex(user => (user._id || user.id) === updatedUserId);
                if (index !== -1) {
                    state.users[index] = { ...state.users[index], ...updatedUser };
                }
                if (state.currentUser && (state.currentUser._id || state.currentUser.id) === updatedUserId) {
                    state.currentUser = { ...state.currentUser, ...updatedUser };
                }
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Delete user
            .addCase(deleteUser.pending, (state) => {
                state.error = null;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                const deactivatedUserId = action.payload;
                const shouldRemoveFromActiveView = state.filters.isActive === true;

                if (shouldRemoveFromActiveView) {
                    state.users = state.users.filter(user => (user._id || user.id) !== deactivatedUserId);
                    state.pagination.totalUsers = Math.max(0, state.pagination.totalUsers - 1);
                    return;
                }

                const index = state.users.findIndex(user => (user._id || user.id) === deactivatedUserId);
                if (index !== -1) {
                    state.users[index].isActive = false;
                }
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Fetch organization structure
            .addCase(fetchOrganizationStructure.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrganizationStructure.fulfilled, (state, action) => {
                state.loading = false;
                state.organizationStructure = action.payload.data || action.payload;
            })
            .addCase(fetchOrganizationStructure.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Assign user to organization
            .addCase(assignUserToOrganization.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(assignUserToOrganization.fulfilled, (state) => {
                state.loading = false;
                // Optionally refresh users list or update specific user
            })
            .addCase(assignUserToOrganization.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get organization members
            .addCase(getOrganizationMembers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getOrganizationMembers.fulfilled, (state, action) => {
                state.loading = false;
                state.organizationMembers = action.payload.data;
            })
            .addCase(getOrganizationMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get user organizations
            .addCase(getUserOrganizations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUserOrganizations.fulfilled, (state, action) => {
                state.loading = false;
                state.userOrganizations = action.payload.data;
            })
            .addCase(getUserOrganizations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create organization
            .addCase(createOrganization.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOrganization.fulfilled, (state) => {
                state.loading = false;
                // Optionally refresh organization structure
            })
            .addCase(createOrganization.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    clearError,
    setFilters,
    resetFilters,
    setCurrentUser,
    clearCurrentUser,
    updateUserInList
} = userSlice.actions;

export default userSlice.reducer;
