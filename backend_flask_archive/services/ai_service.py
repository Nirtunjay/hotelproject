"""
services/ai_service.py
Smart mock AI assistant for hotel & restaurant booking queries.
Uses keyword/pattern matching and multi-turn conversation state — no real LLM required.
"""

from __future__ import annotations
import re
from typing import Any

from services.hotel_service import search_hotels, get_popular_hotels
from services.restaurant_service import search_restaurants

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

KNOWN_CITIES = [
    "delhi", "mumbai", "jaipur", "bangalore", "bengaluru",
    "goa", "agra", "chennai", "hyderabad",
]

# Normalise variant spellings to the value used in mock data
CITY_ALIASES: dict[str, str] = {
    "bengaluru": "Bangalore",
    "bangalore": "Bangalore",
    "delhi": "Delhi",
    "new delhi": "Delhi",
    "mumbai": "Mumbai",
    "bombay": "Mumbai",
    "jaipur": "Jaipur",
    "goa": "Goa",
    "agra": "Agra",
    "chennai": "Chennai",
    "madras": "Chennai",
    "hyderabad": "Hyderabad",
    "hyd": "Hyderabad",
}

# ---------------------------------------------------------------------------
# In-process session store (keyed by session_id)
# ---------------------------------------------------------------------------
_SESSIONS: dict[str, dict] = {}


def _get_session(session_id: str) -> dict:
    if session_id not in _SESSIONS:
        _SESSIONS[session_id] = {"history": [], "state": {}}
    return _SESSIONS[session_id]


def clear_session(session_id: str) -> None:
    """Remove all session data for the given session ID."""
    _SESSIONS.pop(session_id, None)


# ---------------------------------------------------------------------------
# Entity extraction helpers
# ---------------------------------------------------------------------------

def _extract_city(text: str) -> str | None:
    """Return the first recognised city name found in text, normalised."""
    text_lower = text.lower()
    # Check multi-word aliases first (longest first)
    for alias in sorted(CITY_ALIASES, key=len, reverse=True):
        if alias in text_lower:
            return CITY_ALIASES[alias]
    return None


def _extract_guests(text: str) -> int | None:
    """
    Extract a guest/person count from text.
    Looks for digits near keywords like guest, person, people, adult, pax.
    """
    patterns = [
        r"(\d+)\s*(?:guest|guests|person|persons|people|adult|adults|pax)",
        r"(?:for|table for|room for)\s*(\d+)",
        r"(\d+)\s*(?:of us|people)",
    ]
    for pat in patterns:
        m = re.search(pat, text.lower())
        if m:
            return int(m.group(1))
    return None


def _extract_date(text: str) -> str | None:
    """
    Naively extract a YYYY-MM-DD or DD/MM/YYYY style date from text.
    Returns ISO format string or None.
    """
    # ISO format
    m = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
    if m:
        return m.group(1)
    # DD/MM/YYYY or DD-MM-YYYY
    m = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", text)
    if m:
        return f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"
    # Common words
    relative = {
        "today": "2026-10-30",
        "tomorrow": "2026-10-31",
        "this weekend": "2026-11-01",
        "next week": "2026-11-06",
    }
    text_lower = text.lower()
    for word, iso in relative.items():
        if word in text_lower:
            return iso
    return None


def _extract_price(text: str) -> int | None:
    """Extract a budget / max price from text (INR)."""
    m = re.search(
        r"(?:under|below|less than|max|budget of|budget)\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*)",
        text.lower(),
    )
    if m:
        return int(m.group(1).replace(",", ""))
    m = re.search(r"(?:rs\.?|inr|₹)\s*(\d[\d,]*)", text.lower())
    if m:
        return int(m.group(1).replace(",", ""))
    return None


def _extract_stars(text: str) -> int | None:
    """Extract a minimum star rating from text."""
    m = re.search(r"(\d)\s*(?:-|\s)?star", text.lower())
    if m:
        return int(m.group(1))
    if "luxury" in text.lower():
        return 5
    if "budget" in text.lower() or "cheap" in text.lower() or "affordable" in text.lower():
        return None
    return None


# ---------------------------------------------------------------------------
# Intent detection
# ---------------------------------------------------------------------------

