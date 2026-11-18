"""
db/mongo.py - MongoDB connection management using PyMongo.
"""

from pymongo import MongoClient
from pymongo.database import Database
from config import Config

# Module-level client singleton – reused across requests
_client: MongoClient = None


def get_client() -> MongoClient:
    """Return (and lazily create) the shared MongoClient instance."""
    global _client
    if _client is None:
        _client = MongoClient(Config.MONGO_URI)
    return _client


def get_db() -> Database:
    """Return the application database."""
    return get_client()[Config.DB_NAME]


# ---------------------------------------------------------------------------
# Convenience collection accessors
# ---------------------------------------------------------------------------

def users_col():
    """Return the 'users' collection."""
    return get_db()["users"]


def bookings_col():
    """Return the 'bookings' collection."""
    return get_db()["bookings"]


def hotels_col():
    """Return the 'hotels' collection (unused in mock mode but available)."""
    return get_db()["hotels"]


def restaurants_col():
    """Return the 'restaurants' collection (unused in mock mode but available)."""
    return get_db()["restaurants"]
