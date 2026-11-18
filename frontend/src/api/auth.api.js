import api from './axios';

export const login    = (data)  => api.post('/auth/login', data);
export const register = (data)  => api.post('/auth/register', data);
export const getMe    = ()      => api.get('/auth/me');
export const updateMe = (data)  => api.put('/auth/me', data);
export const changePassword = (data) => api.put('/auth/me/password', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword  = (token, data) => api.post(`/auth/reset-password/${token}`, data);
