# Onboarding Summary — StayEase

**Onboarded:** 2026-11-18  
**Command:** `/gsd-onboard`  
**State before:** No `.planning/` directory existed.

---

## What Was Learned

### Project
**StayEase** is a full-stack hotel & restaurant booking platform for Indian cities. It is a solo/portfolio project, not yet publicly deployed, with all infrastructure optional (runs fully on mock data).

### Architecture in one paragraph
Flask application factory with five route blueprints. Business logic lives in a clean services layer. `hotel_service` and `restaurant_service` hold all data as Python lists in memory — no DB needed for reads. Bookings and users require MongoDB; without it the app degrades gracefully. The AI layer is a keyword/pattern NLP engine (`ai_service`) with a multi-turn session dict and an `AgentWorker` that runs a 7-step planning loop.

### Critical findings
1. **No tests exist** — highest priority gap.
2. **SECRET_KEY and CORS are dev-only** — must fix before any deployment.
3. **In-memory sessions** — AI conversation state resets on every Flask restart.
4. **No auth middleware** — booking endpoints accept any `user_id`; auth routes exist but are not enforced.
5. **Hardcoded relative dates** in both `ai_service` and `agent_service` (e.g. `"today": "2026-10-30"`) are now stale.
6. **Entity-extraction helpers duplicated** between `ai_service` and `agent_service` — refactor opportunity.

---

## Artifacts Created

```
.planning/
├── PROJECT.md          ← Project identity, stack, scope, constraints
├── REQUIREMENTS.md     ← 25 FRs + 7 NFRs with implementation status
├── ROADMAP.md          ← 5-phase milestone plan + backlog
├── STATE.md            ← Current GSD workflow state
├── codebase/
│   ├── TECH.md         ← Tech stack, directory layout, config values, data model
│   ├── ARCH.md         ← Architecture diagram, 4 request flows, layering rules
│   └── CONCERNS.md     ← Tech debt table, missing coverage, missing features
└── onboarding/
    └── SUMMARY.md      ← This file
```

---

## Suggested Next Steps

| Priority | Command | Why |
|----------|---------|-----|
| 🔴 High | `/gsd-plan-phase` → Phase 1 (Tests & Quality) | Zero tests is the biggest risk |
| 🔴 High | `/gsd-plan-phase` → Phase 2 (Auth & Security) | Open booking endpoints |
| 🟡 Medium | `/gsd-discuss-phase` before planning Phase 3 | Real LLM needs design decisions |
| 🟢 Low | `/gsd-plan-phase` → Phase 4 (RapidAPI) | Nice-to-have, needs external key |

**Start here:**
```
/gsd-discuss-phase Phase 1 — Tests & Quality baseline
```
or jump straight to planning:
```
/gsd-plan-phase Phase 1 — Tests & Quality baseline
```

---

## Key File Links

| File | Role |
|------|------|
| `backend/app.py` | Flask entry point |
| `backend/services/ai_service.py` | AI engine — most complex file |
| `backend/services/agent_service.py` | Agentic worker |
| `backend/services/hotel_service.py` | All mock hotel data |
| `backend/models/booking.py` | Booking DB layer |
| `frontend/js/api.js` | Frontend API client (hardcodes localhost:5000) |
