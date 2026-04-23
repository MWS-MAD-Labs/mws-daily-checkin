import api from './authService';

// Support contacts API functions
export const getSupportContacts = async () => {
    const response = await api.get('/support/contacts');
    return response;
};