def _detect_intent(text: str) -> str:
    """Return the detected intent string for the user message."""
    t = text.lower()

    if any(w in t for w in ["hello", "hi ", "hey", "hi!", "hii", "howdy", "greetings", "namaste"]):
        return "GREET"

    if any(w in t for w in ["cancel booking", "cancel reservation", "cancel my booking",
                              "cancel my reservation", "want to cancel"]):
        return "CANCEL"

    if any(w in t for w in ["my bookings", "my reservation", "booking history",
                              "past booking", "show booking", "view booking",
                              "my trips", "reservation history"]):
        return "BOOKING_STATUS"

    if any(w in t for w in [
        "find hotel", "book hotel", "book a hotel", "search hotel",
        "hotel in", "hotels in", "stay in", "stay at", "i need a hotel",
        "looking for hotel", "want a hotel", "need hotel",
    ]):
        return "SEARCH_HOTEL"

    if any(w in t for w in [
        "find restaurant", "book restaurant", "book a table", "book table",
        "restaurant in", "restaurants in", "eat in", "dine in",
        "table for", "looking for restaurant", "food in", "where to eat",
        "dining", "good place to eat",
    ]):
        return "SEARCH_RESTAURANT"

    if any(w in t for w in ["near me", "nearby", "close to me", "around me",
                              "close by", "nearest"]):
        return "NEARBY"

    if any(w in t for w in ["price", "cost", "how much", "affordable",
                              "cheap", "budget", "expensive", "luxury",
                              "inr", "rs.", "₹"]):
        return "PRICING"

    if any(w in t for w in ["help", "how do", "what can you", "what can i",
                              "how to", "guide", "assist", "support", "options"]):
        return "HELP"

    return "UNKNOWN"


# ---------------------------------------------------------------------------
# Response builders
# ---------------------------------------------------------------------------

def _greet_response() -> dict:
    return {
        "message": (
            "👋 Namaste! I'm your Smart Travel Assistant.\n\n"
            "I can help you:\n"
            "🏨 **Find & book hotels** across Delhi, Mumbai, Jaipur, Goa, and more\n"
            "🍽️ **Discover & reserve restaurant tables** in top Indian cities\n"
            "📋 **View or cancel your bookings**\n\n"
            "What would you like to do today?"
        ),
        "action": None,
        "data": None,
        "quick_replies": [
            "Find hotels in Goa",
            "Book a table in Mumbai",
            "Show my bookings",
            "Popular hotels in Jaipur",
        ],
    }


def _help_response() -> dict:
    return {
        "message": (
            "🤖 Here's what I can do for you:\n\n"
            "**Hotels**\n"
            "• _\"Find hotels in Delhi\"_ – search by city\n"
            "• _\"5-star hotels in Jaipur under ₹20000\"_ – filter by stars & price\n"
            "• _\"Hotels for 3 guests in Goa\"_ – filter by guests\n\n"
            "**Restaurants**\n"
            "• _\"Restaurants in Bangalore\"_ – search by city\n"
            "• _\"Book a table for 4 in Mumbai\"_ – reserve a table\n\n"
            "**Bookings**\n"
            "• _\"Show my bookings\"_ – view all reservations\n"
            "• _\"Cancel my booking\"_ – cancel a reservation\n\n"
            "Just type naturally and I'll understand! 😊"
        ),
        "action": "open_search",
        "data": None,
        "quick_replies": [
            "Hotels in Mumbai",
            "Restaurants in Delhi",
            "My bookings",
        ],
    }


def _pricing_response(text: str) -> dict:
    max_price = _extract_price(text)
    stars = _extract_stars(text)

    tips = []
    if max_price:
        tips.append(f"I can filter hotels under ₹{max_price:,}/night.")
    if stars:
        tips.append(f"I can show only {stars}-star and above properties.")
    if not tips:
        tips.append(
            "Hotels in our system range from ₹850/night (hostels) to ₹2,00,000/night (palace suites)."
        )

    return {
        "message": (
            "💰 **Pricing & Filters**\n\n"
            + "\n".join(tips)
            + "\n\nTell me your destination and I'll find options that fit your budget!"
        ),
        "action": "open_search",
        "data": None,
        "quick_replies": [
            "Budget hotels in Delhi",
            "Luxury hotels in Jaipur",
            "Hotels in Goa under ₹5000",
        ],
    }


