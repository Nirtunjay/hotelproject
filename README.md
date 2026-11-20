# 🏨 StayEase — Smart Hotel Reservation System

A full-stack hotel and restaurant reservation platform built with **React**, **Node.js/Express**, and **MongoDB Atlas**.

> **No AI chatbot. No payment gateway.** Payment is settled directly at the property upon check-in.

---

## Project Structure

```
hotelproject/
├── backend/              ← Node.js + Express REST API
│   ├── src/
│   │   ├── controllers/  ← Route handlers (auth, hotels, rooms, …)
│   │   ├── middleware/   ← auth, adminOnly, validate, errorHandler
│   │   ├── models/       ← Mongoose schemas (User, Hotel, Room, …)
│   │   ├── routes/       ← Express routers
│   │   └── utils/        ← apiResponse, generateRef, slugify
│   ├── scripts/
│   │   ├── seed.js       ← Seeds hotels, rooms, restaurants, admin user
│   │   └── verify-auth.js ← Phase 4 auth integration test
│   └── server.js
├── frontend/             ← React 19 + Vite + Tailwind CSS v4
│   └── src/
│       ├── api/          ← Axios API client + per-domain modules
│       ├── components/   ← Reusable UI kit + Layout shells
│       ├── context/      ← AuthContext (JWT + localStorage)
│       ├── pages/        ← Public, auth, dashboard, admin pages
│       └── routes/       ← AppRoutes + ProtectedRoute/AdminRoute guards
├── backend_flask_archive/   ← Archived original Flask prototype
└── frontend_html_archive/   ← Archived original HTML/CSS prototype
```

---

## Tech Stack

| Layer      | Technology                                                   |
|------------|--------------------------------------------------------------|
| Frontend   | React 19, Vite 8, Tailwind CSS v4, React Router v7           |
| Backend    | Node.js 24, Express 4, Mongoose 8                            |
| Auth       | JWT (access 15 min + refresh 7 d), bcryptjs (salt 12)        |
| Database   | MongoDB Atlas (7 collections)                                |
| Deployment | Vercel (frontend) + Render (backend) — after dev complete     |

---

## Local Development Setup

### Prerequisites

- Node.js ≥ 18
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (free tier works)

### 1. Backend

```bash
cd backend

# Copy env template and fill in your values
copy .env.example .env
# Required: MONGO_URI, JWT_SECRET, REFRESH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# Install dependencies
npm install

# Seed the database (creates 18 hotels, rooms, 18 restaurants, admin account)
npm run seed

# Start the dev server (auto-restarts on save)
npm run dev
```

API runs at **http://localhost:5000**

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (proxies /api → localhost:5000)
npm run dev
```

App runs at **http://localhost:5173**

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint              | Auth? | Description                                  |
|--------|-----------------------|-------|----------------------------------------------|
| POST   | `/register`           | —     | Create account (name, email, password ≥ 8)   |
| POST   | `/login`              | —     | Returns `token`, `refreshToken`, `user`       |
| POST   | `/refresh`            | —     | Exchange refresh token for new access token   |
| GET    | `/me`                 | ✅    | Get current user profile                     |
| PUT    | `/me`                 | ✅    | Update name / phone                          |
| PUT    | `/me/password`        | ✅    | Change password                              |
| POST   | `/forgot-password`    | —     | Stub — no email sent; always returns 200      |
| POST   | `/reset-password`     | —     | Stub — returns 501 (email not configured)    |

### Hotels — `/api/hotels`

| Method | Endpoint                                       | Auth?  | Description                              |
|--------|------------------------------------------------|--------|------------------------------------------|
| GET    | `/`                                            | —      | List hotels (filter: city, minStars, maxPrice, amenities) |
| GET    | `/popular`                                     | —      | Top 6 hotels by rating                   |
| GET    | `/:id`                                         | —      | Hotel detail + rooms (optionally with availability) |
| GET    | `/:hotelId/rooms`                              | —      | Rooms for a hotel (+ availability if dates given) |
| GET    | `/:hotelId/rooms/:roomId/availability`         | —      | Real-time availability for a room+date range |
| POST   | `/`                                            | 🔐 Admin | Create hotel                           |
| PUT    | `/:id`                                         | 🔐 Admin | Update hotel                           |
| DELETE | `/:id`                                         | 🔐 Admin | Deactivate hotel                       |
| POST   | `/:hotelId/rooms`                              | 🔐 Admin | Add room to hotel                      |
| PUT    | `/:hotelId/rooms/:roomId`                      | 🔐 Admin | Update room                            |

### Health

```
GET /api/health  →  { success: true, data: { status: "ok", version: "1.0.0" } }
```

---

## Booking Model

All bookings use `paymentStatus: "pay_at_property"`. No payment gateway is integrated.
Booking status lifecycle: `confirmed` → `completed` | `cancelled` | `no_show`.

---

## Admin Account

Created via the seed script using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.
Admin accounts have access to all admin dashboard endpoints, guarded by both `auth` + `adminOnly` middleware on every route.

---

## Availability Logic

Room availability is **always computed server-side** using an overlap query:

```js
// Available rooms = totalInventory minus confirmed/completed overlapping bookings
reserved = HotelBooking.countDocuments({
  room, status: { $in: ['confirmed', 'completed'] },
  checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn },
});
available = room.totalInventory - reserved;
```

The frontend is never trusted for availability — every booking creation re-validates server-side.

---

## Cities Covered

Delhi · Mumbai · Jaipur · Bangalore · Goa · Agra · Chennai · Hyderabad

---

## Project Status

| Phase | Description                              | Status      |
|-------|------------------------------------------|-------------|
| 1     | Architecture & planning                   | ✅ Complete |
| 2     | Backend scaffold + DB schemas             | ✅ Complete |
| 3     | Frontend UI system + layout shells        | ✅ Complete |
| 4     | Auth API (register, login, JWT, guards)   | ✅ Complete |
| 5     | Hotel & Room API + availability           | ✅ Complete |
| 6     | Frontend auth pages (login, register)     | 🔜 Next     |
| 7     | Hotel search, detail & booking UI         | 🔜 Planned  |
| 8     | Restaurant listing & reservation          | 🔜 Planned  |
| 9     | User + Admin dashboards                   | 🔜 Planned  |
| 10    | End-to-end testing                        | 🔜 Planned  |
| 11    | Security hardening                        | 🔜 Planned  |
| 12    | Deployment (Vercel + Render)              | 🔜 Planned  |
