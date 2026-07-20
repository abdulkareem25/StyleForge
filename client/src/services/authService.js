import api from './api';

export const getHealth = () => api.get('/health');

export const signup = (data) => api.post('/auth/signup', data);

export const login = (data) => api.post('/auth/login', data);

export const logout = () => api.post('/auth/logout');

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });
