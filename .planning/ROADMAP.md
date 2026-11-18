# ROADMAP.md — StayEase (Full Rebuild)

> 12-phase plan matching the master prompt §16.  
> Each phase ends with a stop-and-review gate — no proceeding without approval.

---

## Milestone 1 — Core Platform

### Phase 1 · Repository Inspection & Architecture Decision ✅
**Goal:** Understand existing code, produce full architecture plan, and get approval.  
**Deliverables:**
- Gap analysis of existing Flask/Vanilla JS prototype vs master prompt
- Target tech stack decision (React + Node.js + MongoDB Atlas)
- Folder structure, DB schemas, API map
- List of what to preserve (mock data as seed source) and what to replace
- Questions requiring owner decisions before coding starts

**Gate:** Owner approval of architecture + tech stack before any code is written.

---

### Phase 2 · Final Architecture & Database Setup
**Goal:** Initialize project structure, configure tools, create Mongoose models.  
**Deliverables:**
- `backend/` initialized: Node.js + Express + Mongoose
- `frontend/` initialized: React + Vite + Tailwind CSS
- All 7 Mongoose models with validation
- MongoDB Atlas cluster connected
- `.env.example` for both frontend and backend
- ESLint + Prettier configured
- Dev scripts (`npm run dev`) working for both sides

**Gate:** Both dev servers start cleanly; `GET /api/health` returns 200.

---

### Phase 3 · UI/UX Design System & Frontend Foundation
**Goal:** Establish the design system and build all reusable UI components.  
**Deliverables:**
- Tailwind config with brand colors (Primary `#142B45`, Secondary `#C6A15B`, etc.)
- Reusable components: Button, Card, Badge, Input, Select, Modal, Spinner, Alert
- Layout components: Navbar, Footer, Sidebar (dashboard)
- Responsive navigation with mobile hamburger menu
- AuthContext + ProtectedRoute + AdminRoute
- Route skeleton (all pages render, even if empty)

**Gate:** Visual design review — all components look on-brand; mobile nav works.

---

### Phase 4 · Backend API — Auth & Core Middleware
**Goal:** Complete, working authentication API.  
**Deliverables:**
- `POST /api/auth/register` — bcrypt hash, email uniqueness
- `POST /api/auth/login` — JWT access + refresh tokens
- `GET /api/auth/me`, `PUT /api/auth/me`, `PUT /api/auth/me/password`
- `POST /api/auth/forgot-password` + `POST /api/auth/reset-password/:token`
- Helmet, CORS, rate-limiting, Morgan logging
- `authMiddleware` + `adminOnly` middleware
- Centralized error handler returning `{success, error, message}`
- Input validation with express-validator on all auth routes

**Gate:** All auth endpoints pass manual + automated tests; JWT flow works end-to-end.

---

### Phase 5 · MongoDB Integration — Hotels & Rooms
**Goal:** Complete hotel + room API.  
**Deliverables:**
- Hotel CRUD endpoints (admin: create/update/deactivate; public: list/detail/popular)
- Room CRUD endpoints (admin: add/edit/deactivate; public: list + availability)
- Search: filter by city, star rating, price range, amenities; sort by price/rating; pagination
- Room availability calculation using existing bookings
- Seed script: 18 hotels + rooms (from existing `hotel_service.py` data)

**Gate:** `GET /api/hotels?city=Delhi&guests=2` returns correct filtered results from Atlas.

---

### Phase 6 · Authentication — Frontend Integration
**Goal:** Auth pages wired to backend; JWT stored and sent on all requests.  
**Deliverables:**
- Register page, Login page (with validation)
- Forgot password, Reset password pages
- Axios interceptor: attach `Authorization: Bearer` on every request
- AuthContext: stores user + token, persists via localStorage
- ProtectedRoute redirects unauthenticated users to login
- AdminRoute redirects non-admins to dashboard home

**Gate:** Full register → login → access protected page → logout cycle works.

---

