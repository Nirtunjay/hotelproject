"""
routes/auth.py
Blueprint for user authentication and profile endpoints.
Prefix: /api/auth
"""

from flask import Blueprint, request, jsonify
from models.user import create_user, find_user_by_email, find_user_by_id

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user account.

    Request body (JSON):
        name     (str) – full name
        email    (str) – email address (must be unique)
        password (str) – plain text password (hash in production!)
        phone    (str, optional) – mobile number
    """
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    phone = data.get("phone", "").strip()

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "error": "Fields 'name', 'email', and 'password' are required.",
        }), 400

    try:
        user = create_user(name=name, email=email, password=password, phone=phone)
        # Never return the password field to the client
        user.pop("password", None)
        return jsonify({"success": True, "user": user}), 201
    except ValueError as exc:
        # Duplicate email
        return jsonify({"success": False, "error": str(exc)}), 409
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate a user and return their profile.

    Request body (JSON):
        email    (str) – registered email
        password (str) – account password
    """
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({
            "success": False,
            "error": "Fields 'email' and 'password' are required.",
        }), 400

    user = find_user_by_email(email)

    if not user:
        return jsonify({"success": False, "error": "No account found with that email."}), 404

    # Plain-text comparison — replace with bcrypt.checkpw() in production
    if user.get("password") != password:
        return jsonify({"success": False, "error": "Incorrect password."}), 401

    user.pop("password", None)
    return jsonify({
        "success": True,
        "message": f"Welcome back, {user['name']}!",
        "user": user,
    })


# ---------------------------------------------------------------------------
# GET /api/auth/user/<user_id>
# ---------------------------------------------------------------------------
@auth_bp.route("/user/<user_id>", methods=["GET"])
def get_user(user_id: str):
    """Return the public profile for the given user_id (UUID or Mongo _id)."""
    user = find_user_by_id(user_id)
    if not user:
        return jsonify({"success": False, "error": f"User '{user_id}' not found."}), 404

    user.pop("password", None)
    return jsonify({"success": True, "user": user})