def _nearby_response() -> dict:
    return {
        "message": (
            "📍 To show nearby hotels & restaurants, I need your location.\n\n"
            "Please allow location access or tell me which city/area you're in."
        ),
        "action": "request_location",
        "data": None,
        "quick_replies": [
            "I'm in Delhi",
            "I'm in Mumbai",
            "I'm in Bangalore",
            "I'm in Goa",
        ],
    }


def _booking_status_response() -> dict:
    return {
        "message": (
            "📋 Here are your upcoming reservations.\n"
            "You can view details, cancel, or modify any booking from this page."
        ),
        "action": "show_bookings",
        "data": None,
        "quick_replies": ["Cancel a booking", "Book another hotel"],
    }


def _cancel_response() -> dict:
    return {
        "message": (
            "❌ To cancel a booking, please go to **My Bookings** and click the "
            "Cancel button on the reservation you'd like to remove.\n\n"
            "Would you like me to take you there now?"
        ),
        "action": "show_bookings",
        "data": None,
        "quick_replies": ["Show my bookings", "Go back"],
    }


def _search_hotel_response(text: str, session: dict) -> dict:
    """
    Handle hotel search intent. Uses multi-turn state to collect missing info.
    """
    state = session.get("state", {})

    city = _extract_city(text) or state.get("city")
    guests = _extract_guests(text) or state.get("guests", 1)
    max_price = _extract_price(text) or state.get("max_price")
    min_stars = _extract_stars(text) or state.get("min_stars")
    checkin = _extract_date(text) or state.get("checkin")

    # Persist extracted entities
    session["state"].update({
        "intent": "SEARCH_HOTEL",
        "city": city,
        "guests": guests,
        "max_price": max_price,
        "min_stars": min_stars,
        "checkin": checkin,
    })

    # Ask for city if still missing
    if not city:
        return {
            "message": (
                "🏨 I'd love to help you find a hotel!\n\n"
                "Which city are you travelling to?"
            ),
            "action": None,
            "data": None,
            "quick_replies": ["Delhi", "Mumbai", "Jaipur", "Goa", "Bangalore", "Hyderabad"],
        }

    # Run search
    results = search_hotels(
        city=city,
        guests=guests,
        max_price=max_price,
        min_stars=min_stars,
        checkin=checkin,
    )

    if not results:
        return {
            "message": (
                f"😔 Sorry, I couldn't find any hotels in **{city}** matching your criteria.\n\n"
                "Try relaxing your filters (price, stars) or choosing a different city."
            ),
            "action": "open_search",
            "data": {"city": city},
            "quick_replies": [f"All hotels in {city}", "Try another city"],
        }

    summary = f"🏨 Found **{len(results)} hotel(s)** in **{city}**"
    if min_stars:
        summary += f" ({min_stars}+ stars)"
    if max_price:
        summary += f" under ₹{max_price:,}/night"
    summary += ":\n\n"
    for h in results[:3]:
        summary += (
            f"• **{h['name']}** – {'⭐' * h['star_rating']} "
            f"| ₹{h['price_per_night']:,}/night "
            f"| {h['available_rooms']} room(s) left\n"
        )
    if len(results) > 3:
        summary += f"\n...and {len(results) - 3} more options."

    # Clear intent state after successful response
    session["state"] = {}

    return {
        "message": summary,
        "action": "show_hotels",
        "data": {"hotels": results, "city": city},
        "quick_replies": [
            f"Book {results[0]['name']}",
            f"More hotels in {city}",
            "Filter by price",
        ],
    }


