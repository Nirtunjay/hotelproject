"""
services/agent_service.py
Agentic AI worker that autonomously executes multi-step booking tasks.
Calls hotel_service / restaurant_service internally and returns a full execution trace.
"""

from __future__ import annotations
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from services.hotel_service import search_hotels, check_availability, get_hotel_by_id
from services.restaurant_service import search_restaurants, check_table_availability, get_restaurant_by_id

# ---------------------------------------------------------------------------
# Step dataclass-style factory
# ---------------------------------------------------------------------------

def _make_step(name: str, description: str) -> dict:
    return {
        "step_id": str(uuid.uuid4())[:8],
        "name": name,
        "description": description,
        "status": "pending",   # pending | running | done | failed
        "output": None,
        "error": None,
        "timestamp": None,
    }


def _run_step(step: dict, fn, *args, **kwargs) -> Any:
    """Execute fn(*args, **kwargs) and update step fields."""
    step["status"] = "running"
    step["timestamp"] = datetime.now(timezone.utc).isoformat()
    try:
        result = fn(*args, **kwargs)
        step["status"] = "done"
        step["output"] = result
        return result
    except Exception as exc:
        step["status"] = "failed"
        step["error"] = str(exc)
        raise


# ---------------------------------------------------------------------------
# Entity extractors (mirrors ai_service — kept local to avoid circular imports)
# ---------------------------------------------------------------------------

CITY_ALIASES: dict[str, str] = {
    "bengaluru": "Bangalore", "bangalore": "Bangalore",
    "delhi": "Delhi", "new delhi": "Delhi",
    "mumbai": "Mumbai", "bombay": "Mumbai",
    "jaipur": "Jaipur", "goa": "Goa", "agra": "Agra",
    "chennai": "Chennai", "madras": "Chennai",
    "hyderabad": "Hyderabad", "hyd": "Hyderabad",
}


def _extract_city(text: str) -> str | None:
    t = text.lower()
    for alias in sorted(CITY_ALIASES, key=len, reverse=True):
        if alias in t:
            return CITY_ALIASES[alias]
    return None


def _extract_guests(text: str) -> int:
    patterns = [
        r"(\d+)\s*(?:guest|guests|person|persons|people|adult|adults|pax)",
        r"(?:for|table for|room for)\s*(\d+)",
        r"(\d+)\s*(?:of us|people)",
    ]
    for pat in patterns:
        m = re.search(pat, text.lower())
        if m:
            return int(m.group(1))
    return 2  # sensible default


def _extract_date(text: str, default: str = "2026-11-15") -> str:
    m = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
    if m:
        return m.group(1)
    m = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", text)
    if m:
        return f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"
    relative = {
        "today": "2026-10-30", "tomorrow": "2026-10-31",
        "this weekend": "2026-11-01", "next week": "2026-11-06",
    }
    for word, iso in relative.items():
        if word in text.lower():
            return iso
    return default


def _detect_task_type(instruction: str) -> str:
    t = instruction.lower()
    if any(w in t for w in ["restaurant", "table", "dine", "eat", "food", "lunch", "dinner"]):
        return "restaurant"
    return "hotel"


# ---------------------------------------------------------------------------
# AgentWorker
# ---------------------------------------------------------------------------

