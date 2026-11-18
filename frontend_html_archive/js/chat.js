/* ============================================================
   chat.js — AI Assistant Chat Widget for StayEase
   ============================================================ */

class ChatWidget {
  constructor() {
    this.isOpen       = false;
    this.isAgentMode  = false;
    this.sessionId    = this._generateSessionId();
    this.history      = this._loadHistory();
    this.quickReplies = [
      '🏨 Find hotels in Mumbai',
      '🍽️ Best restaurants nearby',
      '📋 My bookings',
      '💡 How does it work?',
      '🔍 Search by location',
    ];

    this._injectHTML();
    this._bindEvents();
    this._renderHistory();
    this._setDefaultQuickReplies();

    // Greet if first session
    if (this.history.length === 0) {
      setTimeout(() => this._pushAssistantMessage(
        "👋 Hi! I'm your AI travel assistant. I can help you find hotels, restaurants, and manage your bookings. What are you looking for today?",
        this.quickReplies
      ), 400);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  open() {
    this.isOpen = true;
    this.panel.classList.add('open');
    this.toggleBtn.setAttribute('aria-expanded', 'true');
    this._scrollToBottom();
    // Hide unread badge
    const badge = document.querySelector('.chat-unread-badge');
    if (badge) badge.classList.remove('visible');
  }

  close() {
    this.isOpen = false;
    this.panel.classList.remove('open');
    this.toggleBtn.setAttribute('aria-expanded', 'false');
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  async sendMessage(text) {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();

    this._pushUserMessage(trimmed);
    this._clearInput();
    this.showTyping();

    const isAgentTrigger = /^(book |find and book|reserve )/i.test(trimmed);

    try {
      let response;

      if (isAgentTrigger) {
        this.isAgentMode = true;
        response = await API.sendAgentInstruction(trimmed, this._buildContext());
        this.hideTyping();
        this._handleAgentResponse(response);
      } else {
        this.isAgentMode = false;
        response = await API.sendChatMessage(trimmed, this.sessionId, this._buildContext());
        this.hideTyping();
        this._handleChatResponse(response);
      }
    } catch (err) {
      this.hideTyping();
      this._pushAssistantMessage(
        `Sorry, I'm having trouble connecting right now. Please try again in a moment. (${err.message})`,
        ['Try again', '🏨 Browse Hotels', '🍽️ Browse Restaurants']
      );
    }
  }

  receiveMessage(response) {
    this._handleChatResponse(response);
  }

  showTyping() {
    if (this.typingEl) this.typingEl.classList.add('visible');
    this._scrollToBottom();
  }

  hideTyping() {
    if (this.typingEl) this.typingEl.classList.remove('visible');
  }

  // ── Private: HTML Injection ─────────────────────────────────────────────────

  _injectHTML() {
    // Toggle button
    const btn = document.getElementById('chat-toggle-btn');
    if (btn) {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <span class="chat-unread-badge">1</span>
      `;
      this.toggleBtn = btn;
    }

    // Chat panel
    const panel = document.createElement('div');
    panel.id = 'chat-panel';
    panel.className = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'AI Chat Assistant');
    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header__avatar">🤖</div>
        <div class="chat-header__info">
          <div class="chat-header__title">AI Assistant</div>
          <div class="chat-header__subtitle">Ask me anything</div>
        </div>
        <div class="chat-header__actions">
          <button class="chat-header-btn" id="chat-clear-btn" title="Clear chat">🗑️</button>
          <button class="chat-header-btn" id="chat-close-btn" title="Close">✕</button>
        </div>
      </div>

      <div class="chat-messages" id="chat-messages">
        <!-- Messages injected by JS -->
        <div class="chat-typing" id="chat-typing">
          <div class="chat-typing__avatar">🤖</div>
          <div class="chat-typing__bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>

      <div class="chat-quick-replies" id="chat-quick-replies"></div>

      <div class="chat-input-area">
        <textarea
          class="chat-input"
          id="chat-input"
          placeholder="Ask about hotels, restaurants…"
          rows="1"
          maxlength="500"
          aria-label="Chat message"
        ></textarea>
        <button class="chat-send-btn" id="chat-send-btn" aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(panel);
    this.panel = panel;

    // Cache elements
    this.messagesEl    = panel.querySelector('#chat-messages');
    this.typingEl      = panel.querySelector('#chat-typing');
    this.quickRepliesEl= panel.querySelector('#chat-quick-replies');
    this.inputEl       = panel.querySelector('#chat-input');
    this.sendBtnEl     = panel.querySelector('#chat-send-btn');
  }

  // ── Private: Event Binding ─────────────────────────────────────────────────

  _bindEvents() {
    // Toggle open/close
    this.toggleBtn?.addEventListener('click', () => this.toggle());

    // Close button
    this.panel.querySelector('#chat-close-btn')?.addEventListener('click', () => this.close());

    // Clear history
    this.panel.querySelector('#chat-clear-btn')?.addEventListener('click', () => {
      this._clearHistory();
      this.messagesEl.querySelectorAll('.chat-message').forEach(m => m.remove());
      this.messagesEl.querySelectorAll('.agent-tracker').forEach(t => t.remove());
      this._pushAssistantMessage(
        "Chat cleared! How can I help you?",
        this.quickReplies
      );
    });

    // Send button
    this.sendBtnEl?.addEventListener('click', () => this._onSend());

    // Enter key (Shift+Enter = newline)
    this.inputEl?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._onSend();
      }
    });

    // Auto-resize textarea
    this.inputEl?.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 100) + 'px';
    });
  }

  _onSend() {
    const text = this.inputEl?.value;
    if (text && text.trim()) this.sendMessage(text);
  }

  // ── Private: Message Rendering ─────────────────────────────────────────────

  _pushUserMessage(text) {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const el = document.createElement('div');
    el.className = 'chat-message chat-message--user';
    el.innerHTML = `
      <div class="chat-message__avatar chat-message__avatar--user">You</div>
      <div class="chat-message__content">
        <div class="chat-message__bubble">${this._escapeHtml(text)}</div>
        <div class="chat-message__time">${time}</div>
      </div>
    `;
    this.messagesEl.insertBefore(el, this.typingEl);
    this._scrollToBottom();
    this._saveToHistory({ role: 'user', text, time });
  }

  _pushAssistantMessage(text, quickReplies = []) {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const el = document.createElement('div');
    el.className = 'chat-message chat-message--assistant';
    el.innerHTML = `
      <div class="chat-message__avatar">🤖</div>
      <div class="chat-message__content">
        <div class="chat-message__bubble">${this._formatMarkdown(text)}</div>
        <div class="chat-message__time">${time}</div>
      </div>
    `;
    this.messagesEl.insertBefore(el, this.typingEl);
    this._scrollToBottom();
    this._saveToHistory({ role: 'assistant', text, time });

    if (quickReplies && quickReplies.length) {
      this._setQuickReplies(quickReplies);
    }

    // Show unread badge if panel is closed
    if (!this.isOpen) {
      const badge = document.querySelector('.chat-unread-badge');
      if (badge) badge.classList.add('visible');
    }
  }

  _handleChatResponse(response) {
    const reply = response?.reply || response?.message || 'I received your message!';
    const qr    = response?.quick_replies || [];
    this._pushAssistantMessage(reply, qr);

    if (response?.action) {
      setTimeout(() => this._handleAction(response.action, response.action_data), 800);
    }
  }

  _handleAgentResponse(response) {
    const steps       = response?.steps || [];
    const finalMsg    = response?.final_message || 'Task completed!';
    const qr          = response?.quick_replies || [];

    this._renderAgentSteps(steps);

    setTimeout(() => {
      this._pushAssistantMessage(finalMsg, qr);
      if (response?.action) {
        setTimeout(() => this._handleAction(response.action, response.action_data), 800);
      }
    }, 600);
  }

  _renderAgentSteps(steps) {
    const tracker = document.createElement('div');
    tracker.className = 'agent-tracker';

    const defaultSteps = steps.length > 0 ? steps : [
      { label: 'Understanding request', status: 'done' },
      { label: 'Searching available options', status: 'done' },
      { label: 'Processing results', status: 'done' },
    ];

    const stepsHtml = defaultSteps.map(step => {
      const icons = { pending: '⏳', running: '🔄', done: '✅', failed: '❌' };
      const icon  = icons[step.status] || '⏳';
      return `
        <div class="agent-step agent-step--${step.status || 'done'}">
          <div class="agent-step__icon">${icon}</div>
          <div>
            <div class="agent-step__label">${this._escapeHtml(step.label || '')}</div>
            ${step.description ? `<div class="agent-step__desc">${this._escapeHtml(step.description)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    tracker.innerHTML = `
      <div class="agent-tracker__header" id="tracker-header">
        <div class="agent-tracker__title">🤖 Agent Steps</div>
        <div class="agent-tracker__toggle">▼</div>
      </div>
      <div class="agent-tracker__steps" id="tracker-steps">
        ${stepsHtml}
      </div>
    `;

    // Toggle collapse
    tracker.querySelector('#tracker-header').addEventListener('click', () => {
      const hdr   = tracker.querySelector('#tracker-header');
      const steps = tracker.querySelector('#tracker-steps');
      const isCollapsed = hdr.classList.toggle('collapsed');
      steps.style.display = isCollapsed ? 'none' : '';
    });

    this.messagesEl.insertBefore(tracker, this.typingEl);
    this._scrollToBottom();
  }

  // ── Private: Actions ─────────────────────────────────────────────────────────

  _handleAction(action, data = {}) {
    switch (action) {
      case 'show_hotels':
        this._pushAssistantMessage(
          `<a class="chat-action-link" href="hotels.html${data.city ? '?city=' + encodeURIComponent(data.city) : ''}">→ Click here to see hotels${data.city ? ' in ' + data.city : ''}</a>`
        );
        setTimeout(() => {
          window.location.href = `hotels.html${data.city ? '?city=' + encodeURIComponent(data.city) : ''}`;
        }, 1500);
        break;

      case 'show_restaurants':
        this._pushAssistantMessage(
          `<a class="chat-action-link" href="restaurants.html">→ Click here to see restaurants</a>`
        );
        setTimeout(() => { window.location.href = 'restaurants.html'; }, 1500);
        break;

      case 'show_bookings':
        this._pushAssistantMessage(
          `<a class="chat-action-link" href="bookings.html">→ Click here to view your bookings</a>`
        );
        setTimeout(() => { window.location.href = 'bookings.html'; }, 1500);
        break;

      case 'request_location':
        this._requestGeolocation();
        break;

      case 'open_search':
        const searchInput = document.querySelector('.search-bar__input, #search-city');
        if (searchInput) {
          this.close();
          searchInput.focus();
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;

      default:
        break;
    }
  }

  _requestGeolocation() {
    if (!navigator.geolocation) {
      this._pushAssistantMessage("Sorry, your browser doesn't support location access.");
      return;
    }

    this._pushAssistantMessage("📍 Accessing your location…");
    this.showTyping();

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const result = await API.getNearbyRestaurants(lat, lng);
          this.hideTyping();
          const count = result?.restaurants?.length || 0;
          this._pushAssistantMessage(
            `Found ${count} restaurants near you! <a class="chat-action-link" href="restaurants.html?lat=${lat}&lng=${lng}">View all →</a>`,
            ['Show me the list', '🏨 Find Hotels Instead']
          );
        } catch {
          this.hideTyping();
          this._pushAssistantMessage("Couldn't load nearby restaurants. Please try searching manually.", this.quickReplies);
        }
      },
      () => {
        this.hideTyping();
        this._pushAssistantMessage("Location access was denied. You can search by city name instead!", this.quickReplies);
      }
    );
  }

  // ── Private: Quick Replies ───────────────────────────────────────────────────

  _setDefaultQuickReplies() {
    this._setQuickReplies(this.quickReplies);
  }

  _setQuickReplies(replies) {
    if (!this.quickRepliesEl) return;
    this.quickRepliesEl.innerHTML = replies.map(r =>
      `<button class="quick-reply-chip" data-text="${this._escapeAttr(r)}">${r}</button>`
    ).join('');

    this.quickRepliesEl.querySelectorAll('.quick-reply-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.sendMessage(chip.dataset.text);
      });
    });
  }

  // ── Private: Session Storage ─────────────────────────────────────────────────

  _generateSessionId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  _loadHistory() {
    try {
      return JSON.parse(sessionStorage.getItem('stayease_chat') || '[]');
    } catch {
      return [];
    }
  }

  _saveToHistory(entry) {
    this.history.push(entry);
    // Keep max 50 messages
    if (this.history.length > 50) this.history = this.history.slice(-50);
    try {
      sessionStorage.setItem('stayease_chat', JSON.stringify(this.history));
    } catch { /* quota exceeded */ }
  }

  _clearHistory() {
    this.history = [];
    sessionStorage.removeItem('stayease_chat');
  }

  _renderHistory() {
    // Re-render saved messages (skip greet for returning sessions)
    this.history.forEach(entry => {
      const time = entry.time || '';
      const el = document.createElement('div');
      el.className = `chat-message chat-message--${entry.role}`;
      if (entry.role === 'user') {
        el.innerHTML = `
          <div class="chat-message__avatar chat-message__avatar--user">You</div>
          <div class="chat-message__content">
            <div class="chat-message__bubble">${this._escapeHtml(entry.text)}</div>
            <div class="chat-message__time">${time}</div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="chat-message__avatar">🤖</div>
          <div class="chat-message__content">
            <div class="chat-message__bubble">${this._formatMarkdown(entry.text)}</div>
            <div class="chat-message__time">${time}</div>
          </div>
        `;
      }
      this.messagesEl.insertBefore(el, this.typingEl);
    });
  }

  // ── Private: Helpers ─────────────────────────────────────────────────────────

  _buildContext() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const user = window.getCurrentUser ? getCurrentUser() : null;
    return {
      page,
      user_id: user?.id || null,
      user_name: user?.name || null,
    };
  }

  _scrollToBottom() {
    if (!this.messagesEl) return;
    setTimeout(() => {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }, 50);
  }

  _clearInput() {
    if (!this.inputEl) return;
    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  _formatMarkdown(text) {
    // Allow basic safe HTML (anchor tags from action links pass through)
    // For plain text, convert **bold**, *italic*, \n to <br>
    return String(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
}

// ── Initialise ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('chat-toggle-btn')) {
    window.chatWidget = new ChatWidget();
  }
});