def _search_restaurant_response(text: str, session: dict) -> dict:
    """
    Handle restaurant search intent. Uses multi-turn state to collect missing info.
    """
    state = session.get("state", {})

    city = _extract_city(text) or state.get("city")
    guests = _extract_guests(text) or state.get("guests", 2)
    date = _extract_date(text) or state.get("date")

    # Crude time extraction
    time_match = re.search(r"\b(\d{1,2}:\d{2})\b", text)
    time = (time_match.group(1) if time_match else None) or state.get("time")

    session["state"].update({
        "intent": "SEARCH_RESTAURANT",
        "city": city,
        "guests": guests,
        "date": date,
        "time": time,
    })

    if not city:
        return {
            "message": (
                "🍽️ I'll help you find a great place to eat!\n\n"
                "Which city are you dining in?"
            ),
            "action": None,
            "data": None,
            "quick_replies": ["Delhi", "Mumbai", "Jaipur", "Goa", "Bangalore", "Hyderabad"],
        }

    results = search_restaurants(city=city, date=date, time=time, guests=guests)

    if not results:
        return {
            "message": (
                f"😔 No open restaurants found in **{city}** for your criteria.\n"
                "Try a different time or city."
            ),
            "action": "open_search",
            "data": {"city": city},
            "quick_replies": [f"All restaurants in {city}", "Try another city"],
        }

    summary = f"🍽️ Found **{len(results)} restaurant(s)** in **{city}**:\n\n"
    for r in results[:3]:
        cuisine_str = ", ".join(r["cuisine"][:2]) if r["cuisine"] else ""
        summary += (
            f"• **{r['name']}** – {cuisine_str} "
            f"| ⭐ {r['rating']} "
            f"| ₹{r['price_for_two']:,} for two\n"
        )
    if len(results) > 3:
        summary += f"\n...and {len(results) - 3} more options."

    session["state"] = {}

    return {
        "message": summary,
        "action": "show_restaurants",
        "data": {"restaurants": results, "city": city},
        "quick_replies": [
            f"Reserve at {results[0]['name']}",
            f"More restaurants in {city}",
            "Different cuisine",
        ],
    }


def _unknown_response() -> dict:
    return {
        "message": (
            "🤔 I'm not quite sure what you're looking for.\n\n"
            "I specialise in hotel and restaurant bookings across India. "
            "Here are some things you can ask me:"
        ),
        "action": None,
        "data": None,
        "quick_replies": [
            "Find hotels in Delhi",
            "Book a table in Mumbai",
            "Show my bookings",
            "Help",
        ],
    }


# ---------------------------------------------------------------------------
# Multi-turn continuation handler
# ---------------------------------------------------------------------------

def _handle_continuation(text: str, session: dict) -> dict | None:
    """
    If the session has a pending intent and the user just supplied missing info
    (e.g., just typed a city name after being asked), continue the flow.
    """
    state = session.get("state", {})
    pending = state.get("intent")
    if not pending:
        return None

    # City-only reply for pending hotel search
    if pending == "SEARCH_HOTEL" and not state.get("city"):
        city = _extract_city(text)
        if city:
            session["state"]["city"] = city
            return _search_hotel_response(text, session)

    # City-only reply for pending restaurant search
    if pending == "SEARCH_RESTAURANT" and not state.get("city"):
        city = _extract_city(text)
        if city:
            session["state"]["city"] = city
            return _search_restaurant_response(text, session)

    return None


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def process_message(message: str, session_id: str, context: dict = None) -> dict:
    """
    Process a user message and return a structured AI response.

    Parameters
    ----------
    message    : Raw user text
    session_id : Unique conversation session identifier
    context    : Optional extra context dict (user_id, location, etc.)

    Returns
    -------
    dict with keys: message, action, data, quick_replies
    """
    session = _get_session(session_id)
    if context:
        session.setdefault("context", {}).update(context)

    text = message.strip()

    # 1. Try to continue a multi-turn flow first
    continuation = _handle_continuation(text, session)
    if continuation:
        session["history"].append({"role": "user", "content": text})
        session["history"].append({"role": "assistant", "content": continuation["message"]})
        return continuation

    # 2. Detect intent
    intent = _detect_intent(text)

    # 3. Route to the appropriate handler
    if intent == "GREET":
        response = _greet_response()
    elif intent == "HELP":
        response = _help_response()
    elif intent == "SEARCH_HOTEL":
        response = _search_hotel_response(text, session)
    elif intent == "SEARCH_RESTAURANT":
        response = _search_restaurant_response(text, session)
    elif intent == "NEARBY":
        response = _nearby_response()
    elif intent == "BOOKING_STATUS":
        response = _booking_status_response()
    elif intent == "CANCEL":
        response = _cancel_response()
    elif intent == "PRICING":
        response = _pricing_response(text)
    else:
        response = _unknown_response()

    # Append to history
    session["history"].append({"role": "user", "content": text})
    session["history"].append({"role": "assistant", "content": response["message"]})

    return response
