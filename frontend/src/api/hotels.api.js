import api from './axios';

export const getHotels     = (params) => api.get('/hotels', { params });
export const getHotel      = (id)     => api.get(`/hotels/${id}`);
export const getPopular    = ()       => api.get('/hotels/popular');
export const getRooms      = (hotelId, params) => api.get(`/hotels/${hotelId}/rooms`, { params });
export const checkRoomAvailability = (hotelId, roomId, params) =>
  api.get(`/hotels/${hotelId}/rooms/${roomId}/availability`, { params });