### Phase 7 · Hotel Reservation Functionality
**Goal:** End-to-end hotel booking flow.  
**Deliverables:**
- Home page search form (city, dates, guests) → redirects to hotel listing
- Hotel listing page with search/filter/sort/pagination
- Hotel detail page (images, amenities, room types, pricing, availability)
- Room booking page (room select, dates, guests, rooms, price summary, guest form)
- Booking confirmation page with booking reference
- Backend: `POST /api/bookings/hotel` with full validation + concurrency-safe availability check
- Unique booking reference generation
- Booking stored in MongoDB with status `confirmed`, paymentStatus `pay_at_property`

**Gate:** Create a booking, check MongoDB; creating duplicate overlapping booking fails with clear error.

---

### Phase 8 · Restaurant Reservation Functionality
**Goal:** End-to-end restaurant reservation flow.  
**Deliverables:**
- Restaurant listing page with search/filter/sort/pagination
- Restaurant detail page (images, cuisine, hours, tables, policies)
- Restaurant reservation page (date, time slot, guests, seating preference, guest form)
- Available time-slot endpoint (`GET /api/restaurants/:id/timeslots?date=...&guests=...`)
- Backend: `POST /api/reservations/restaurant` with hours + capacity validation
- Unique reservation reference
- Seed script: 18 restaurants + table types

**Gate:** Reserve a table; block an overbooked slot; test outside-hours rejection.

---

### Phase 9 · User Dashboard & Admin Dashboard
**Goal:** Complete authenticated user and admin experiences.  
**Deliverables:**

**User dashboard:**
- Dashboard home (upcoming bookings summary)
- My Hotel Bookings (list + detail + cancel)
- My Restaurant Reservations (list + detail + cancel)
- Profile edit + password change

**Admin dashboard:**
- Overview (counts + recent bookings)
- Hotel management (CRUD)
- Room management (CRUD per hotel)
- Restaurant management (CRUD)
- All hotel bookings (search, filter, status update)
- All restaurant reservations (search, filter, status update)
- User management (list, activate/deactivate)

**Gate:** Admin can add a hotel; customer can book it; admin can see and update the booking.

---

### Phase 10 · Testing & Bug Fixing
**Goal:** All major flows tested; known bugs fixed before security review.  
**Deliverables:**
- Manual test runs of all user + admin workflows (documented)
- Duplicate booking test: second overlapping request must be rejected
- Invalid date test: past check-in must be rejected
- Unauthorized access test: customer cannot reach admin routes
- Mobile responsiveness check on real device or DevTools
- API error handling: DB offline, invalid JSON, missing fields

**Gate:** All test cases pass; zero critical bugs remaining.

---

### Phase 11 · Security Review & Optimization
**Goal:** Harden before public deployment.  
**Deliverables:**
- Helmet.js HTTP security headers verified
- CORS restricted to Vercel frontend origin
- Rate limiting on auth (`/api/auth`) and reservation endpoints
- Input sanitization (express-mongo-sanitize)
- Password never returned in any API response
- JWT secret strength verified (≥32 chars random)
- `.env` files in `.gitignore`; audit for committed secrets
- Performance: indexes verified; N+1 query check on listing endpoints

**Gate:** Security checklist signed off; no secrets in git history.

---

### Phase 12 · Production Deployment
**Goal:** App live and publicly accessible.  
**Deliverables:**
- MongoDB Atlas production cluster configured
- Backend deployed to Render; env vars configured in Render dashboard
- Frontend deployed to Vercel; `VITE_API_URL` set to Render URL
- CORS updated to Vercel domain
- Production smoke tests (register, login, search, book, view dashboard)
- README.md updated with live URLs, local dev instructions, seed instructions
- `.env.example` files complete and accurate

**Gate:** App accessible at public URL; full booking cycle works in production.

---

## Backlog (post-MVP)

- Email booking confirmations (SendGrid/Resend)
- Review and rating system
- Real-time availability updates (WebSocket / SSE)
- Payment gateway integration (Stripe / Razorpay)
- Cloudinary image upload in admin dashboard
- Pagination on admin tables
- Multi-language support
- Analytics dashboard
