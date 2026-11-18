# ARCH.md — Target Architecture

**Project:** StayEase (Full Rebuild)  
**Updated:** 2026-11-18

---

## High-Level Architecture

```
                    ┌──────────────────────────────────┐
                    │  Browser                         │
                    │  React 18 + Vite + Tailwind CSS  │
                    │  React Router v6 + Axios         │
                    └───────────────┬──────────────────┘
                                    │ HTTPS REST
                    ┌───────────────▼──────────────────┐
                    │  Express.js API Server           │
                    │  Node.js 20+                     │
                    │                                  │
                    │  Middleware stack:               │
                    │  helmet · cors · rate-limit      │
                    │  morgan · express-validator      │
                    │  authMiddleware · roleGuard      │
                    │                                  │
                    │  Routers:                        │
                    │  /api/auth                       │
                    │  /api/hotels                     │
                    │  /api/rooms                      │
                    │  /api/bookings/hotel             │
                    │  /api/restaurants                │
                    │  /api/reservations/restaurant    │
                    │  /api/users (admin + self)       │
                    │  /api/admin                      │
                    └───────────────┬──────────────────┘
                                    │ Mongoose ODM
                    ┌───────────────▼──────────────────┐
                    │  MongoDB Atlas                   │
                    │  7 collections (see DATABASE.md) │
                    └──────────────────────────────────┘
```

---

## Proposed Folder Structure

```
hotelproject/
├── backend/                       ← NEW Node.js/Express server
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              ← Mongoose connect
│   │   │   └── env.js             ← Validated env-var loader
│   │   ├── middleware/
│   │   │   ├── auth.js            ← JWT verify → req.user
│   │   │   ├── adminOnly.js       ← role === "admin" guard
│   │   │   ├── errorHandler.js    ← Centralized error middleware
│   │   │   └── validate.js        ← express-validator wrapper
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Hotel.js
│   │   │   ├── Room.js
│   │   │   ├── HotelBooking.js
│   │   │   ├── Restaurant.js
│   │   │   ├── RestaurantTable.js
│   │   │   └── RestaurantReservation.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── hotel.routes.js
│   │   │   ├── room.routes.js
│   │   │   ├── hotelBooking.routes.js
│   │   │   ├── restaurant.routes.js
│   │   │   ├── restaurantReservation.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── admin.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── hotel.controller.js
│   │   │   ├── room.controller.js
│   │   │   ├── hotelBooking.controller.js
│   │   │   ├── restaurant.controller.js
│   │   │   ├── restaurantReservation.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── admin.controller.js
│   │   ├── services/
│   │   │   ├── availability.service.js  ← Hotel + restaurant availability logic
│   │   │   ├── booking.service.js       ← Booking ref generation + price calc
│   │   │   └── email.service.js         ← Password reset emails (nodemailer)
│   │   ├── utils/
│   │   │   ├── apiResponse.js           ← Standard response envelope
│   │   │   ├── generateRef.js           ← Booking reference generator
│   │   │   └── slugify.js
│   │   └── app.js                       ← Express app factory
│   ├── scripts/
│   │   └── seed.js                      ← Dev-only seed script
│   ├── .env.example
│   ├── package.json
│   └── server.js                        ← Entry point (connects DB, starts server)
│
├── frontend/                       ← NEW React + Vite app
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js           ← Axios instance + interceptors
│   │   │   ├── auth.api.js
│   │   │   ├── hotels.api.js
│   │   │   ├── restaurants.api.js
│   │   │   ├── bookings.api.js
│   │   │   └── admin.api.js
│   │   ├── components/
│   │   │   ├── ui/                ← Button, Card, Badge, Input, Modal, ...
│   │   │   ├── layout/            ← Navbar, Footer, Sidebar
│   │   │   ├── hotels/            ← HotelCard, HotelFilters, RoomCard, ...
│   │   │   └── restaurants/       ← RestaurantCard, TimeSlotPicker, ...
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── HomePage.jsx
│   │   │   │   ├── HotelsPage.jsx
│   │   │   │   ├── HotelDetailPage.jsx
│   │   │   │   ├── BookingPage.jsx
│   │   │   │   ├── BookingConfirmPage.jsx
│   │   │   │   ├── RestaurantsPage.jsx
│   │   │   │   ├── RestaurantDetailPage.jsx
│   │   │   │   └── ReservationPage.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   ├── ForgotPasswordPage.jsx
│   │   │   │   └── ResetPasswordPage.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardHome.jsx
│   │   │   │   ├── ProfilePage.jsx
│   │   │   │   ├── MyHotelBookings.jsx
│   │   │   │   ├── MyRestaurantReservations.jsx
│   │   │   │   └── BookingDetailPage.jsx
│   │   │   └── admin/
│   │   │       ├── AdminOverview.jsx
│   │   │       ├── AdminHotels.jsx
│   │   │       ├── AdminRooms.jsx
│   │   │       ├── AdminRestaurants.jsx
│   │   │       ├── AdminBookings.jsx
│   │   │       └── AdminUsers.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    ← JWT + user state
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useHotels.js
│   │   │   └── useBooking.js
│   │   ├── routes/
│   │   │   ├── ProtectedRoute.jsx ← Requires auth
│   │   │   ├── AdminRoute.jsx     ← Requires admin role
│   │   │   └── AppRoutes.jsx      ← Route definitions
│   │   ├── utils/
│   │   │   ├── formatDate.js
│   │   │   └── priceFormat.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
│
├── .planning/                      ← GSD planning artifacts (this directory)
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── ROADMAP.md
│   ├── DATABASE.md
│   ├── ARCH.md                     ← This file
│   ├── STATE.md
│   └── onboarding/
│       ├── SUMMARY.md
│       └── ANALYSIS.md
│
├── README.md                       ← (to be updated at end)
└── AGENTS.md
```

