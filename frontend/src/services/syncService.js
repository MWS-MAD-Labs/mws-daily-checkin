import api from './authService';

export const getSyncStatus = async () => {
    const response = await api.get('/sync/status', { skipGlobalLoading: true });
    return response;
};

export const triggerSync = async () => {
    const response = await api.post('/sync/trigger', {}, { skipGlobalLoading: true });
    return response;
};
