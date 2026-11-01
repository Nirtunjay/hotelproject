"""
routes/hotels.py
Blueprint for all hotel-related API endpoints.
Prefix: /api/hotels
"""

from flask import Blueprint, request, jsonify
from services.hotel_service import (
    search_hotels,
    get_hotel_by_id,
    get_popular_hotels,
    check_availability,
)

hotels_bp = Blueprint("hotels_bp", __name__, url_prefix="/api/hotels")


# ---------------------------------------------------------------------------
# GET /api/hotels/search
# ---------------------------------------------------------------------------
@hotels_bp.route("/search", methods=["GET"])
def search():
    """
    Search hotels by city and optional filters.

    Query params:
        city       (required) – destination city
        checkin    (optional) – YYYY-MM-DD
        checkout   (optional) – YYYY-MM-DD
        guests     (optional) – integer, default 1
        max_price  (optional) – max price per night (INR)
        min_stars  (optional) – minimum star rating (1-5)
    """
    city = request.args.get("city", "").strip()
    if not city:
        return jsonify({"success": False, "error": "Query param 'city' is required."}), 400

    checkin = request.args.get("checkin")
    checkout = request.args.get("checkout")
    guests = request.args.get("guests", 1, type=int)
    max_price = request.args.get("max_price", type=float)
    min_stars = request.args.get("min_stars", type=int)

    hotels = search_hotels(
        city=city,
        checkin=checkin,
        checkout=checkout,
        guests=guests,
        max_price=max_price,
        min_stars=min_stars,
    )

    return jsonify({
        "success": True,
        "count": len(hotels),
        "city": city,
        "hotels": hotels,
    })


# ---------------------------------------------------------------------------
# GET /api/hotels/popular
# ---------------------------------------------------------------------------
@hotels_bp.route("/popular", methods=["GET"])
def popular():
    """
    Return popular hotels, optionally filtered by city.

    Query params:
        city  (optional) – destination city
        limit (optional) – number of results, default 6
    """
    city = request.args.get("city", "").strip() or None
    limit = request.args.get("limit", 6, type=int)

    hotels = get_popular_hotels(city=city, limit=limit)

    return jsonify({
        "success": True,
        "count": len(hotels),
        "hotels": hotels,
    })


# ---------------------------------------------------------------------------
# GET /api/hotels/<hotel_id>
# ---------------------------------------------------------------------------
@hotels_bp.route("/<hotel_id>", methods=["GET"])
def get_hotel(hotel_id: str):
    """Return full details for a single hotel by its ID."""
    hotel = get_hotel_by_id(hotel_id)
    if not hotel:
        return jsonify({"success": False, "error": f"Hotel '{hotel_id}' not found."}), 404

    return jsonify({"success": True, "hotel": hotel})


# ---------------------------------------------------------------------------
# POST /api/hotels/check-availability
# ---------------------------------------------------------------------------
@hotels_bp.route("/check-availability", methods=["POST"])
def check_hotel_availability():
    """
    Check room availability.

    Request body (JSON):
        hotel_id   (str)  – hotel ID
        checkin    (str)  – YYYY-MM-DD
        checkout   (str)  – YYYY-MM-DD
        room_type  (str)  – desired room type label
        guests     (int)  – number of guests
    """
    data = request.get_json(silent=True) or {}

    hotel_id = data.get("hotel_id", "").strip()
    checkin = data.get("checkin", "").strip()
    checkout = data.get("checkout", "").strip()
    room_type = data.get("room_type", "").strip()
    guests = int(data.get("guests", 1))

    if not hotel_id:
        return jsonify({"success": False, "error": "'hotel_id' is required."}), 400

    result = check_availability(
        hotel_id=hotel_id,
        checkin=checkin,
        checkout=checkout,
        room_type=room_type,
        guests=guests,
    )

    status_code = 200 if result.get("available") else 409
    return jsonify({"success": result.get("available", False), **result}), status_code
