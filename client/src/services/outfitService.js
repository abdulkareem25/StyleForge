import api from './api';

export const generateOutfits = (data) => api.post('/outfits/generate', data);
export const wearOutfit = (id) => api.post(`/outfits/${id}/wear`);
export const favoriteOutfit = (id) => api.post(`/outfits/${id}/favorite`);
export const getOutfitHistory = (params) => api.get('/outfits/history', { params });
