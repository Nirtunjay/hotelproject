# Codebase Map — Quality & Concerns

**Project:** StayEase  
**Mapped:** 2026-11-18

---

## Code Quality Observations

### Strengths
- Clean application-factory pattern in `app.py`
- Blueprint-per-domain structure is well-organised
- Services are pure Python — easy to test in isolation
- Good docstrings and inline comments throughout
- Mock data strategy lets the app run without any infrastructure

### Known Shortcuts / Technical Debt

| Location | Issue | Risk |
|----------|-------|------|
| `ai_service._SESSIONS` | In-memory session store | Lost on restart; not horizontally scalable |
| `agent_service` | Duplicates city-alias extractors from `ai_service` | Drift risk; refactor to shared `utils/nlp.py` |
| `config.py` | Hardcoded relative dates in `ai_service` (`"today": "2026-10-30"`) | Stale dates will give wrong results |
| `models/booking.py` | No schema validation before MongoDB insert | Malformed data can enter DB |
| All routes | No auth middleware — any `user_id` string is accepted | Bookings are unprotected |
| `app.py` CORS | `origins="*"` | Acceptable for dev; must restrict before prod |
| `config.py SECRET_KEY` | Default is public string | Critical prod blocker |
| All routes | No rate limiting | DoS-susceptible |
| Frontend | `api.js` hardcodes `http://localhost:5000` | Won't work in deployed environments without env injection |

---

## Missing Test Coverage

- No test files exist anywhere in the project.
- `hotel_service.search_hotels` and `restaurant_service.search_restaurants` are the highest-value units to test (pure functions, complex filter logic).
- `ai_service.process_message` multi-turn flow has no regression tests.

---

## Missing Features (from README)

| Feature | Status |
|---------|--------|
| Real LLM integration (Gemini/OpenAI) | 🔲 Needs `GEMINI_API_KEY` or `OPENAI_API_KEY` wired into `ai_service` |
| Real hotel APIs (RapidAPI) | 🔲 Needs `RAPIDAPI_KEY` wired into hotel routes |
| Pagination on search results | 🔲 All results returned at once |
| Input validation on booking endpoints | 🔲 Minimal validation |
| Password hashing in auth | ❓ Needs verification in `models/user.py` |
