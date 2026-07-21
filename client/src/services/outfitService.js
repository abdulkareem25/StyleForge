import api from './api';

export const generateOutfits = (data) => api.post('/outfits/generate', data);
export const wearOutfit = (id, data) => api.post(`/outfits/${id}/wear`, data);
export const favoriteOutfit = (id) => api.post(`/outfits/${id}/favorite`);
export const getFavorites = (params) => api.get('/outfits/favorites', { params });
export const getOutfitHistory = (params) => api.get('/outfits/history', { params });
