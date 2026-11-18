# REQUIREMENTS.md — StayEase (Full Rebuild)

> Source: Master prompt v1, 2026-11-18.  
> Status column: 🔲 = not built, ✅ = implemented, ⚠️ = partial.

---

## Functional Requirements

### FR-01 Public Hotel Discovery
- FR-01a Search hotels by city, check-in/check-out dates, guest count 🔲
- FR-01b Filter by price range, star rating, amenities 🔲
- FR-01c Sort by price (asc/desc) and rating (desc) 🔲
- FR-01d View hotel detail: description, images, amenities, room categories, pricing, policies 🔲
- FR-01e Popular hotels section on home page 🔲
- FR-01f Pagination or load-more on hotel listing 🔲

### FR-02 Hotel Room Booking
- FR-02a Select room type, dates, guest count, number of rooms 🔲
- FR-02b Real-time availability check (account for existing confirmed reservations) 🔲
- FR-02c Price calculation: nights × rooms × room rate 🔲
- FR-02d Collect guest details (name, email, phone, special requests) 🔲
- FR-02e Generate unique booking reference (e.g. `HTL-2026-XXXX`) 🔲
- FR-02f Store booking in MongoDB with status `confirmed` 🔲
- FR-02g Show booking confirmation page with reference 🔲
- FR-02h Prevent check-in date in the past 🔲
- FR-02i Prevent check-in ≥ check-out 🔲
- FR-02j Prevent double-booking (concurrent reservation guard) 🔲

### FR-03 Public Restaurant Discovery
- FR-03a Search restaurants by city, cuisine, date, time, party size 🔲
- FR-03b Filter and sort 🔲
- FR-03c View restaurant detail: description, images, cuisine, hours, tables, policies 🔲
- FR-03d Pagination on restaurant listing 🔲

### FR-04 Restaurant Table Reservation
- FR-04a Select date, available time slot, party size, seating preference 🔲
- FR-04b Availability check against existing reservations and restaurant hours 🔲
- FR-04c Do not allow reservations outside operating hours 🔲
- FR-04d Do not allow overbooking (table capacity check) 🔲
- FR-04e Collect customer details 🔲
- FR-04f Generate unique reservation reference (e.g. `RST-2026-XXXX`) 🔲
- FR-04g Store reservation in MongoDB 🔲
- FR-04h Show reservation confirmation 🔲

### FR-05 Authentication
- FR-05a User registration (name, email, password, phone) 🔲
- FR-05b Email uniqueness validation 🔲
- FR-05c Password hashing (bcrypt, min 10 rounds) 🔲
- FR-05d User login → JWT access token 🔲
- FR-05e Forgot password → password reset email flow 🔲
- FR-05f Password reset via token 🔲
- FR-05g Logout (client-side token discard) 🔲
- FR-05h Role-based access: `customer` | `admin` 🔲

### FR-06 User Dashboard (authenticated)
- FR-06a Dashboard overview (upcoming bookings summary) 🔲
- FR-06b View / edit profile (name, email, phone) 🔲
- FR-06c Change password 🔲
- FR-06d My Hotel Bookings list (status, dates, reference, hotel name) 🔲
- FR-06e My Restaurant Reservations list 🔲
- FR-06f View booking/reservation detail 🔲
- FR-06g Cancel booking (only own, only if status = confirmed) 🔲
- FR-06h Booking history (past + cancelled) 🔲
- FR-06i Users can only access their own records 🔲

### FR-07 Admin Dashboard (admin role only)
- FR-07a Overview: counts of users, hotels, restaurants, hotel bookings, restaurant reservations, recent bookings 🔲
- FR-07b Hotel CRUD: add, edit, delete/deactivate, manage images, manage amenities 🔲
- FR-07c Room CRUD: add/edit rooms per hotel, set price, capacity, inventory 🔲
- FR-07d Restaurant CRUD: add, edit, delete/deactivate, manage hours, capacity, images 🔲
- FR-07e Table/seating CRUD: add/edit table types per restaurant 🔲
- FR-07f View all hotel reservations (search, filter by status/date/hotel) 🔲
- FR-07g View all restaurant reservations 🔲
- FR-07h Update reservation status (confirm, cancel, complete) 🔲
- FR-07i User management: view users, activate/deactivate accounts 🔲
- FR-07j Admin-only routes protected by role middleware 🔲

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | All reservation logic DB-backed — no mock/in-memory data in production |
| NFR-02 | Mobile-first responsive design (phones, tablets, laptops, desktops) |
| NFR-03 | No payment gateway — booking status uses `payment_pending` or `pay_at_property` |
| NFR-04 | bcrypt with ≥10 rounds for all passwords |
| NFR-05 | JWT tokens: short-lived access token (15 min) + refresh token (7 days) |
| NFR-06 | CORS restricted to known frontend origins in production |
| NFR-07 | Rate limiting on auth and AI endpoints |
| NFR-08 | Server-side validation on all API inputs (never trust frontend only) |
| NFR-09 | Environment variables for all secrets — never committed |
| NFR-10 | Unique booking reference for every reservation |
| NFR-11 | Seed data clearly separated from production data |
| NFR-12 | All images: royalty-free or Cloudinary-hosted |
| NFR-13 | ESLint configured; no console errors in production build |
| NFR-14 | API responses follow consistent envelope: `{success, data, error, message}` |
| NFR-15 | HTTP security headers (Helmet.js) |
| NFR-16 | Input sanitization against NoSQL injection |
