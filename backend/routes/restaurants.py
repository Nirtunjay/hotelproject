"""
routes/restaurants.py
Blueprint for all restaurant-related API endpoints.
Prefix: /api/restaurants
"""

from flask import Blueprint, request, jsonify
from services.restaurant_service import (
    search_restaurants,
    get_restaurant_by_id,
    check_table_availability,
    get_nearby_restaurants,
)

restaurants_bp = Blueprint("restaurants_bp", __name__, url_prefix="/api/restaurants")


# ---------------------------------------------------------------------------
# GET /api/restaurants/search
# ---------------------------------------------------------------------------
@restaurants_bp.route("/search", methods=["GET"])
def search():
    """
    Search restaurants by city, date, time, and party size.

    Query params:
        city    (required) – destination city
        date    (optional) – YYYY-MM-DD
        time    (optional) – HH:MM (24-hour)
        guests  (optional) – integer, default 2
    """
    city = request.args.get("city", "").strip()
    if not city:
        return jsonify({"success": False, "error": "Query param 'city' is required."}), 400

    date = request.args.get("date")
    time = request.args.get("time")
    guests = request.args.get("guests", 2, type=int)

    restaurants = search_restaurants(city=city, date=date, time=time, guests=guests)

    return jsonify({
        "success": True,
        "count": len(restaurants),
        "city": city,
        "restaurants": restaurants,
    })


# ---------------------------------------------------------------------------
# GET /api/restaurants/nearby
# ---------------------------------------------------------------------------
@restaurants_bp.route("/nearby", methods=["GET"])
def nearby():
    """
    Return restaurants within a radius of the given coordinates.

    Query params:
        lat     (required) – latitude (float)
        lng     (required) – longitude (float)
        radius  (optional) – search radius in km, default 5
    """
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)

    if lat is None or lng is None:
        return jsonify({
            "success": False,
            "error": "Query params 'lat' and 'lng' are required.",
        }), 400

    radius = request.args.get("radius", 5.0, type=float)
    restaurants = get_nearby_restaurants(lat=lat, lng=lng, radius_km=radius)

    return jsonify({
        "success": True,
        "count": len(restaurants),
        "restaurants": restaurants,
    })


# ---------------------------------------------------------------------------
# GET /api/restaurants/<restaurant_id>
# ---------------------------------------------------------------------------
@restaurants_bp.route("/<restaurant_id>", methods=["GET"])
def get_restaurant(restaurant_id: str):
    """Return full details for a single restaurant by its ID."""
    restaurant = get_restaurant_by_id(restaurant_id)
    if not restaurant:
        return jsonify({
            "success": False,
            "error": f"Restaurant '{restaurant_id}' not found.",
        }), 404

    return jsonify({"success": True, "restaurant": restaurant})


# ---------------------------------------------------------------------------
# POST /api/restaurants/check-availability
# ---------------------------------------------------------------------------
@restaurants_bp.route("/check-availability", methods=["POST"])
def check_restaurant_availability():
    """
    Check table availability.

    Request body (JSON):
        restaurant_id (str) – restaurant ID
        date          (str) – YYYY-MM-DD
        time          (str) – HH:MM
        guests        (int) – number of diners
    """
    data = request.get_json(silent=True) or {}

    restaurant_id = data.get("restaurant_id", "").strip()
    date = data.get("date", "").strip()
    time = data.get("time", "").strip()
    guests = int(data.get("guests", 2))

    if not restaurant_id:
        return jsonify({"success": False, "error": "'restaurant_id' is required."}), 400

    result = check_table_availability(
        restaurant_id=restaurant_id,
        date=date,
        time=time,
        guests=guests,
    )

    status_code = 200 if result.get("available") else 409
    return jsonify({"success": result.get("available", False), **result}), status_code
