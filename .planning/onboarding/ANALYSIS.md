# Gap Analysis — Existing Prototype vs Master Prompt

**Date:** 2026-11-18

---

## Summary

The existing codebase is a **Flask + Vanilla JS prototype**. The master prompt requires a **React + Node.js + MongoDB Atlas production application**. This is a **full rebuild**, not an incremental migration. The existing code is useful as:

1. **Seed data source** — 18 hotels and 18 restaurants with real Indian city data, pricing, amenities → will be migrated to MongoDB via seed script.
2. **Business logic reference** — search/filter algorithms, availability logic → will be re-implemented in Node.js.
3. **A reminder of what NOT to build** — the AI chatbot and agentic worker are explicitly excluded by the master prompt.

---

## Existing Features vs Requirements

| Existing Feature | Master Prompt Requirement | Action |
|-----------------|--------------------------|--------|
| Flask REST API | Node.js + Express REST API | **Replace** |
| Vanilla JS frontend | React 18 + Vite + Tailwind | **Replace** |
| In-memory hotel data | MongoDB Atlas hotel collection | **Migrate data to seed script** |
| In-memory restaurant data | MongoDB Atlas restaurant collection | **Migrate data to seed script** |
| AI chatbot (`ai_service.py`) | ❌ Explicitly excluded | **Delete** |
| Agentic booking worker (`agent_service.py`) | ❌ Explicitly excluded | **Delete** |
| Plaintext password storage | bcrypt with ≥10 rounds | **Replace** |
| No auth middleware on booking routes | JWT middleware on all protected routes | **Build new** |
| No admin dashboard | Full admin CRUD dashboard | **Build new** |
| No user dashboard | Full user dashboard | **Build new** |
| No forgot password / reset | Full forgot/reset password flow | **Build new** |
| No availability concurrency guard | MongoDB transaction / atomic update | **Build new** |
| Mock-data-only mode | All data must be DB-backed | **Remove fallback** |
| No room inventory model | `rooms` collection with `totalInventory` | **Build new** |
| No restaurant table model | `restaurant_tables` collection | **Build new** |
| No unique booking reference | Auto-generated ref (`HTL-2026-XXXX`) | **Build new** |
| `origins="*"` CORS | Restricted to production frontend origin | **Fix** |
| `DEBUG=True` by default | `NODE_ENV=production` controlled | **Fix** |

---

## What to Keep From Existing Code

| Asset | How It's Used |
|-------|--------------|
| `hotel_service.py` HOTELS list | Source for `scripts/seed.js` hotel seed data |
| `restaurant_service.py` RESTAURANTS list | Source for `scripts/seed.js` restaurant seed data |
| Hotel fields (name, city, address, amenities, coordinates, star_rating, images) | Directly map to Hotel Mongoose model |
| Restaurant fields (name, city, cuisine, opening_hours, coordinates, images) | Directly map to Restaurant Mongoose model |
| Room types (type, price, capacity) per hotel | Directly map to Room Mongoose model |
| `README.md` project name + cities covered | Keep + update |
| `.planning/` directory | Retained + updated |

---

## Critical Gaps to Close in Phase 2

1. **No `rooms` collection** — existing prototype treats room types as embedded arrays in hotels. The rebuild extracts them to a separate `rooms` collection for proper inventory tracking.
2. **No `restaurant_tables` collection** — same issue. The rebuild extracts table types with quantity.
3. **No concurrency-safe reservation** — the existing code has no double-booking prevention. The rebuild uses `countDocuments + totalInventory` check inside a MongoDB transaction (or optimistic update with retry).
4. **No token-based auth** — existing auth stores nothing; session state is not maintained. The rebuild uses JWT (access + refresh tokens).
5. **No role model** — existing code has no admin vs customer distinction.

---

## Decisions Required from Owner Before Coding Starts

See main onboarding summary — these are the questions that need answers before Phase 2 begins.
