import api from './axios';

export const getOverview       = ()     => api.get('/admin/overview');
export const getAllUsers       = ()     => api.get('/admin/users');
export const setUserStatus     = (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive });

// Admin hotel/room CRUD
export const createHotel       = (data) => api.post('/hotels', data);
export const updateHotel       = (id, data) => api.put(`/hotels/${id}`, data);
export const deleteHotel       = (id)   => api.delete(`/hotels/${id}`);
export const createRoom        = (hotelId, data) => api.post(`/hotels/${hotelId}/rooms`, data);
export const updateRoom        = (hotelId, roomId, data) => api.put(`/hotels/${hotelId}/rooms/${roomId}`, data);

// Admin restaurant CRUD
export const createRestaurant  = (data) => api.post('/restaurants', data);
export const updateRestaurant  = (id, data) => api.put(`/restaurants/${id}`, data);
export const deleteRestaurant  = (id)   => api.delete(`/restaurants/${id}`);

// Admin booking management
export const getAllHotelBookings = (params) => api.get('/bookings/hotel/admin/all', { params });
export const updateBookingStatus = (id, status) => api.put(`/bookings/hotel/admin/${id}/status`, { status });
export const getAllReservations   = (params) => api.get('/reservations/restaurant/admin/all', { params });
export const updateReservationStatus = (id, status) => api.put(`/reservations/restaurant/admin/${id}/status`, { status });