class AgentWorker:
    """
    Autonomous booking agent that breaks an instruction into sequential steps,
    executes them, and returns a full execution trace.
    """

    def execute(self, instruction: str, context: dict = None) -> dict:
        """
        Execute the agent plan for the given instruction.

        Returns
        -------
        {
            "plan":   list of step dicts (with status + output),
            "result": dict with final answer / options,
            "status": "completed" | "needs_input" | "failed"
        }
        """
        context = context or {}
        task_type = _detect_task_type(instruction)

        if task_type == "hotel":
            return self._execute_hotel_plan(instruction, context)
        else:
            return self._execute_restaurant_plan(instruction, context)

    # ------------------------------------------------------------------
    # Hotel booking plan
    # ------------------------------------------------------------------

    def _execute_hotel_plan(self, instruction: str, context: dict) -> dict:
        plan = [
            _make_step("understand_request",
                       "Parse the user instruction to extract city, dates, guests, budget."),
            _make_step("search_hotels",
                       "Search the hotel catalogue using extracted parameters."),
            _make_step("check_availability",
                       "Verify room availability for the top match."),
            _make_step("present_options",
                       "Prepare a ranked list of available hotels for the user."),
            _make_step("await_selection",
                       "Wait for the user to select a hotel and room type."),
            _make_step("confirm_booking",
                       "Confirm the booking details with the user."),
            _make_step("execute_booking",
                       "Create the booking record in the system."),
        ]

        # ── Step 0: understand_request ────────────────────────────────
        step = plan[0]
        try:
            city = _run_step(step, _extract_city, instruction)
            guests = _extract_guests(instruction)
            checkin = _extract_date(instruction, "2026-11-15")
            checkout = _extract_date(instruction, "2026-11-17")

            # Attempt to find two distinct dates for checkin/checkout
            dates = re.findall(r"\b(\d{4}-\d{2}-\d{2})\b", instruction)
            if len(dates) >= 2:
                checkin, checkout = dates[0], dates[1]

            max_price_match = re.search(
                r"(?:under|below|less than|max|budget)[\s₹rs.]*(\d[\d,]*)", instruction.lower()
            )
            max_price = int(max_price_match.group(1).replace(",", "")) if max_price_match else None

            stars_match = re.search(r"(\d)\s*(?:-|\s)?star", instruction.lower())
            min_stars = int(stars_match.group(1)) if stars_match else None

            step["output"] = {
                "city": city, "guests": guests,
                "checkin": checkin, "checkout": checkout,
                "max_price": max_price, "min_stars": min_stars,
            }
            step["status"] = "done"
        except Exception as exc:
            step["status"] = "failed"
            step["error"] = str(exc)
            return {"plan": plan, "result": {"error": "Could not parse instruction."}, "status": "failed"}

        if not city:
            step["status"] = "failed"
            step["error"] = "City not found in instruction."
            return {
                "plan": plan,
                "result": {
                    "message": "Which city would you like to book a hotel in?",
                    "missing": "city",
                },
                "status": "needs_input",
            }

        # ── Step 1: search_hotels ─────────────────────────────────────
        step = plan[1]
        try:
            hotels = _run_step(
                step, search_hotels,
                city=city, checkin=checkin, checkout=checkout,
                guests=guests, max_price=max_price, min_stars=min_stars,
            )
        except Exception:
            return {"plan": plan, "result": {"error": "Hotel search failed."}, "status": "failed"}

        if not hotels:
            step["status"] = "done"
            step["output"] = []
            plan[2]["status"] = "failed"
            plan[2]["error"] = "No hotels found; availability check skipped."
            return {
                "plan": plan,
                "result": {
                    "message": f"No hotels found in {city} matching your criteria.",
                    "hotels": [],
                },
                "status": "needs_input",
            }

        # ── Step 2: check_availability ────────────────────────────────
        step = plan[2]
        top_hotel = hotels[0]
        default_room = top_hotel["room_types"][0]["type"]
        try:
            avail = _run_step(
                step, check_availability,
                hotel_id=top_hotel["id"],
                checkin=checkin, checkout=checkout,
                room_type=default_room, guests=guests,
            )
        except Exception:
            avail = {"available": False, "message": "Availability check failed."}
            step["status"] = "failed"

        # ── Step 3: present_options ───────────────────────────────────
        step = plan[3]
        step["status"] = "running"
        options = []
        for h in hotels[:5]:
            options.append({
                "hotel_id": h["id"],
                "name": h["name"],
                "city": h["city"],
                "star_rating": h["star_rating"],
                "price_per_night": h["price_per_night"],
                "available_rooms": h["available_rooms"],
                "room_types": h["room_types"],
                "amenities": h["amenities"][:5],
                "images": h["images"][:1],
            })
        step["status"] = "done"
        step["output"] = {"options_count": len(options), "options": options}

        # ── Steps 4-6 need user input — mark as pending ───────────────
        plan[4]["status"] = "pending"
        plan[4]["output"] = {"message": "Awaiting user hotel selection."}
        plan[5]["status"] = "pending"
        plan[5]["output"] = {"message": "Awaiting booking confirmation."}
        plan[6]["status"] = "pending"
        plan[6]["output"] = {"message": "Booking will be executed after confirmation."}

        return {
            "plan": plan,
            "result": {
                "message": (
                    f"Found {len(hotels)} hotel(s) in {city}. "
                    f"Showing top {len(options)} options. Please select one to proceed."
                ),
                "task_type": "hotel",
                "city": city,
                "checkin": checkin,
                "checkout": checkout,
                "guests": guests,
                "hotels": options,
                "top_availability": avail,
            },
            "status": "needs_input",
        }

    # ------------------------------------------------------------------
    # Restaurant booking plan
    # ------------------------------------------------------------------

    def _execute_restaurant_plan(self, instruction: str, context: dict) -> dict:
        plan = [
            _make_step("understand_request",
                       "Parse the instruction to extract city, date, time, and party size."),
            _make_step("get_location",
                       "Confirm or extract the dining city/location."),
            _make_step("search_restaurants",
                       "Search the restaurant catalogue with extracted filters."),
            _make_step("check_availability",
                       "Check table availability at the top restaurant."),
            _make_step("present_options",
                       "Present top restaurant options to the user."),
            _make_step("confirm_booking",
                       "Confirm the reservation details."),
            _make_step("execute_booking",
                       "Create the table booking record."),
        ]

        # ── Step 0: understand_request ────────────────────────────────
        step = plan[0]
        try:
            city = _run_step(step, _extract_city, instruction)
            guests = _extract_guests(instruction)
            date = _extract_date(instruction, "2026-11-15")
            time_match = re.search(r"\b(\d{1,2}:\d{2})\b", instruction)
            time = time_match.group(1) if time_match else "19:00"
            step["output"] = {
                "city": city, "guests": guests, "date": date, "time": time,
            }
            step["status"] = "done"
        except Exception as exc:
            step["status"] = "failed"
            step["error"] = str(exc)
            return {"plan": plan, "result": {"error": "Could not parse instruction."}, "status": "failed"}

        # ── Step 1: get_location ──────────────────────────────────────
        step = plan[1]
        step["status"] = "running"
        if not city:
            step["status"] = "failed"
            step["error"] = "City not detected."
            return {
                "plan": plan,
                "result": {
                    "message": "Which city would you like to dine in?",
                    "missing": "city",
                },
                "status": "needs_input",
            }
        step["status"] = "done"
        step["output"] = {"city": city}

        # ── Step 2: search_restaurants ────────────────────────────────
        step = plan[2]
        try:
            restaurants = _run_step(
                step, search_restaurants,
                city=city, date=date, time=time, guests=guests,
            )
        except Exception:
            return {"plan": plan, "result": {"error": "Restaurant search failed."}, "status": "failed"}

        if not restaurants:
            step["output"] = []
            plan[3]["status"] = "failed"
            plan[3]["error"] = "No restaurants found; availability check skipped."
            return {
                "plan": plan,
                "result": {
                    "message": f"No open restaurants found in {city} at {time}.",
                    "restaurants": [],
                },
                "status": "needs_input",
            }

        # ── Step 3: check_availability ────────────────────────────────
        step = plan[3]
        top = restaurants[0]
        try:
            avail = _run_step(
                step, check_table_availability,
                restaurant_id=top["id"], date=date, time=time, guests=guests,
            )
        except Exception:
            avail = {"available": False, "message": "Availability check failed."}
            step["status"] = "failed"

        # ── Step 4: present_options ───────────────────────────────────
        step = plan[4]
        step["status"] = "running"
        options = []
        for r in restaurants[:5]:
            options.append({
                "restaurant_id": r["id"],
                "name": r["name"],
                "city": r["city"],
                "cuisine": r["cuisine"],
                "rating": r["rating"],
                "price_for_two": r["price_for_two"],
                "opening_hours": r["opening_hours"],
                "images": r["images"][:1],
            })
        step["status"] = "done"
        step["output"] = {"options_count": len(options), "options": options}

        plan[5]["status"] = "pending"
        plan[5]["output"] = {"message": "Awaiting user restaurant selection."}
        plan[6]["status"] = "pending"
        plan[6]["output"] = {"message": "Booking will be created after confirmation."}

        return {
            "plan": plan,
            "result": {
                "message": (
                    f"Found {len(restaurants)} restaurant(s) in {city} "
                    f"for {guests} guests at {time}. Please pick one."
                ),
                "task_type": "restaurant",
                "city": city,
                "date": date,
                "time": time,
                "guests": guests,
                "restaurants": options,
                "top_availability": avail,
            },
            "status": "needs_input",
        }


# Module-level singleton
agent_worker = AgentWorker()
