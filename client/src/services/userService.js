import api from './api';

export const getMe = () => api.get('/users/me');
export const updatePreferences = (preferences) => api.patch('/users/me/preferences', preferences);
