/* ============================================================
   api.js — API Client Module for StayEase
   All functions return Promises. Errors are handled gracefully.
   ============================================================ */

const API_BASE = 'http://localhost:5000/api';

/**
 * Internal helper: perform a fetch request and return parsed JSON.
 * Throws an Error with a user-friendly message on failure.
 */
async function _request(method, path, body = null, params = null) {
  let url = `${API_BASE}${path}`;

  if (params) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (query) url += `?${query}`;
  }

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const msg = data.message || data.error || `Request failed (${response.status})`;
    throw new Error(msg);
  }

  return data;
}

// ── Health ─────────────────────────────────────────────────────────────────

/**
 * Check backend health status.
 * @returns {Promise<Object>} { status, message }
 */
async function checkHealth() {
  return _request('GET', '/health');
}

// ── Hotels ─────────────────────────────────────────────────────────────────

/**
 * Search hotels with optional filters.
 * @param {Object} params - { city, checkin, checkout, guests, max_price, min_stars }
 * @returns {Promise<Object>} { hotels: Array, total: Number }
 */
async function searchHotels(params = {}) {
  return _request('GET', '/hotels/search', null, params);
}

/**
 * Get a single hotel by ID.
 * @param {string|number} id
 * @returns {Promise<Object>} Hotel object
 */
async function getHotelById(id) {
  return _request('GET', `/hotels/${id}`);
}

/**
 * Get popular / featured hotels.
 * @param {string} [city] - Optional city filter
 * @param {number} [limit=6] - Max results
 * @returns {Promise<Object>} { hotels: Array }
 */
async function getPopularHotels(city = '', limit = 6) {
  const params = { limit };
  if (city) params.city = city;
  return _request('GET', '/hotels/popular', null, params);
}

/**
 * Check room availability for given dates.
 * @param {Object} data - { hotel_id, checkin, checkout, room_type, guests }
 * @returns {Promise<Object>} { available: Boolean, rooms_left: Number }
 */
async function checkHotelAvailability(data) {
  return _request('POST', '/hotels/availability', data);
}

// ── Restaurants ────────────────────────────────────────────────────────────

/**
 * Search restaurants with filters.
 * @param {Object} params - { city, date, time, guests, cuisine, max_price }
 * @returns {Promise<Object>} { restaurants: Array, total: Number }
 */
async function searchRestaurants(params = {}) {
  return _request('GET', '/restaurants/search', null, params);
}

/**
 * Get a single restaurant by ID.
 * @param {string|number} id
 * @returns {Promise<Object>} Restaurant object
 */
async function getRestaurantById(id) {
  return _request('GET', `/restaurants/${id}`);
}

/**
 * Get restaurants near a geo-location.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} [radius=5000] - Radius in metres
 * @returns {Promise<Object>} { restaurants: Array }
 */
async function getNearbyRestaurants(lat, lng, radius = 5000) {
  return _request('GET', '/restaurants/nearby', null, { lat, lng, radius });
}

/**
 * Check table availability.
 * @param {Object} data - { restaurant_id, date, time, guests }
 * @returns {Promise<Object>} { available: Boolean, slots: Array }
 */
async function checkTableAvailability(data) {
  return _request('POST', '/restaurants/availability', data);
}

// ── Bookings ───────────────────────────────────────────────────────────────

/**
 * Get all bookings for a user.
 * @param {string|number} userId
 * @returns {Promise<Object>} { bookings: Array }
 */
async function getUserBookings(userId) {
  return _request('GET', '/bookings', null, { user_id: userId });
}

/**
 * Create a hotel booking.
 * @param {Object} data - { user_id, hotel_id, room_type, checkin, checkout, guests, name, email }
 * @returns {Promise<Object>} Booking confirmation object
 */
async function createHotelBooking(data) {
  return _request('POST', '/bookings/hotel', data);
}

/**
 * Create a restaurant table booking.
 * @param {Object} data - { user_id, restaurant_id, date, time, guests, name, email }
 * @returns {Promise<Object>} Booking confirmation object
 */
async function createRestaurantBooking(data) {
  return _request('POST', '/bookings/restaurant', data);
}

/**
 * Cancel a booking by ID.
 * @param {string|number} bookingId
 * @returns {Promise<Object>} { success: Boolean, message: String }
 */
async function cancelBooking(bookingId) {
  return _request('DELETE', `/bookings/${bookingId}`);
}

/**
 * Get a single booking's full details.
 * @param {string|number} bookingId
 * @returns {Promise<Object>} Booking detail object
 */
async function getBookingDetail(bookingId) {
  return _request('GET', `/bookings/${bookingId}`);
}

// ── Auth ───────────────────────────────────────────────────────────────────

/**
 * Register a new user account.
 * @param {Object} data - { name, email, password }
 * @returns {Promise<Object>} { user, token }
 */
async function registerUser(data) {
  return _request('POST', '/auth/register', data);
}

/**
 * Log in with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} { user, token }
 */
async function loginUser(email, password) {
  return _request('POST', '/auth/login', { email, password });
}

// ── AI Chat ────────────────────────────────────────────────────────────────

/**
 * Send a chat message to the AI assistant.
 * @param {string} message - User's message text
 * @param {string} sessionId - Unique chat session ID
 * @param {Object} [context={}] - Optional contextual data (city, page, etc.)
 * @returns {Promise<Object>} { reply: String, action?: String, action_data?: Object, quick_replies?: Array }
 */
async function sendChatMessage(message, sessionId, context = {}) {
  return _request('POST', '/ai/chat', { message, session_id: sessionId, context });
}

/**
 * Send an agentic instruction (multi-step task) to the AI.
 * @param {string} instruction - Natural language instruction
 * @param {Object} [context={}] - Optional context
 * @returns {Promise<Object>} { steps: Array, final_message: String, action?: String }
 */
async function sendAgentInstruction(instruction, context = {}) {
  return _request('POST', '/ai/agent', { instruction, context });
}

// ── Export ─────────────────────────────────────────────────────────────────

window.API = {
  checkHealth,
  // Hotels
  searchHotels,
  getHotelById,
  getPopularHotels,
  checkHotelAvailability,
  // Restaurants
  searchRestaurants,
  getRestaurantById,
  getNearbyRestaurants,
  checkTableAvailability,
  // Bookings
  getUserBookings,
  createHotelBooking,
  createRestaurantBooking,
  cancelBooking,
  getBookingDetail,
  // Auth
  registerUser,
  loginUser,
  // AI
  sendChatMessage,
  sendAgentInstruction,
};
