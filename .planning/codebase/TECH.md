# Codebase Map — Tech Stack

**Project:** StayEase — Smart Hotel Reservation System  
**Mapped:** 2026-11-18

---

## Runtime Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Backend | Python 3.14 / Flask | `app.py` application factory |
| CORS | flask-cors | `origins="*"` — wide open (dev) |
| Database | MongoDB via PyMongo | Optional; falls back to mock data |
| Auth | Custom JWT-style via `SECRET_KEY` | `routes/auth.py` |
| AI Engine | Smart mock (rule-based NLP) | `services/ai_service.py` — no real LLM |
| Agent | Agentic booking worker | `services/agent_service.py` |
| Frontend | Vanilla HTML5 + CSS3 + JS | Static files, no bundler |
| Config | python-dotenv | `.env` → `config.py` → `Config` class |

---

## Directory Layout

```
hotelproject/
├── backend/
│   ├── app.py              ← Flask factory, blueprint registration, error handlers
│   ├── config.py           ← Config class (MONGO_URI, SECRET_KEY, PORT, DEBUG)
│   ├── requirements.txt    ← flask, flask-cors, pymongo, python-dotenv, requests
│   ├── .env.example
│   ├── db/
│   │   └── mongo.py        ← get_db(), bookings_col() helpers
│   ├── models/
│   │   ├── booking.py      ← create_booking, get_bookings_by_user, cancel_booking
│   │   └── user.py         ← User model (register/login helpers)
│   ├── routes/
│   │   ├── hotels.py       ← /api/hotels/* endpoints
│   │   ├── restaurants.py  ← /api/restaurants/* endpoints
│   │   ├── bookings.py     ← /api/bookings/* endpoints
│   │   ├── ai_assistant.py ← /api/ai/chat + /api/ai/agent endpoints
│   │   └── auth.py         ← /api/auth/register + /api/auth/login
│   └── services/
│       ├── hotel_service.py       ← 18-hotel in-memory dataset + search/availability
│       ├── restaurant_service.py  ← 18-restaurant in-memory dataset + search
│       ├── booking_service.py     ← Thin orchestration over models/booking.py
│       ├── ai_service.py          ← Intent detection + multi-turn session engine
│       └── agent_service.py       ← AgentWorker class (7-step plan executor)
└── frontend/
    ├── index.html          ← Landing page
    ├── hotels.html         ← Hotel search & detail
    ├── restaurants.html    ← Restaurant search
    ├── bookings.html       ← My reservations
    ├── presentation.html   ← Demo/pitch page
    ├── css/
    │   ├── main.css
    │   ├── components.css
    │   └── chat.css
    └── js/
        ├── api.js          ← Fetch wrapper, BASE_URL constant
        ├── main.js         ← Landing page logic
        ├── hotels.js       ← Hotel search + booking flow
        ├── restaurants.js  ← Restaurant search + booking flow
        ├── bookings.js     ← My bookings view
        └── chat.js         ← Chat widget (connects to /api/ai/chat)
```

---

## Key Config Values (defaults)

| Key | Default | Purpose |
|-----|---------|---------|
| `MONGO_URI` | `mongodb://localhost:27017/` | DB connection |
| `DB_NAME` | `hoteldb` | Database name |
| `SECRET_KEY` | `dev_secret_key_change_in_production` | ⚠️ Must change for prod |
| `DEBUG` | `True` | Flask debug mode |
| `PORT` | `5000` | Server port |
| `RAPIDAPI_KEY` | `""` | Real hotel API (unused in mock mode) |

---

## Data Model — Booking Document (MongoDB)

```
{
  booking_id: UUID str,
  user_id: str,
  booking_type: "hotel" | "restaurant",
  status: "confirmed" | "cancelled" | "pending",
  hotel_id: str | null,
  restaurant_id: str | null,
  checkin / checkout: ISO date str (hotel),
  date / time: ISO date + "HH:MM" (restaurant),
  room_type: str | null,
  guests: int,
  total_price: float | null,
  created_at / updated_at: datetime UTC
}
```

---

## Mock Data Summary

- **18 hotels** across 8 cities: Delhi (3), Mumbai (3), Jaipur (3), Bangalore (2), Goa (2), Agra (1), Chennai (1), Hyderabad (3)
- **Star range:** 2–5 stars; Price range: ₹850–₹2,00,000/night
- **18 restaurants** (defined in `restaurant_service.py`)
- All data lives in-process — no DB reads for search/list endpoints
