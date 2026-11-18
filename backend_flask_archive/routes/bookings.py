"""
routes/bookings.py
Blueprint for all booking-related API endpoints.
Prefix: /api/bookings
"""

from flask import Blueprint, request, jsonify
from services.booking_service import (
    create_hotel_booking,
    create_restaurant_booking,
    get_user_bookings,
    get_booking_detail,
    cancel_booking,
)

bookings_bp = Blueprint("bookings_bp", __name__, url_prefix="/api/bookings")


# ---------------------------------------------------------------------------
# GET /api/bookings/?user_id=
# ---------------------------------------------------------------------------
@bookings_bp.route("/", methods=["GET"])
def list_bookings():
    """
    Return all bookings for a user.

    Query params:
        user_id (required) – the user's UUID
    """
    user_id = request.args.get("user_id", "").strip()
    if not user_id:
        return jsonify({"success": False, "error": "'user_id' query param is required."}), 400

    bookings = get_user_bookings(user_id)
    return jsonify({
        "success": True,
        "count": len(bookings),
        "bookings": bookings,
    })


# ---------------------------------------------------------------------------
# POST /api/bookings/hotel
# ---------------------------------------------------------------------------
@bookings_bp.route("/hotel", methods=["POST"])
def book_hotel():
    """
    Create a hotel booking.

    Request body (JSON):
        user_id     (str)   – user UUID
        hotel_id    (str)   – hotel ID (e.g. HTL001)
        checkin     (str)   – YYYY-MM-DD
        checkout    (str)   – YYYY-MM-DD
        room_type   (str)   – room type label
        guests      (int)   – number of guests
        total_price (float) – total price in INR
    """
    data = request.get_json(silent=True) or {}

    required_fields = ["user_id", "hotel_id", "checkin", "checkout",
                       "room_type", "guests", "total_price"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}",
        }), 400

    try:
        booking = create_hotel_booking(
            user_id=data["user_id"],
            hotel_id=data["hotel_id"],
            checkin=data["checkin"],
            checkout=data["checkout"],
            room_type=data["room_type"],
            guests=int(data["guests"]),
            total_price=float(data["total_price"]),
        )
        return jsonify({"success": True, "booking": booking}), 201
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


# ---------------------------------------------------------------------------
# POST /api/bookings/restaurant
# ---------------------------------------------------------------------------
@bookings_bp.route("/restaurant", methods=["POST"])
def book_restaurant():
    """
    Create a restaurant table booking.

    Request body (JSON):
        user_id       (str) – user UUID
        restaurant_id (str) – restaurant ID (e.g. RST001)
        date          (str) – YYYY-MM-DD
        time          (str) – HH:MM
        guests        (int) – number of diners
    """
    data = request.get_json(silent=True) or {}

    required_fields = ["user_id", "restaurant_id", "date", "time", "guests"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}",
        }), 400

    try:
        booking = create_restaurant_booking(
            user_id=data["user_id"],
            restaurant_id=data["restaurant_id"],
            date=data["date"],
            time=data["time"],
            guests=int(data["guests"]),
        )
        return jsonify({"success": True, "booking": booking}), 201
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


# ---------------------------------------------------------------------------
# GET /api/bookings/<booking_id>
# ---------------------------------------------------------------------------
@bookings_bp.route("/<booking_id>", methods=["GET"])
def get_booking(booking_id: str):
    """Return full details for a single booking including hotel/restaurant info."""
    booking = get_booking_detail(booking_id)
    if not booking:
        return jsonify({
            "success": False,
            "error": f"Booking '{booking_id}' not found.",
        }), 404

    return jsonify({"success": True, "booking": booking})


# ---------------------------------------------------------------------------
# DELETE /api/bookings/<booking_id>
# ---------------------------------------------------------------------------
@bookings_bp.route("/<booking_id>", methods=["DELETE"])
def cancel(booking_id: str):
    """
    Cancel a booking.

    Request body (JSON):
        user_id (str) – must match the booking's owner
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id", "").strip()

    if not user_id:
        return jsonify({"success": False, "error": "'user_id' is required in body."}), 400

    result = cancel_booking(booking_id=booking_id, user_id=user_id)
    if not result:
        return jsonify({
            "success": False,
            "error": "Booking not found or you are not authorised to cancel it.",
        }), 404

    return jsonify({"success": True, "booking": result})
