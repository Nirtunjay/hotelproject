"""
app.py - Main Flask application entry point.

Registers all blueprints, enables CORS, connects to MongoDB,
and exposes a health-check endpoint.
"""

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from db.mongo import get_db

# Blueprint imports
from routes.hotels import hotels_bp
from routes.restaurants import restaurants_bp
from routes.bookings import bookings_bp
from routes.ai_assistant import ai_bp
from routes.auth import auth_bp


def create_app() -> Flask:
    """Application factory — creates and configures the Flask app."""
    app = Flask(__name__)

    # ── Load configuration ────────────────────────────────────────────────
    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["DEBUG"] = Config.DEBUG

    # ── Enable CORS for all routes (allow any origin) ─────────────────────
    CORS(app, origins="*", supports_credentials=True)

    # ── Initialise MongoDB connection (eager check on startup) ────────────
    try:
        db = get_db()
        # Lightweight ping to verify connectivity
        db.command("ping")
        print(f"✅  MongoDB connected → database: '{Config.DB_NAME}'")
    except Exception as exc:
        # Non-fatal in mock-data mode; warn and continue
        print(f"⚠️  MongoDB connection failed: {exc}")
        print("    Running in mock-data mode — booking persistence will not work.")

    # ── Register Blueprints ───────────────────────────────────────────────
    app.register_blueprint(hotels_bp)
    app.register_blueprint(restaurants_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(auth_bp)

    # ── Health check ──────────────────────────────────────────────────────
    @app.route("/api/health", methods=["GET"])
    def health():
        """Simple liveness probe."""
        return jsonify({
            "status": "ok",
            "message": "Smart Hotel API running",
            "version": "1.0.0",
        })

    # ── 404 handler ───────────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": "Endpoint not found. Check the URL and try again.",
        }), 404

    # ── 405 handler ───────────────────────────────────────────────────────
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "error": "HTTP method not allowed for this endpoint.",
        }), 405

    # ── 500 handler ───────────────────────────────────────────────────────
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "success": False,
            "error": "An unexpected server error occurred.",
        }), 500

    return app


# ── Entry point ───────────────────────────────────────────────────────────────
app = create_app()

if __name__ == "__main__":
    print(f"🚀  Starting Smart Hotel API on http://127.0.0.1:{Config.PORT}")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
