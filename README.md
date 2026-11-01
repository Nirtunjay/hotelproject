# 🏨 StayEase — Smart Hotel Reservation System

An AI-powered hotel and restaurant reservation platform with a conversational AI assistant and agentic booking worker.

---

## Project Structure

```
hotelproject/
├── backend/          ← Python Flask API + AI engine
└── frontend/         ← Plain HTML/CSS/JavaScript
```

---

## How to Run

### 1. Start the Backend

```bash
cd backend

# Install dependencies (one-time)
pip install -r requirements.txt

# Copy env template
copy .env.example .env

# Run the server
python app.py
```

The API starts at **http://localhost:5000**

> **MongoDB is optional.** The app serves all hotel/restaurant data from memory.
> Bookings and user accounts need MongoDB. Install from https://www.mongodb.com/try/download/community and run `mongod`.

### 2. Open the Frontend

Open any of these files directly in your browser — no web server needed:

| File | Page |
|------|------|
| `frontend/index.html` | Landing page |
| `frontend/hotels.html` | Hotel search & booking |
| `frontend/restaurants.html` | Restaurant search & table booking |
| `frontend/bookings.html` | My reservations |

> Make sure the backend is running first so data loads correctly.

---

## Features

| Feature | Status |
|---------|--------|
| Hotel search (18 hotels, 8 cities) | ✅ |
| Restaurant search (18 restaurants) | ✅ |
| Hotel detail + room booking | ✅ |
| Restaurant table booking | ✅ |
| AI assistant chat widget | ✅ |
| Agentic AI booking worker | ✅ |
| My bookings / cancel | ✅ |
| Location-based nearby search | ✅ |
| MongoDB persistence | ✅ (optional) |
| Real LLM (Gemini/OpenAI) | 🔲 Add API key to .env |
| Real hotel APIs (RapidAPI) | 🔲 Add RAPIDAPI_KEY to .env |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/hotels/search?city=Delhi&guests=2` | Search hotels |
| GET | `/api/hotels/popular?limit=6` | Popular hotels |
| GET | `/api/hotels/<id>` | Hotel detail |
| POST | `/api/hotels/check-availability` | Check room availability |
| GET | `/api/restaurants/search?city=Mumbai` | Search restaurants |
| GET | `/api/restaurants/nearby?lat=&lng=` | Nearby restaurants |
| POST | `/api/bookings/hotel` | Create hotel booking |
| POST | `/api/bookings/restaurant` | Create restaurant booking |
| GET | `/api/bookings?user_id=` | List user bookings |
| DELETE | `/api/bookings/<id>` | Cancel booking |
| POST | `/api/ai/chat` | AI assistant chat |
| POST | `/api/ai/agent` | Agentic task execution |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |

---

## Cities Covered

Delhi · Mumbai · Jaipur · Bangalore · Goa · Agra · Chennai · Hyderabad

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JavaScript |
| Backend | Python 3 + Flask |
| Database | MongoDB (PyMongo) |
| AI Engine | Smart mock (LLM-ready) |
| Hotel Data | 18 mock hotels (RapidAPI-ready) |
| Restaurant Data | 18 mock restaurants |