---

## API Endpoint Map (complete)

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register user |
| POST | `/login` | — | Login → JWT |
| POST | `/forgot-password` | — | Send reset email |
| POST | `/reset-password/:token` | — | Reset with token |
| GET | `/me` | 🔒 | Get own profile |
| PUT | `/me` | 🔒 | Update own profile |
| PUT | `/me/password` | 🔒 | Change password |

### Hotels — `/api/hotels`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | List hotels (search/filter/sort/page) |
| GET | `/:id` | — | Hotel detail |
| GET | `/popular` | — | Popular hotels (home page) |
| POST | `/` | 🔒 Admin | Create hotel |
| PUT | `/:id` | 🔒 Admin | Update hotel |
| DELETE | `/:id` | 🔒 Admin | Deactivate hotel |

### Rooms — `/api/hotels/:hotelId/rooms`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | List rooms for hotel |
| GET | `/:roomId/availability` | — | Check room availability |
| POST | `/` | 🔒 Admin | Add room |
| PUT | `/:roomId` | 🔒 Admin | Update room |
| DELETE | `/:roomId` | 🔒 Admin | Deactivate room |

### Hotel Bookings — `/api/bookings/hotel`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | 🔒 | Create booking |
| GET | `/my` | 🔒 | Own bookings |
| GET | `/:id` | 🔒 | Booking detail (own or admin) |
| PUT | `/:id/cancel` | 🔒 | Cancel own booking |
| GET | `/admin/all` | 🔒 Admin | All bookings |
| PUT | `/admin/:id/status` | 🔒 Admin | Update booking status |

### Restaurants — `/api/restaurants`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | List restaurants |
| GET | `/:id` | — | Restaurant detail |
| GET | `/:id/timeslots` | — | Available time slots for date |
| POST | `/` | 🔒 Admin | Create restaurant |
| PUT | `/:id` | 🔒 Admin | Update |
| DELETE | `/:id` | 🔒 Admin | Deactivate |

### Restaurant Reservations — `/api/reservations/restaurant`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | 🔒 | Create reservation |
| GET | `/my` | 🔒 | Own reservations |
| GET | `/:id` | 🔒 | Detail (own or admin) |
| PUT | `/:id/cancel` | 🔒 | Cancel own reservation |
| GET | `/admin/all` | 🔒 Admin | All reservations |
| PUT | `/admin/:id/status` | 🔒 Admin | Update status |

### Admin — `/api/admin`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/overview` | 🔒 Admin | Dashboard stats |
| GET | `/users` | 🔒 Admin | All users |
| PUT | `/users/:id/status` | 🔒 Admin | Activate/deactivate user |

---

## Auth Flow

```
Register → bcrypt hash → store → return user (no token yet, force login)
Login → bcrypt compare → sign JWT {userId, role, exp:15m} + refreshToken → return
Request → Authorization: Bearer <token> → authMiddleware verifies → req.user
Admin route → adminOnly middleware → role === "admin" check → 403 if not
Refresh → POST /api/auth/refresh → verify refreshToken → new access token
```

---

## Deployment Architecture

| Component | Host | Notes |
|-----------|------|-------|
| Frontend | Vercel | `VITE_API_URL` env var points to Render backend |
| Backend | Render (Node.js) | `PORT`, `MONGO_URI`, `JWT_SECRET`, `REFRESH_SECRET` |
| Database | MongoDB Atlas | IP whitelist Render's static IP or 0.0.0.0/0 |
| Images | Cloudinary | Seed data uses royalty-free URLs; production uses Cloudinary upload |
| Email (reset) | SendGrid (free tier) or Resend | SMTP credentials in env |
