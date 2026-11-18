/* ============================================================
   bookings.js — My Bookings page logic for StayEase
   ============================================================ */

(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */
  let allBookings = [];
  let activeTab   = 'all';

  /* ── DOM refs ────────────────────────────────────────────── */
  const loginSection   = document.getElementById('login-section');
  const bookingsSection = document.getElementById('bookings-section');
  const bookingsList   = document.getElementById('bookings-list');
  const loginForm      = document.getElementById('login-form');
  const tabBtns        = document.querySelectorAll('.tab-btn');

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    const user = getCurrentUser();
    if (user) {
      showBookingsSection();
      loadBookings(user.id);
    } else {
      showLoginSection();
    }
    bindTabs();
  }

  /* ── Auth flow ───────────────────────────────────────────── */
  function showLoginSection() {
    if (loginSection)   loginSection.style.display   = 'block';
    if (bookingsSection) bookingsSection.style.display = 'none';
  }

  function showBookingsSection() {
    if (loginSection)   loginSection.style.display   = 'none';
    if (bookingsSection) bookingsSection.style.display = 'block';
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name  = document.getElementById('guest-name').value.trim();
      const email = document.getElementById('guest-email').value.trim();
      if (!name || !email) return;

      const btn = loginForm.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Saving…';

      try {
        // Try login first, then register
        let user;
        try {
          user = await window.API.loginUser(email, 'demo1234');
        } catch {
          user = await window.API.registerUser({ name, email, password: 'demo1234' });
        }
        const userData = { id: user.user_id || user._id || user.id, name: user.name || name, email };
        setCurrentUser(userData);
        showBookingsSection();
        loadBookings(userData.id);
        showToast('Welcome, ' + userData.name + '!', 'success');
      } catch (err) {
        // Fallback: store locally and show empty bookings
        const userData = { id: 'guest_' + Date.now(), name, email };
        setCurrentUser(userData);
        showBookingsSection();
        loadBookings(userData.id);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Continue';
      }
    });
  }

  /* ── Load bookings ───────────────────────────────────────── */
  async function loadBookings(userId) {
    renderLoading();
    try {
      const data = await window.API.getUserBookings(userId);
      allBookings = data.bookings || data || [];
      renderBookings();
    } catch (err) {
      allBookings = [];
      renderBookings();
    }
  }

  /* ── Tabs ────────────────────────────────────────────────── */
  function bindTabs() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        renderBookings();
      });
    });
  }

  /* ── Render ──────────────────────────────────────────────── */
  function renderLoading() {
    if (!bookingsList) return;
    bookingsList.innerHTML = `
      <div class="loading-state">
        <div class="spinner spinner--lg"></div>
        <p>Loading your reservations…</p>
      </div>`;
  }

  function renderBookings() {
    if (!bookingsList) return;

    let list = allBookings;

    if (activeTab === 'hotels') {
      list = list.filter(b => b.booking_type === 'hotel');
    } else if (activeTab === 'restaurants') {
      list = list.filter(b => b.booking_type === 'restaurant');
    } else if (activeTab === 'cancelled') {
      list = list.filter(b => b.status === 'cancelled');
    }

    // For non-cancelled tabs, also exclude cancelled
    if (activeTab !== 'cancelled') {
      list = list.filter(b => b.status !== 'cancelled');
    }

    if (list.length === 0) {
      bookingsList.innerHTML = renderEmpty();
      return;
    }

    bookingsList.innerHTML = list.map(renderBookingCard).join('');
    bookingsList.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => handleCancel(btn.dataset.id));
    });
  }

  function renderBookingCard(b) {
    const isHotel = b.booking_type === 'hotel';
    const isCancelled = b.status === 'cancelled';

    const statusBadge = isCancelled
      ? `<span class="badge badge-error">Cancelled</span>`
      : `<span class="badge badge-success">Confirmed</span>`;

    const icon = isHotel ? '🏨' : '🍽️';

    const dateInfo = isHotel
      ? `<span>📅 Check-in: <strong>${formatDate(b.checkin)}</strong></span>
         <span>📅 Check-out: <strong>${formatDate(b.checkout)}</strong></span>
         <span>🛏️ Room: <strong>${b.room_type || 'Standard'}</strong></span>`
      : `<span>📅 Date: <strong>${formatDate(b.date)}</strong></span>
         <span>🕐 Time: <strong>${b.time || '-'}</strong></span>`;

    const priceInfo = isHotel && b.total_price
      ? `<div class="booking-card__price">₹${Number(b.total_price).toLocaleString('en-IN')}</div>`
      : '';

    const cancelBtn = !isCancelled
      ? `<button class="btn btn-outline btn-sm cancel-btn" data-id="${b._id || b.id}">Cancel</button>`
      : '';

    const name = b.hotel_name || b.restaurant_name || b.name || 'Unknown';
    const guests = b.guests || b.party_size || 1;

    return `
      <div class="booking-card ${isCancelled ? 'booking-card--cancelled' : ''}">
        <div class="booking-card__header">
          <div class="booking-card__icon">${icon}</div>
          <div class="booking-card__info">
            <h3>${name}</h3>
            <p>${isHotel ? 'Hotel Reservation' : 'Table Reservation'} · ${guests} guest${guests > 1 ? 's' : ''}</p>
          </div>
          <div class="booking-card__status">${statusBadge}</div>
        </div>
        <div class="booking-card__details">
          ${dateInfo}
          <span>👥 Guests: <strong>${guests}</strong></span>
        </div>
        ${priceInfo}
        <div class="booking-card__actions">
          <span class="booking-card__id">Booking #${(b._id || b.id || '').toString().slice(-8).toUpperCase()}</span>
          <div class="booking-card__btns">${cancelBtn}</div>
        </div>
      </div>`;
  }

  function renderEmpty() {
    const labels = { all: 'reservations', hotels: 'hotel bookings', restaurants: 'restaurant bookings', cancelled: 'cancelled bookings' };
    return `
      <div class="empty-state">
        <div class="empty-state__icon">📋</div>
        <h3>No ${labels[activeTab] || 'bookings'} found</h3>
        <p>You don't have any ${labels[activeTab] || 'bookings'} yet.</p>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:16px;">
          <a href="hotels.html" class="btn btn-primary btn-sm">Browse Hotels</a>
          <a href="restaurants.html" class="btn btn-outline btn-sm">Browse Restaurants</a>
        </div>
      </div>`;
  }

  /* ── Cancel ──────────────────────────────────────────────── */
  async function handleCancel(bookingId) {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await window.API.cancelBooking(bookingId);
      showToast('Reservation cancelled successfully.', 'success');
      const user = getCurrentUser();
      if (user) loadBookings(user.id);
    } catch (err) {
      showToast(err.message || 'Could not cancel booking.', 'error');
    }
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  function formatDate(str) {
    if (!str) return '—';
    try {
      return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return str; }
  }

  /* ── Boot ────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
