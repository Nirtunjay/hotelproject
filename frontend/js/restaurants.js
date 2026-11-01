/* ============================================================
   restaurants.js — Restaurant Search Page Logic for StayEase
   ============================================================ */

(function () {
  'use strict';

  // ── State ───────────────────────────────────────────────────────────────────

  let allRestaurants  = [];
  let currentRestaurant = null;

  const PLACEHOLDER_IMGS = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=250&fit=crop',
  ];

  function getPlaceholderImg(index) {
    return PLACEHOLDER_IMGS[index % PLACEHOLDER_IMGS.length];
  }

  const CUISINE_CLASSES = {
    'Indian':       'tag-indian',
    'Chinese':      'tag-chinese',
    'Italian':      'tag-italian',
    'Continental':  'tag-continental',
    'Fast Food':    'tag-fastfood',
    'South Indian': 'tag-south',
    'North Indian': 'tag-north',
  };

  // ── DOM References ──────────────────────────────────────────────────────────

  const grid        = document.getElementById('restaurants-grid');
  const resultCount = document.getElementById('result-count');
  const searchForm  = document.getElementById('restaurant-search-form');
  const emptyState  = document.getElementById('restaurant-empty-state');

  const inpCity    = document.getElementById('search-city');
  const inpDate    = document.getElementById('search-date');
  const inpTime    = document.getElementById('search-time');
  const inpGuests  = document.getElementById('search-guests');

  const filterCity     = document.getElementById('filter-city');
  const filterPriceMax = document.getElementById('filter-price-max');
  const filterPriceVal = document.getElementById('filter-price-value');

  const modalOverlay  = document.getElementById('restaurant-modal-overlay');
  const confirmOverlay= document.getElementById('confirm-modal-overlay');

  // ── URL Params ──────────────────────────────────────────────────────────────

  function getUrlParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      city:  p.get('city') || '',
      date:  p.get('date') || '',
      time:  p.get('time') || '',
      guests:p.get('guests') || '2',
      lat:   p.get('lat')  || '',
      lng:   p.get('lng')  || '',
    };
  }

  function populateFormFromParams(params) {
    if (inpCity   && params.city)   inpCity.value   = params.city;
    if (inpDate   && params.date)   inpDate.value   = params.date;
    if (inpTime   && params.time)   inpTime.value   = params.time;
    if (inpGuests && params.guests) inpGuests.value = params.guests;
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  async function searchRestaurants(params = {}) {
    if (!grid) return;
    showSkeletonCards(grid, 6);
    if (emptyState) emptyState.classList.add('hidden');
    if (resultCount) resultCount.textContent = '';

    try {
      const data        = await API.searchRestaurants(params);
      allRestaurants    = data.restaurants || data || [];
      renderRestaurantGrid(allRestaurants);
    } catch (err) {
      showError('Failed to load restaurants: ' + err.message);
      showEmptyState('Could not load results', 'There was an error connecting to the server.');
    }
  }

  async function loadFeaturedRestaurants() {
    if (!grid) return;
    showSkeletonCards(grid, 6);
    try {
      const data     = await API.searchRestaurants({ limit: 12 });
      allRestaurants = data.restaurants || data || [];
      renderRestaurantGrid(allRestaurants);
    } catch (err) {
      showError('Could not load restaurants: ' + err.message);
      showEmptyState('No restaurants found', 'Please try a different search or check back later.');
    }
  }

  async function getNearby() {
    if (!navigator.geolocation) {
      showWarning("Your browser doesn't support location access."); return;
    }

    const btn = document.getElementById('use-location-btn');
    if (btn) { btn.disabled = true; btn.textContent = '📍 Locating…'; }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (btn) { btn.disabled = false; btn.innerHTML = '📍 Use My Location'; }
        showSkeletonCards(grid, 6);

        try {
          const data     = await API.getNearbyRestaurants(lat, lng);
          allRestaurants = data.restaurants || data || [];
          renderRestaurantGrid(allRestaurants);
          showInfo(`Found ${allRestaurants.length} restaurants near you!`);
        } catch (err) {
          showError('Could not load nearby restaurants: ' + err.message);
        }
      },
      () => {
        if (btn) { btn.disabled = false; btn.innerHTML = '📍 Use My Location'; }
        showWarning('Location access denied. Please search by city name.');
      }
    );
  }

  // ── Render Restaurant Card ──────────────────────────────────────────────────

  function renderRestaurantCard(restaurant, index) {
    const img      = restaurant.image_url || restaurant.image || getPlaceholderImg(index);
    const rating   = restaurant.rating || 4.0;
    const stars    = renderStars(Math.round(rating));
    const cuisine  = restaurant.cuisine_type || restaurant.cuisine || 'Multi-cuisine';
    const price    = formatCurrency(restaurant.avg_price_for_two || restaurant.price_for_two || 0);
    const cuisTag  = CUISINE_CLASSES[cuisine] || '';
    const avail    = restaurant.available !== false
      ? '<span class="avail-badge avail-badge--available">Open</span>'
      : '<span class="avail-badge avail-badge--full">Closed</span>';

    return `
      <div class="card" data-restaurant-id="${restaurant.id || restaurant._id}">
        <div class="card__image-wrap">
          <img src="${img}" alt="${restaurant.name}" loading="lazy"
               onerror="this.src='${getPlaceholderImg(index + 1)}'">
          <span class="card__image-badge">${restaurant.city || ''}</span>
          <span class="card__image-price">₹${restaurant.avg_price_for_two || restaurant.price_for_two || 0} for 2</span>
        </div>
        <div class="card__body">
          <div class="card__header">
            <h3 class="card__title">${restaurant.name}</h3>
            ${avail}
          </div>
          <div class="card__location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${restaurant.address || restaurant.city || 'India'}
          </div>
          <div class="card__rating">
            ${stars}
            <span class="card__rating-score">${rating}</span>
            <span class="card__rating-count">(${restaurant.review_count || 0} reviews)</span>
          </div>
          <div class="card__amenities">
            <span class="tag ${cuisTag}">${cuisine}</span>
            ${(restaurant.specialties || []).slice(0, 2).map(s => `<span class="tag">${s}</span>`).join('')}
          </div>
          <div class="card__footer">
            <div class="card__price">
              <span class="card__price-amount">${price}</span>
              <span class="card__price-label">for two</span>
            </div>
            <button class="btn-primary btn-sm book-table-btn"
                    data-restaurant-id="${restaurant.id || restaurant._id}">
              Book Table
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Render Grid ─────────────────────────────────────────────────────────────

  function renderRestaurantGrid(restaurants) {
    if (!grid) return;

    if (!restaurants || restaurants.length === 0) {
      showEmptyState('No restaurants found', 'Try adjusting your search or filters.');
      if (resultCount) resultCount.innerHTML = '';
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    grid.innerHTML = restaurants.map((r, i) => renderRestaurantCard(r, i)).join('');

    if (resultCount) {
      resultCount.innerHTML = `Found <strong>${restaurants.length}</strong> restaurant${restaurants.length !== 1 ? 's' : ''}`;
    }

    grid.querySelectorAll('.book-table-btn').forEach(btn => {
      btn.addEventListener('click', () => openRestaurantModal(btn.dataset.restaurantId));
    });
  }

  // ── Empty State ─────────────────────────────────────────────────────────────

  function showEmptyState(title, desc) {
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
          <div class="empty-state__icon">🍽️</div>
          <div class="empty-state__title">${title}</div>
          <div class="empty-state__desc">${desc}</div>
        </div>
      `;
    }
  }

  // ── Restaurant Detail Modal ─────────────────────────────────────────────────

  async function openRestaurantModal(restaurantId) {
    if (!modalOverlay) return;
    openModal('restaurant-modal-overlay');

    const modalBody = document.getElementById('restaurant-modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="loading-overlay" style="min-height:200px">
          <div class="spinner spinner-lg"></div>
          <span>Loading restaurant details…</span>
        </div>`;
    }

    try {
      const restaurant  = await API.getRestaurantById(restaurantId);
      currentRestaurant = restaurant;
      renderRestaurantModal(restaurant);
    } catch (err) {
      showError('Could not load restaurant details: ' + err.message);
      closeModal('restaurant-modal-overlay');
    }
  }

  function renderRestaurantModal(restaurant) {
    const img      = restaurant.image_url || restaurant.image || getPlaceholderImg(0);
    const cuisine  = restaurant.cuisine_type || restaurant.cuisine || 'Multi-cuisine';
    const rating   = restaurant.rating || 4.0;
    const stars    = renderStars(Math.round(rating));
    const cuisTag  = CUISINE_CLASSES[cuisine] || '';

    const modalImg   = document.getElementById('restaurant-modal-img');
    const modalTitle = document.getElementById('restaurant-modal-title');
    const modalBody  = document.getElementById('restaurant-modal-body');

    if (modalImg)   { modalImg.src = img; modalImg.alt = restaurant.name; }
    if (modalTitle) modalTitle.textContent = restaurant.name;

    // Build time slots (mock if none provided)
    const slots = restaurant.available_slots || ['12:00', '13:00', '14:00', '19:00', '20:00', '21:00'];

    if (modalBody) {
      modalBody.innerHTML = `
        <div class="info-grid">
          <div class="info-item">
            <div class="info-item__label">Location</div>
            <div class="info-item__value">${restaurant.city || '—'}</div>
          </div>
          <div class="info-item">
            <div class="info-item__label">Cuisine</div>
            <div class="info-item__value"><span class="tag ${cuisTag}">${cuisine}</span></div>
          </div>
          <div class="info-item">
            <div class="info-item__label">Rating</div>
            <div class="info-item__value">${stars} ${rating}</div>
          </div>
          <div class="info-item">
            <div class="info-item__label">Avg. for Two</div>
            <div class="info-item__value">${formatCurrency(restaurant.avg_price_for_two || restaurant.price_for_two || 0)}</div>
          </div>
        </div>

        ${restaurant.description ? `<p style="margin-top:16px;font-size:.9rem;color:var(--color-text-secondary);line-height:1.7">${restaurant.description}</p>` : ''}

        ${(restaurant.specialties || []).length ? `
          <div class="modal__section-title">Specialties</div>
          <div class="amenities-list">
            ${restaurant.specialties.map(s => `<span class="tag tag--accent">${s}</span>`).join('')}
          </div>
        ` : ''}

        <div class="modal__section-title">Table Booking</div>
        <div class="booking-form" id="restaurant-booking-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-input" id="book-date"
                     min="${new Date().toISOString().split('T')[0]}"
                     value="${inpDate?.value || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Guests</label>
              <input type="number" class="form-input" id="book-guests"
                     min="1" max="20"
                     value="${inpGuests?.value || 2}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Time</label>
            <select class="form-select" id="book-time">
              ${slots.map(t => `<option value="${t}" ${t === (inpTime?.value || '') ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Your Name</label>
              <input type="text" class="form-input" id="book-name"
                     value="${window.getCurrentUser ? (getCurrentUser()?.name || '') : ''}"
                     placeholder="Full name">
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-input" id="book-email"
                     value="${window.getCurrentUser ? (getCurrentUser()?.email || '') : ''}"
                     placeholder="you@example.com">
            </div>
          </div>
        </div>
      `;
    }
  }

  // ── Book Table ──────────────────────────────────────────────────────────────

  async function bookTable() {
    const date   = document.getElementById('book-date')?.value;
    const time   = document.getElementById('book-time')?.value;
    const guests = document.getElementById('book-guests')?.value;
    const name   = document.getElementById('book-name')?.value?.trim();
    const email  = document.getElementById('book-email')?.value?.trim();

    if (!date || !time || !name || !email) {
      showWarning('Please fill in all required fields.'); return;
    }
    if (!email.includes('@')) {
      showWarning('Please enter a valid email address.'); return;
    }

    const bookBtn = document.getElementById('confirm-table-btn');
    if (bookBtn) { bookBtn.disabled = true; bookBtn.textContent = 'Booking…'; }

    try {
      const user = getCurrentUser();
      const data = {
        user_id:       user?.id || null,
        restaurant_id: currentRestaurant?.id || currentRestaurant?._id,
        date,
        time,
        guests:  Number(guests) || 2,
        name,
        email,
      };

      const result = await API.createRestaurantBooking(data);
      if (!user) setCurrentUser({ name, email, id: result.user_id || Date.now() });

      closeModal('restaurant-modal-overlay');
      showRestaurantConfirmation(result);
    } catch (err) {
      showError('Booking failed: ' + err.message);
    } finally {
      if (bookBtn) { bookBtn.disabled = false; bookBtn.textContent = 'Confirm Booking'; }
    }
  }

  function showRestaurantConfirmation(booking) {
    if (!confirmOverlay) {
      showSuccess(`Table booked! Reference: ${booking.booking_id || booking.id || 'N/A'}`);
      return;
    }

    const body = document.getElementById('confirm-modal-body');
    if (body) {
      body.innerHTML = `
        <div style="text-align:center;padding-bottom:16px">
          <div class="confirmation-icon">✅</div>
          <h3 style="margin-bottom:8px;font-size:1.2rem">Table Reserved!</h3>
          <p style="color:var(--color-text-secondary);font-size:.875rem">
            Your table has been successfully reserved.
          </p>
        </div>
        <div class="confirmation-details">
          <div class="confirmation-row">
            <span class="confirmation-row__label">Booking ID</span>
            <span class="confirmation-row__value" style="font-family:monospace">
              ${booking.booking_id || booking.id || 'TB' + Date.now()}
            </span>
          </div>
          <div class="confirmation-row">
            <span class="confirmation-row__label">Restaurant</span>
            <span class="confirmation-row__value">${currentRestaurant?.name || '—'}</span>
          </div>
          <div class="confirmation-row">
            <span class="confirmation-row__label">Date</span>
            <span class="confirmation-row__value">${formatDate(booking.date || document.getElementById('book-date')?.value)}</span>
          </div>
          <div class="confirmation-row">
            <span class="confirmation-row__label">Time</span>
            <span class="confirmation-row__value">${booking.time || document.getElementById('book-time')?.value}</span>
          </div>
          <div class="confirmation-row">
            <span class="confirmation-row__label">Guests</span>
            <span class="confirmation-row__value">${booking.guests || document.getElementById('book-guests')?.value}</span>
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
    let filtered = [...allRestaurants];

    const city = filterCity?.value;
    if (city) {
      filtered = filtered.filter(r => (r.city || '').toLowerCase().includes(city.toLowerCase()));
    }

    // Cuisine filter
    const checkedCuisines = [...document.querySelectorAll('input[name="filter-cuisine"]:checked')].map(c => c.value);
    if (checkedCuisines.length > 0) {
      filtered = filtered.filter(r =>
        checkedCuisines.some(c => (r.cuisine_type || r.cuisine || '').toLowerCase().includes(c.toLowerCase()))
      );
    }

    const maxPrice = Number(filterPriceMax?.value || 99999);
    filtered = filtered.filter(r => (r.avg_price_for_two || r.price_for_two || 0) <= maxPrice);

    renderRestaurantGrid(filtered);
  }

  function resetFilters() {
    if (filterCity)    filterCity.value = '';
    if (filterPriceMax){ filterPriceMax.value = filterPriceMax.max; updatePriceLabel(); }
    document.querySelectorAll('input[name="filter-cuisine"]').forEach(cb => cb.checked = false);
    renderRestaurantGrid(allRestaurants);
  }

  function updatePriceLabel() {
    if (filterPriceMax && filterPriceVal) {
      filterPriceVal.textContent = formatCurrency(filterPriceMax.value);
    }
  }

  // ── Events ──────────────────────────────────────────────────────────────────

  function bindEvents() {
    searchForm?.addEventListener('submit', e => {
      e.preventDefault();
      searchRestaurants({
        city:   inpCity?.value   || '',
        date:   inpDate?.value   || '',
        time:   inpTime?.value   || '',
        guests: inpGuests?.value || 2,
      });
    });

    document.getElementById('restaurant-filter-form')?.addEventListener('submit', e => {
      e.preventDefault(); applyFilters();
    });

    document.getElementById('reset-filters-btn')?.addEventListener('click', resetFilters);
    document.getElementById('use-location-btn')?.addEventListener('click', getNearby);
    document.getElementById('confirm-table-btn')?.addEventListener('click', bookTable);
    filterPriceMax?.addEventListener('input', updatePriceLabel);
  }

  function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    if (inpDate && !inpDate.value) { inpDate.value = today; inpDate.min = today; }
    if (inpTime && !inpTime.value) inpTime.value = '19:00';
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  async function init() {
    setDefaultDate();
    bindEvents();
    updatePriceLabel();

    const params = getUrlParams();
    populateFormFromParams(params);

    if (params.lat && params.lng) {
      showSkeletonCards(grid, 6);
      try {
        const data     = await API.getNearbyRestaurants(params.lat, params.lng);
        allRestaurants = data.restaurants || data || [];
        renderRestaurantGrid(allRestaurants);
      } catch { await loadFeaturedRestaurants(); }
    } else if (params.city || params.date) {
      await searchRestaurants(params);
    } else {
      await loadFeaturedRestaurants();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
