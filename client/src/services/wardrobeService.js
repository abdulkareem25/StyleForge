import api from './api';

export const getWardrobe = (params) => api.get('/wardrobe', { params });
export const getUploadAuth = () => api.post('/wardrobe/upload-auth');
export const createWardrobeItem = (data) => api.post('/wardrobe', data);
export const updateWardrobeItem = (id, data) => api.patch(`/wardrobe/${id}`, data);
export const deleteWardrobeItem = (id) => api.delete(`/wardrobe/${id}`);
