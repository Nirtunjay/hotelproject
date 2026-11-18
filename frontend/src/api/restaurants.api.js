import api from './axios';

export const getRestaurants = (params) => api.get('/restaurants', { params });
export const getRestaurant  = (id)     => api.get(`/restaurants/${id}`);
export const getTimeSlots   = (id, params) => api.get(`/restaurants/${id}/timeslots`, { params });
