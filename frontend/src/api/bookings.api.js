import api from './axios';

// Hotel bookings
export const createHotelBooking  = (data)  => api.post('/bookings/hotel', data);
export const getMyHotelBookings  = ()      => api.get('/bookings/hotel/my');
export const getHotelBooking     = (id)    => api.get(`/bookings/hotel/${id}`);
export const cancelHotelBooking  = (id)    => api.put(`/bookings/hotel/${id}/cancel`);

// Restaurant reservations
export const createRestaurantReservation = (data) => api.post('/reservations/restaurant', data);
export const getMyReservations           = ()     => api.get('/reservations/restaurant/my');
export const getReservation              = (id)   => api.get(`/reservations/restaurant/${id}`);
export const cancelReservation           = (id)   => api.put(`/reservations/restaurant/${id}/cancel`);
