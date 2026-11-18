"""
services/booking_service.py
High-level booking operations that coordinate between models and services.
"""

from __future__ import annotations
from datetime import datetime

from models.booking import (
    create_booking,
    get_bookings_by_user,
    get_booking_by_id,
    cancel_booking as model_cancel_booking,
)
from services.hotel_service import get_hotel_by_id
from services.restaurant_service import get_restaurant_by_id


# ---------------------------------------------------------------------------
# Hotel Booking
# ---------------------------------------------------------------------------

def create_hotel_booking(
    user_id: str,
    hotel_id: str,
    checkin: str,
    checkout: str,
    room_type: str,
    guests: int,
    total_price: float,
) -> dict:
    """
    Create a hotel booking, compute nights if possible, and persist it.

    Returns the full booking record with hotel details embedded.
    """
    # Calculate number of nights for reference (stored in total_price)
    try:
        d1 = datetime.strptime(checkin, "%Y-%m-%d")
        d2 = datetime.strptime(checkout, "%Y-%m-%d")
        nights = max((d2 - d1).days, 1)
    except (ValueError, TypeError):
        nights = 1

    booking = create_booking(
        user_id=user_id,
        booking_type="hotel",
        guests=int(guests),
        hotel_id=hotel_id,
        checkin=checkin,
        checkout=checkout,
        room_type=room_type,
        total_price=float(total_price),
    )

    # Embed hotel snapshot so front-end doesn't need a second request
    hotel = get_hotel_by_id(hotel_id) or {}
    booking["hotel_info"] = {
        "name": hotel.get("name", ""),
        "city": hotel.get("city", ""),
        "address": hotel.get("address", ""),
        "star_rating": hotel.get("star_rating", ""),
        "images": hotel.get("images", []),
    }
    booking["nights"] = nights
    return booking


# ---------------------------------------------------------------------------
# Restaurant Booking
# ---------------------------------------------------------------------------

def create_restaurant_booking(
    user_id: str,
    restaurant_id: str,
    date: str,
    time: str,
    guests: int,
) -> dict:
    """
    Create a restaurant / table booking and persist it.

    Returns the full booking record with restaurant details embedded.
    """
    booking = create_booking(
        user_id=user_id,
        booking_type="restaurant",
        guests=int(guests),
        restaurant_id=restaurant_id,
        date=date,
        time=time,
    )

    # Embed restaurant snapshot
    restaurant = get_restaurant_by_id(restaurant_id) or {}
    booking["restaurant_info"] = {
        "name": restaurant.get("name", ""),
        "city": restaurant.get("city", ""),
        "address": restaurant.get("address", ""),
        "cuisine": restaurant.get("cuisine", []),
        "rating": restaurant.get("rating", ""),
        "images": restaurant.get("images", []),
    }
    return booking


# ---------------------------------------------------------------------------
# Retrieve bookings
# ---------------------------------------------------------------------------

def get_user_bookings(user_id: str) -> list[dict]:
    """
    Return all bookings for a user, with hotel/restaurant info embedded.
    """
    bookings = get_bookings_by_user(user_id)
    enriched = []
    for b in bookings:
        b = dict(b)
        if b.get("booking_type") == "hotel" and b.get("hotel_id"):
            hotel = get_hotel_by_id(b["hotel_id"]) or {}
            b["hotel_info"] = {
                "name": hotel.get("name", ""),
                "city": hotel.get("city", ""),
                "address": hotel.get("address", ""),
                "star_rating": hotel.get("star_rating", ""),
                "images": hotel.get("images", []),
            }
        elif b.get("booking_type") == "restaurant" and b.get("restaurant_id"):
            restaurant = get_restaurant_by_id(b["restaurant_id"]) or {}
            b["restaurant_info"] = {
                "name": restaurant.get("name", ""),
                "city": restaurant.get("city", ""),
                "address": restaurant.get("address", ""),
                "cuisine": restaurant.get("cuisine", []),
                "rating": restaurant.get("rating", ""),
                "images": restaurant.get("images", []),
            }
        enriched.append(b)
    return enriched


def get_booking_detail(booking_id: str) -> dict | None:
    """
    Return full booking detail with hotel or restaurant info embedded.
    Returns None if not found.
    """
    booking = get_booking_by_id(booking_id)
    if not booking:
        return None

    booking = dict(booking)
    if booking.get("booking_type") == "hotel" and booking.get("hotel_id"):
        booking["hotel_info"] = get_hotel_by_id(booking["hotel_id"]) or {}
    elif booking.get("booking_type") == "restaurant" and booking.get("restaurant_id"):
        booking["restaurant_info"] = get_restaurant_by_id(booking["restaurant_id"]) or {}

    return booking


def cancel_booking(booking_id: str, user_id: str) -> dict | None:
    """
    Cancel a booking by ID (must belong to user_id).
    Returns the updated booking or None on failure.
    """
    return model_cancel_booking(booking_id, user_id)
