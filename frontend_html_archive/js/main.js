/* ============================================================
   main.js — Global JS utilities for StayEase
   ============================================================ */

// ── Toast Notification System ───────────────────────────────────────────────

/**
 * Show a toast notification.
 * @param {string} message  - Primary message text
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {string} [title]  - Optional bold title
 * @param {number} [duration=4000] - Auto-dismiss duration in ms
 */
function showToast(message, type = 'info', title = '', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error:   '❌',
    info:    'ℹ️',
    warning: '⚠️',
  };

  const titles = {
    success: title || 'Success',
    error:   title || 'Error',
    info:    title || 'Info',
    warning: title || 'Warning',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast__body">
      <div class="toast__title">${titles[type]}</div>
      <div class="toast__message">${message}</div>
    </div>
    <button class="toast__close" aria-label="Close">&times;</button>
  `;

  container.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 320);
  };

  toast.querySelector('.toast__close').addEventListener('click', dismiss);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}

// Convenience wrappers
window.showToast = showToast;
window.showSuccess = (msg, title) => showToast(msg, 'success', title);
window.showError   = (msg, title) => showToast(msg, 'error',   title);
window.showInfo    = (msg, title) => showToast(msg, 'info',    title);
window.showWarning = (msg, title) => showToast(msg, 'warning', title);

// ── User Session Management ─────────────────────────────────────────────────

const USER_KEY = 'stayease_user';

/**
 * Get the currently logged-in user from sessionStorage.
 * @returns {Object|null} User object or null
 */
function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persist a user object to sessionStorage.
 * @param {Object} user
 */
function setCurrentUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Remove the stored user (logout).
 */
function clearUser() {
  sessionStorage.removeItem(USER_KEY);
}

window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.clearUser      = clearUser;

// ── Loading State Utilities ─────────────────────────────────────────────────

/**
 * Show a loading spinner inside an element, replacing its content.
 * Saves the original HTML on the element's dataset.
 * @param {HTMLElement} el
 * @param {string} [text='Loading…']
 */
function showLoading(el, text = 'Loading…') {
  if (!el) return;
  el.dataset.originalHtml = el.innerHTML;
  el.innerHTML = `
    <div class="loading-overlay">
      <div class="spinner spinner-lg"></div>
      <span>${text}</span>
    </div>
  `;
}

/**
 * Restore an element to its original content after loading.
 * @param {HTMLElement} el
 */
function hideLoading(el) {
  if (!el) return;
  if (el.dataset.originalHtml !== undefined) {
    el.innerHTML = el.dataset.originalHtml;
    delete el.dataset.originalHtml;
  }
}

window.showLoading = showLoading;
window.hideLoading = hideLoading;

// ── Navigation Active Link ──────────────────────────────────────────────────

function highlightActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    link.classList.toggle('active', href === current || (current === '' && href === 'index.html'));
  });
}

// ── Hamburger Menu ──────────────────────────────────────────────────────────

function initHamburger() {
  const btn  = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
  });

  // Close when a link is clicked
  menu.querySelectorAll('.navbar__link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('open');
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      btn.classList.remove('open');
    }
  });
}

// ── Modal Helpers ───────────────────────────────────────────────────────────

/**
 * Open a modal by its overlay element ID.
 * @param {string} overlayId
 */
function openModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * Close a modal by its overlay element ID.
 * @param {string} overlayId
 */
function closeModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

window.openModal  = openModal;
window.closeModal = closeModal;

// Attach close to all [data-close-modal] buttons & overlay clicks
function initModals() {
  document.addEventListener('click', e => {
    // Close button inside modal
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
      const overlayId = closeBtn.dataset.closeModal;
      closeModal(overlayId);
      return;
    }

    // Click on backdrop (the overlay itself)
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(overlay => {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
  });
}

// ── Star Rating Renderer ────────────────────────────────────────────────────

/**
 * Render star rating HTML.
 * @param {number} rating - 0–5 (supports .5 halves but renders as full/empty)
 * @param {number} [max=5]
 * @returns {string} HTML string
 */
function renderStars(rating, max = 5) {
  let html = '<span class="rating-stars">';
  for (let i = 1; i <= max; i++) {
    html += `<span class="${i <= Math.round(rating) ? 'star-filled' : 'star-empty'}">★</span>`;
  }
  html += '</span>';
  return html;
}

window.renderStars = renderStars;

// ── Format Currency ─────────────────────────────────────────────────────────

/**
 * Format a number as Indian Rupee currency.
 * @param {number} amount
 * @returns {string} e.g. "₹2,500"
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

window.formatCurrency = formatCurrency;

// ── Format Date ─────────────────────────────────────────────────────────────

/**
 * Format a date string to a readable format.
 * @param {string} dateStr - ISO date string
 * @returns {string} e.g. "12 Jan 2025"
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

window.formatDate = formatDate;

// ── Compute Night Count ─────────────────────────────────────────────────────

/**
 * Compute number of nights between two date strings.
 * @param {string} checkin
 * @param {string} checkout
 * @returns {number}
 */
function countNights(checkin, checkout) {
  const a = new Date(checkin);
  const b = new Date(checkout);
  const diff = b - a;
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

window.countNights = countNights;

// ── Skeleton Cards Helper ───────────────────────────────────────────────────

/**
 * Render N skeleton cards into a container.
 * @param {HTMLElement} container
 * @param {number} count
 */
function showSkeletonCards(container, count = 6) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count }).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-card__img"></div>
      <div class="skeleton-card__body">
        <div class="skeleton-line skeleton-line--lg"></div>
        <div class="skeleton-line skeleton-line--md"></div>
        <div class="skeleton-line skeleton-line--sm"></div>
        <div class="skeleton-line skeleton-line--full"></div>
      </div>
    </div>
  `).join('');
}

window.showSkeletonCards = showSkeletonCards;

// ── Initialise on DOM Ready ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  initHamburger();
  initModals();

  // Ensure toast container exists
  if (!document.getElementById('toast-container')) {
    const tc = document.createElement('div');
    tc.id = 'toast-container';
    document.body.appendChild(tc);
  }
});
