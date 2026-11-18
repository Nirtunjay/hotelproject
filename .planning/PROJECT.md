# PROJECT.md — StayEase (Revised)

## Project Identity

**Name:** StayEase — Smart Hotel Reservation System  
**Type:** Full rebuild — existing Flask/Vanilla JS prototype → React + Node.js + MongoDB Atlas  
**Goal:** A production-ready, publicly deployable hotel and restaurant reservation platform for Indian cities. No AI chatbot. No payment gateway. Real database-backed reservation logic.  
**Revised:** 2026-11-18 (master prompt v1)

---

## Target Users

| Role | Access Level |
|------|-------------|
| Guest (unauthenticated) | Browse hotels, restaurants, public search |
| Customer (authenticated) | Book hotels, reserve tables, manage own bookings |
| Admin | Full CRUD over hotels, rooms, restaurants, tables, all reservations, users |

---

## Tech Stack (target — to be built)

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + React Router v6 + Axios |
| Backend | Node.js + Express.js (REST API) |
| Database | MongoDB Atlas + Mongoose ODM |
| Auth | JWT (access token) + bcrypt password hashing |
| Auth: roles | `customer` / `admin` via JWT claim |
| Images | Cloudinary (or royalty-free URLs for seed data) |
| Deployment | Frontend → Vercel; Backend → Render; DB → MongoDB Atlas |
| Secrets | `.env` files, never committed |

---

## Existing Prototype (to preserve as reference)

The current `backend/` (Flask) and `frontend/` (Vanilla JS) directories contain:
- 18 mock hotels + 18 mock restaurants (data to be **migrated** to MongoDB seed scripts)
- Working search + filter logic (to be **reimplemented** in Express)
- In-process AI chat + agentic worker → **removed per master prompt decision §3.1**
- Plaintext password storage → **replaced** with bcrypt

The existing code is **reference material only** — the new project is a full rebuild.

---

## Explicit Non-Goals (master prompt §3)

- ❌ No AI chatbot / AI assistant / autonomous booking agent
- ❌ No payment gateway (not even a placeholder payment form)
- ❌ No fake bookings or fabricated availability
- ❌ No static/prototype-only pages

---

## Constraints

- All reservation logic must be DB-backed (MongoDB Atlas, required)
- Double-booking prevention required for hotels and restaurants
- Mobile-first responsive design required
- Unique booking reference generated for every reservation
- Admin dashboard on separate route, protected by role check
- Cancellation respects status rules (confirmed → cancelled; completed → cannot cancel)

---

## Color & Design System

| Token | Value |
|-------|-------|
| Primary | `#142B45` (Deep Navy Blue) |
| Secondary | `#C6A15B` (Warm Gold) |
| Background | `#F8F9FB` |
| Surface | `#FFFFFF` |
| Text | `#202B38` |
| Muted | `#758195` |

---

## References

- `.planning/REQUIREMENTS.md` — full FR/NFR list
- `.planning/ROADMAP.md` — 12-phase development plan
- `.planning/DATABASE.md` — MongoDB collection schemas
- `.planning/ARCH.md` — target architecture + folder structure
- `.planning/onboarding/ANALYSIS.md` — gap analysis vs existing prototype
