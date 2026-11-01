"""
models/booking.py - Booking model and data-access helpers.

Booking document structure:
{
    "_id": ObjectId,
    "booking_id": str,        # UUID
    "user_id": str,
    "booking_type": str,      # "hotel" | "restaurant"
    "status": str,            # "confirmed" | "cancelled" | "pending"
    "hotel_id": str | None,
    "restaurant_id": str | None,
    "checkin": str | None,    # ISO date string  (hotel only)
    "checkout": str | None,   # ISO date string  (hotel only)
    "date": str | None,       # ISO date string  (restaurant only)
    "time": str | None,       # "HH:MM"          (restaurant only)
    "room_type": str | None,
    "guests": int,
    "total_price": float | None,
    "created_at": datetime,
    "updated_at": datetime
}
"""

import uuid
from datetime import datetime, timezone
from bson import ObjectId
from db.mongo import bookings_col


def _serialize(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serialisable dict."""
    if doc is None:
        return None
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    # Serialise datetimes
    for key in ("created_at", "updated_at"):
        if isinstance(doc.get(key), datetime):
            doc[key] = doc[key].isoformat()
    return doc


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def create_booking(
    user_id: str,
    booking_type: str,
    guests: int,
    hotel_id: str = None,
    restaurant_id: str = None,
    checkin: str = None,
    checkout: str = None,
    date: str = None,
    time: str = None,
    room_type: str = None,
    total_price: float = None,
) -> dict:
    """Insert a new booking and return the serialised document."""
    now = datetime.now(timezone.utc)
    doc = {
        "booking_id": str(uuid.uuid4()),
        "user_id": user_id,
        "booking_type": booking_type,   # "hotel" or "restaurant"
        "status": "confirmed",
        "hotel_id": hotel_id,
        "restaurant_id": restaurant_id,
        "checkin": checkin,
        "checkout": checkout,
        "date": date,
        "time": time,
        "room_type": room_type,
        "guests": guests,
        "total_price": total_price,
        "created_at": now,
        "updated_at": now,
    }
    result = bookings_col().insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc["created_at"] = now.isoformat()
    doc["updated_at"] = now.isoformat()
    return doc


def get_bookings_by_user(user_id: str) -> list[dict]:
    """Return all bookings belonging to a user, newest first."""
    cursor = bookings_col().find({"user_id": user_id}).sort("created_at", -1)
    return [_serialize(doc) for doc in cursor]


def get_booking_by_id(booking_id: str) -> dict | None:
    """
    Find a booking by its UUID booking_id.
    Also accepts MongoDB _id as fallback.
    """
    col = bookings_col()

    doc = col.find_one({"booking_id": booking_id})
    if doc:
        return _serialize(doc)

    try:
        doc = col.find_one({"_id": ObjectId(booking_id)})
        return _serialize(doc)
    except Exception:
        return None


def cancel_booking(booking_id: str, user_id: str) -> dict | None:
    """
    Mark a booking as cancelled.

    Returns the updated booking, or None if not found / ownership mismatch.
    """
    col = bookings_col()
    now = datetime.now(timezone.utc)

    result = col.update_one(
        {"booking_id": booking_id, "user_id": user_id},
        {"$set": {"status": "cancelled", "updated_at": now}},
    )

    if result.matched_count == 0:
        return None

    return get_booking_by_id(booking_id)
