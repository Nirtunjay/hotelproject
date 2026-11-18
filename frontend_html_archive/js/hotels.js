/* ============================================================
   hotels.js — Hotel Search Page Logic for StayEase
   ============================================================ */

(function () {
  'use strict';

  // ── State ───────────────────────────────────────────────────────────────────

  let allHotels     = [];   // Full result set for client-side filtering
  let currentHotel  = null; // Hotel currently open in modal
  let selectedRoom  = null; // Selected room type

  const PLACEHOLDER_IMGS = [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1586611292717-f828b167408c?w=400&h=250&fit=crop',
  ];

  function getPlaceholderImg(index) {
    return PLACEHOLDER_IMGS[index % PLACEHOLDER_IMGS.length];
  }

  // ── DOM References ──────────────────────────────────────────────────────────

  const grid        = document.getElementById('hotels-grid');
  const resultCount = document.getElementById('result-count');
  const searchForm  = document.getElementById('hotel-search-form');
  const filterForm  = document.getElementById('hotel-filter-form');
  const emptyState  = document.getElementById('hotel-empty-state');

  // Search inputs
  const inpCity     = document.getElementById('search-city');
  const inpCheckin  = document.getElementById('search-checkin');
  const inpCheckout = document.getElementById('search-checkout');
  const inpGuests   = document.getElementById('search-guests');

  // Filter inputs
  const filterCity      = document.getElementById('filter-city');
  const filterPriceMax  = document.getElementById('filter-price-max');
  const filterPriceVal  = document.getElementById('filter-price-value');
  const filterStarBoxes = () => [...document.querySelectorAll('input[name="filter-stars"]:checked')].map(c => Number(c.value));

  // Modal
  const modalOverlay  = document.getElementById('hotel-modal-overlay');
  const confirmOverlay= document.getElementById('confirm-modal-overlay');

  // ── URL Param Helpers ───────────────────────────────────────────────────────

  function getUrlParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      city:     p.get('city')     || '',
      checkin:  p.get('checkin')  || '',
      checkout: p.get('checkout') || '',
      guests:   p.get('guests')   || '1',
    };
  }

  function populateFormFromParams(params) {
    if (inpCity     && params.city)     inpCity.value     = params.city;
    if (inpCheckin  && params.checkin)  inpCheckin.value  = params.checkin;
    if (inpCheckout && params.checkout) inpCheckout.value = params.checkout;
    if (inpGuests   && params.guests)   inpGuests.value   = params.guests;
  }

  // ── Search Hotels ───────────────────────────────────────────────────────────

  async function searchHotels(params = {}) {
    if (!grid) return;
    showSkeletonCards(grid, 6);
    if (emptyState) emptyState.classList.add('hidden');
    if (resultCount) resultCount.textContent = '';

    try {
      const data = await API.searchHotels(params);
      allHotels  = data.hotels || data || [];
      renderHotelGrid(allHotels);
    } catch (err) {
      showError('Failed to load hotels: ' + err.message);
      showEmptyState('Could not load results', 'There was an error connecting to the server. Please try again.');
    }
  }

  async function loadPopularHotels() {
    if (!grid) return;
    showSkeletonCards(grid, 6);
    try {
      const data = await API.getPopularHotels('', 12);
      allHotels  = data.hotels || data || [];
      renderHotelGrid(allHotels);
    } catch (err) {
      showError('Could not load hotels: ' + err.message);
      showEmptyState('No hotels found', 'Please try a different search or check back later.');
    }
  }

  // ── Render Hotel Card ───────────────────────────────────────────────────────

  function renderHotelCard(hotel, index) {
    const img       = hotel.image_url || hotel.image || getPlaceholderImg(index);
    const stars     = renderStars(hotel.star_rating || hotel.stars || 3);
    const price     = formatCurrency(hotel.price_per_night || hotel.price || 0);
    const amenities = (hotel.amenities || []).slice(0, 3).map(a =>
      `<span class="tag">${a}</span>`
    ).join('');
    const avail     = hotel.available !== false
      ? '<span class="avail-badge avail-badge--available">Available</span>'
      : '<span class="avail-badge avail-badge--full">Full</span>';

    return `
      <div class="card" data-hotel-id="${hotel.id || hotel._id}">
        <div class="card__image-wrap">
          <img src="${img}" alt="${hotel.name}" loading="lazy"
               onerror="this.src='${getPlaceholderImg(index + 1)}'">
          <span class="card__image-badge">${hotel.city || ''}</span>
          <span class="card__image-price">${price}/night</span>
        </div>
        <div class="card__body">
          <div class="card__header">
            <h3 class="card__title">${hotel.name}</h3>
            ${avail}
          </div>
          <div class="card__location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${hotel.address || hotel.city || 'India'}
          </div>
          <div class="card__rating">
            ${stars}
            <span class="card__rating-score">${hotel.rating || hotel.star_rating || '4.0'}</span>
            <span class="card__rating-count">(${hotel.review_count || hotel.reviews || 0} reviews)</span>
          </div>
          <div class="card__amenities">${amenities}</div>
          <div class="card__footer">
            <div class="card__price">
              <span class="card__price-amount">${price}</span>
              <span class="card__price-label">per night</span>
            </div>
            <button class="btn-primary btn-sm view-hotel-btn"
                    data-hotel-id="${hotel.id || hotel._id}">
              View Details
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Render Hotel Grid ───────────────────────────────────────────────────────

  function renderHotelGrid(hotels) {
    if (!grid) return;

    if (!hotels || hotels.length === 0) {
      showEmptyState('No hotels found', 'Try adjusting your search or filters.');
      if (resultCount) resultCount.innerHTML = '';
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    grid.innerHTML = hotels.map((h, i) => renderHotelCard(h, i)).join('');

    if (resultCount) {
      resultCount.innerHTML = `Found <strong>${hotels.length}</strong> hotel${hotels.length !== 1 ? 's' : ''}`;
    }

    // Attach view-detail listeners
    grid.querySelectorAll('.view-hotel-btn').forEach(btn => {
      btn.addEventListener('click', () => openHotelModal(btn.dataset.hotelId));
    });
  }

  // ── Empty State ─────────────────────────────────────────────────────────────

  function showEmptyState(title = 'No Results', desc = '') {
    if (!grid) return;
    grid.innerHTML = '';
    if (emptyState) {
      emptyState.classList.remove('hidden');
      const t = emptyState.querySelector('.empty-state__title');
      const d = emptyState.querySelector('.empty-state__desc');
      if (t) t.textContent = title;
      if (d) d.textContent = desc;
    } else {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">🏨</div>
          <div class="empty-state__title">${title}</div>
          <div class="empty-state__desc">${desc}</div>
        </div>
      `;
    }
  }

  // ── Hotel Detail Modal ──────────────────────────────────────────────────────

  async function openHotelModal(hotelId) {
    if (!modalOverlay) return;
    openModal('hotel-modal-overlay');

    const modalBody = document.getElementById('hotel-modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="loading-overlay" style="min-height:200px">
          <div class="spinner spinner-lg"></div>
          <span>Loading hotel details…</span>
        </div>`;
    }

    try {
      const hotel = await API.getHotelById(hotelId);
      currentHotel = hotel;
      renderHotelModal(hotel);
    } catch (err) {
      showError('Could not load hotel details: ' + err.message);
      closeModal('hotel-modal-overlay');
    }
  }

  function renderHotelModal(hotel) {
    const img     = hotel.image_url || hotel.image || getPlaceholderImg(0);
    const stars   = renderStars(hotel.star_rating || hotel.stars || 3);
    const amenArr = hotel.amenities || [];
    const rooms   = hotel.room_types || [
      { type: 'Standard', price: hotel.price_per_night || 2000, capacity: 2 },
      { type: 'Deluxe',   price: Math.round((hotel.price_per_night || 2000) * 1.4), capacity: 2 },
      { type: 'Suite',    price: Math.round((hotel.price_per_night || 2000) * 2.2), capacity: 4 },
    ];

    selectedRoom = rooms[0];

    const modalImg   = document.getElementById('hotel-modal-img');
    const modalTitle = document.getElementById('hotel-modal-title');
    const modalBody  = document.getElementById('hotel-modal-body');

    if (modalImg)   { modalImg.src = img; modalImg.alt = hotel.name; }
    if (modalTitle) modalTitle.textContent = hotel.name;

    if (modalBody) {
      modalBody.innerHTML = `
        <div class="info-grid">
          <div class="info-item">
            <div class="info-item__label">Location</div>
            <div class="info-item__value">${hotel.city || '—'}</div>
          </div>
          <div class="info-item">
            <div class="info-item__label">Star Rating</div>
            <div class="info-item__value">${stars}</div>
          </div>
          <div class="info-item">
            <div class="info-item__label">Guest Rating</div>
            <div class="info-item__value">${hotel.rating || '4.2'} / 5.0</div>
          </div>
          <div class="info-item">
            <div class="info-item__label">Reviews</div>
            <div class="info-item__value">${hotel.review_count || hotel.reviews || 0}</div>
          </div>
        </div>

        ${hotel.description ? `<p style="margin-top:16px;font-size:.9rem;color:var(--color-text-secondary);line-height:1.7">${hotel.description}</p>` : ''}

        <div class="modal__section-title">Amenities</div>
        <div class="amenities-list">
          ${amenArr.length ? amenArr.map(a => `<span class="tag tag--primary">${a}</span>`).join('') : '<span class="tag">WiFi</span><span class="tag">Parking</span><span class="tag">Restaurant</span>'}
        </div>

        <div class="modal__section-title">Select Room Type</div>
        <div class="room-types" id="room-types-list">
          ${rooms.map((r, i) => `
            <label class="room-type-option ${i === 0 ? 'selected' : ''}" data-room-type="${r.type}" data-room-price="${r.price}">
              <input type="radio" name="room-type" value="${r.type}" ${i === 0 ? 'checked' : ''}>
              <span class="room-type-name">${r.type} Room</span>
              <span style="font-size:.78rem;color:var(--color-text-secondary);margin-right:auto;margin-left:8px">Max ${r.capacity || 2} guests</span>
              <span class="room-type-price">${formatCurrency(r.price)}/night</span>
            </label>
          `).join('')}
        </div>

        <div class="modal__section-title">Booking Details</div>
        <div class="booking-form" id="hotel-booking-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Check-in Date</label>
              <input type="date" class="form-input" id="book-checkin"
                     min="${new Date().toISOString().split('T')[0]}"
                     value="${document.getElementById('search-checkin')?.value || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Check-out Date</label>
              <input type="date" class="form-input" id="book-checkout"
                     value="${document.getElementById('search-checkout')?.value || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Guests</label>
              <input type="number" class="form-input" id="book-guests" min="1" max="10"
                     value="${document.getElementById('search-guests')?.value || 1}">
            </div>
            <div class="form-group">
              <label class="form-label">Your Name</label>
              <input type="text" class="form-input" id="book-name"
                     value="${window.getCurrentUser ? (getCurrentUser()?.name || '') : ''}"
                     placeholder="Full name">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" id="book-email"
                   value="${window.getCurrentUser ? (getCurrentUser()?.email || '') : ''}"
                   placeholder="you@example.com">
          </div>
          <div id="book-price-summary" style="background:var(--color-bg);border-radius:8px;padding:14px;margin-top:4px">
            <div style="display:flex;justify-content:space-between;font-size:.875rem;color:var(--color-text-secondary);">
              <span>Price estimate</span>
              <span id="price-estimate" style="font-weight:700;color:var(--color-primary);">—</span>
            </div>
          </div>
        </div>
      `;

      // Room type selection
      document.querySelectorAll('.room-type-option').forEach(opt => {
        opt.addEventListener('click', () => {
          document.querySelectorAll('.room-type-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          opt.querySelector('input[type="radio"]').checked = true;
          selectedRoom = { type: opt.dataset.roomType, price: Number(opt.dataset.roomPrice) };
          updatePriceEstimate();
        });
      });

      // Date change → update price
      document.getElementById('book-checkin')?.addEventListener('change',  updatePriceEstimate);
      document.getElementById('book-checkout')?.addEventListener('change', updatePriceEstimate);

      updatePriceEstimate();
    }
  }

  function updatePriceEstimate() {
    const checkin  = document.getElementById('book-checkin')?.value;
    const checkout = document.getElementById('book-checkout')?.value;
    const el       = document.getElementById('price-estimate');
    if (!el) return;

    if (checkin && checkout && selectedRoom) {
      const nights = countNights(checkin, checkout);
      el.textContent = `${formatCurrency(selectedRoom.price * nights)} (${nights} night${nights !== 1 ? 's' : ''})`;
    } else {
      el.textContent = selectedRoom ? `${formatCurrency(selectedRoom.price)}/night` : '—';
    }
  }

  // ── Book Hotel ──────────────────────────────────────────────────────────────

  async function bookHotel() {
    const checkin  = document.getElementById('book-checkin')?.value;
    const checkout = document.getElementById('book-checkout')?.value;
    const guests   = document.getElementById('book-guests')?.value;
    const name     = document.getElementById('book-name')?.value?.trim();
    const email    = document.getElementById('book-email')?.value?.trim();

    if (!checkin || !checkout || !name || !email) {
      showWarning('Please fill in all required fields.'); return;
    }
    if (new Date(checkout) <= new Date(checkin)) {
      showWarning('Check-out must be after check-in.'); return;
    }
    if (!email.includes('@')) {
      showWarning('Please enter a valid email address.'); return;
    }

    const bookBtn = document.getElementById('confirm-book-btn');
    if (bookBtn) { bookBtn.disabled = true; bookBtn.textContent = 'Booking…'; }

    try {
      const user = getCurrentUser();
      const data = {
        user_id:    user?.id || null,
        hotel_id:   currentHotel?.id || currentHotel?._id,
        room_type:  selectedRoom?.type || 'Standard',
        checkin,
        checkout,
        guests:     Number(guests) || 1,
        name,
        email,
      };

      const result = await API.createHotelBooking(data);

      // Save user if not logged in
      if (!user) setCurrentUser({ name, email, id: result.user_id || Date.now() });

      closeModal('hotel-modal-overlay');
      showBookingConfirmation(result, 'hotel');
    } catch (err) {
      showError('Booking failed: ' + err.message);
    } finally {
      if (bookBtn) { bookBtn.disabled = false; bookBtn.textContent = 'Complete Booking'; }
    }
  }

  // ── Booking Confirmation ────────────────────────────────────────────────────

  function showBookingConfirmation(booking, type) {
    if (!confirmOverlay) {
      showSuccess(`Booking confirmed! Reference: ${booking.booking_id || booking.id || 'N/A'}`);
      return;
    }

    const nights = booking.checkin && booking.checkout
      ? countNights(booking.checkin, booking.checkout) : 1;
    const total  = formatCurrency(booking.total_amount || booking.amount || (selectedRoom?.price || 0) * nights);

    const body = document.getElementById('confirm-modal-body');
    if (body) {
      body.innerHTML = `
        <div style="text-align:center;padding-bottom:16px">
          <div class="confirmation-icon">✅</div>
          <h3 style="margin-bottom:8px;font-size:1.2rem">Booking Confirmed!</h3>
          <p style="color:var(--color-text-secondary);font-size:.875rem">
            Your hotel room has been successfully reserved.
          </p>
        </div>
        <div class="confirmation-details">
          <div class="confirmation-row">
            <span class="confirmation-row__label">Booking ID</span>
            <span class="confirmation-row__value" style="font-family:monospace">
              ${booking.booking_id || booking.id || 'BK' + Date.now()}
            </span>
          </div>
          <div class="confirmation-row">
            <span class="confirmation-row__label">Hotel</span>
            <span class="confirmation-row__value">${currentHotel?.name || '—'}</span>
          </div>
          <div class="confirmation-row">
            <span class="confirmation-row__label">Room Type</span>
            <span class="confirmation-row__value">${selectedRoom?.type || 'Standard'} Room</span>
          </div>
          <div class="confirmation-row">
            <span class="confirmation-row__label">Check-in</span>
            <span class="confirmation-row__value">${formatDate(booking.checkin || document.getElementById('book-checkin')?.value)}</span>
          </div>
          <div class="confirmation-row">
            <span class="confirmation-row__label">Check-out</span>
            <span class="confirmation-row__value">${formatDate(booking.checkout || document.getElementById('book-checkout')?.value)}</span>
          </div>
          <div class="confirmation-row" style="border-top:1px solid var(--color-border);padding-top:10px;margin-top:4px">
            <span class="confirmation-row__label" style="font-weight:700">Total Amount</span>
            <span class="confirmation-row__value" style="color:var(--color-primary);font-size:1.05rem">${total}</span>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:20px">
          <a href="bookings.html" class="btn-primary" style="flex:1;justify-content:center">View My Bookings</a>
          <button class="btn-outline" data-close-modal="confirm-modal-overlay" style="flex:1;justify-content:center">Close</button>
        </div>
      `;
    }

    openModal('confirm-modal-overlay');
  }

  // ── Client-side Filtering ───────────────────────────────────────────────────

  function applyFilters() {
    let filtered = [...allHotels];

    // City filter
    const city = filterCity?.value;
    if (city) {
      filtered = filtered.filter(h => (h.city || '').toLowerCase().includes(city.toLowerCase()));
    }

    // Min stars filter
    const stars = filterStarBoxes();
    if (stars.length > 0) {
      filtered = filtered.filter(h => stars.includes(Math.round(h.star_rating || h.stars || 0)));
    }

    // Max price filter
    const maxPrice = Number(filterPriceMax?.value || 99999);
    filtered = filtered.filter(h => (h.price_per_night || h.price || 0) <= maxPrice);

    renderHotelGrid(filtered);
  }

  function resetFilters() {
    if (filterCity)    filterCity.value    = '';
    if (filterPriceMax){ filterPriceMax.value = filterPriceMax.max; updatePriceLabel(); }
    document.querySelectorAll('input[name="filter-stars"]').forEach(cb => cb.checked = false);
    renderHotelGrid(allHotels);
  }

  function updatePriceLabel() {
    if (filterPriceMax && filterPriceVal) {
      filterPriceVal.textContent = formatCurrency(filterPriceMax.value);
    }
  }

  // ── Event Listeners ─────────────────────────────────────────────────────────

  function bindEvents() {
    // Search form
    searchForm?.addEventListener('submit', e => {
      e.preventDefault();
      const params = {
        city:     inpCity?.value     || '',
        checkin:  inpCheckin?.value  || '',
        checkout: inpCheckout?.value || '',
        guests:   inpGuests?.value   || 1,
      };
      searchHotels(params);
    });

    // Filter form
    filterForm?.addEventListener('submit', e => { e.preventDefault(); applyFilters(); });
    document.getElementById('reset-filters-btn')?.addEventListener('click', resetFilters);

    // Price slider live update
    filterPriceMax?.addEventListener('input', updatePriceLabel);

    // Modal confirm booking button
    document.getElementById('confirm-book-btn')?.addEventListener('click', bookHotel);

    // Modal close buttons (handled globally by main.js initModals)
  }

  // ── Set Default Dates ───────────────────────────────────────────────────────

  function setDefaultDates() {
    const today    = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);

    const toISO = d => d.toISOString().split('T')[0];

    if (inpCheckin  && !inpCheckin.value)  inpCheckin.value  = toISO(tomorrow);
    if (inpCheckout && !inpCheckout.value) inpCheckout.value = toISO(dayAfter);

    if (inpCheckin)  inpCheckin.min  = toISO(today);
    if (inpCheckout) inpCheckout.min = toISO(tomorrow);
  }

  // ── Page Initialisation ─────────────────────────────────────────────────────

  async function init() {
    setDefaultDates();
    bindEvents();
    updatePriceLabel();

    const params = getUrlParams();
    populateFormFromParams(params);

    if (params.city || params.checkin) {
      await searchHotels(params);
    } else {
      await loadPopularHotels();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
