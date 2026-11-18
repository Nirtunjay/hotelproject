# Codebase Map — Architecture

**Project:** StayEase  
**Mapped:** 2026-11-18

---

## High-Level Architecture

```
Browser (Vanilla JS)
        │  fetch to localhost:5000
        ▼
  Flask App (app.py)
  ┌─────────────────────────────────────────────────┐
  │  Blueprints                                     │
  │  ├── hotels_bp      /api/hotels/*               │
  │  ├── restaurants_bp /api/restaurants/*          │
  │  ├── bookings_bp    /api/bookings/*             │
  │  ├── ai_bp          /api/ai/chat + /api/ai/agent│
  │  └── auth_bp        /api/auth/*                 │
  └─────────┬───────────────────────────────────────┘
            │
     Services Layer (pure Python)
     ├── hotel_service.py       ← in-memory data + search
     ├── restaurant_service.py  ← in-memory data + search
     ├── booking_service.py     ← orchestrates model calls
     ├── ai_service.py          ← intent/NLP engine, session store
     └── agent_service.py       ← AgentWorker (plan executor)
            │
     Models Layer
     ├── booking.py  ← MongoDB CRUD (bookings collection)
     └── user.py     ← MongoDB CRUD (users collection)
            │
     MongoDB (optional)
     └── hoteldb  ← bookings, users collections
```

---

## Request Flows

### Hotel Search (read path — no DB)
```
hotels.html → api.js → GET /api/hotels/search?city=Delhi
  → routes/hotels.py
  → hotel_service.search_hotels()   ← filters in-memory HOTELS list
  → JSON response
```

### Hotel Booking (write path — requires MongoDB)
```
hotels.html → api.js → POST /api/bookings/hotel
  → routes/bookings.py
  → booking_service.create_hotel_booking()
  → models/booking.create_booking()
  → MongoDB insert
  → JSON response with booking_id
```

### AI Chat
```
chat.js → POST /api/ai/chat {message, session_id}
  → routes/ai_assistant.py
  → ai_service.process_message()
    ├── _handle_continuation()   ← multi-turn state from _SESSIONS dict
    ├── _detect_intent()         ← keyword matching
    └── handler → hotel_service / restaurant_service (for search results)
  → JSON {message, action, data, quick_replies}
```

### Agentic Task
```
POST /api/ai/agent {instruction, context}
  → agent_service.AgentWorker.execute()
  → 7-step plan (understand → search → check availability → present options
                 → await selection → confirm → execute)
  → returns {plan, result, status}  ← status usually "needs_input"
```

---

## Layering Rules (observed)

1. **Routes** only validate HTTP input and delegate to services; no business logic.
2. **Services** contain all domain logic; they may call each other (ai_service calls hotel_service).
3. **Models** own MongoDB access; services call models.
4. **agent_service** duplicates entity-extraction helpers from ai_service (noted as `shortcut: circular import avoidance`).

---

## Concurrency & State Notes

- `ai_service._SESSIONS` is a **module-level dict** — session state is per-process, not persisted. Restarting Flask loses all conversation state.
- Booking persistence requires MongoDB; without it, `create_booking()` raises and the route returns 500.
- No task queue, no async workers. All requests are synchronous Flask.

---

## Security Notes

- `SECRET_KEY` defaults to `dev_secret_key_change_in_production` — **must rotate before any public deployment**.
- CORS is `origins="*"` — appropriate for dev, not prod.
- No rate limiting on any endpoint.
- Auth routes exist (`/api/auth/register`, `/api/auth/login`) but no JWT middleware guards other routes; booking endpoints accept any `user_id` string.
