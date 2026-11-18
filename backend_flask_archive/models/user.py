"""
models/user.py - User model and data-access helpers.

User document structure:
{
    "_id": ObjectId,
    "user_id": str,          # UUID string for API-friendly references
    "name": str,
    "email": str,
    "password": str,         # Stored as plain text for demo; hash in production
    "phone": str,
    "created_at": datetime,
    "updated_at": datetime
}
"""

import uuid
from datetime import datetime, timezone
from bson import ObjectId
from db.mongo import users_col


def _serialize(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serialisable dict."""
    if doc is None:
        return None
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    return doc


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def create_user(name: str, email: str, password: str, phone: str = "") -> dict:
    """
    Insert a new user document and return it.

    Raises ValueError if the email is already registered.
    """
    col = users_col()

    # Guard against duplicate emails
    if col.find_one({"email": email.lower().strip()}):
        raise ValueError(f"Email '{email}' is already registered.")

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": str(uuid.uuid4()),
        "name": name.strip(),
        "email": email.lower().strip(),
        "password": password,           # Hash with bcrypt in production
        "phone": phone.strip(),
        "created_at": now,
        "updated_at": now,
    }

    result = col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


def find_user_by_email(email: str) -> dict | None:
    """Find a user by their email address (case-insensitive)."""
    doc = users_col().find_one({"email": email.lower().strip()})
    return _serialize(doc)


def find_user_by_id(user_id: str) -> dict | None:
    """
    Find a user by their UUID user_id field.
    Falls back to MongoDB _id if user_id looks like an ObjectId.
    """
    col = users_col()

    # Try the application-level UUID field first
    doc = col.find_one({"user_id": user_id})
    if doc:
        return _serialize(doc)

    # Fall back to Mongo _id
    try:
        doc = col.find_one({"_id": ObjectId(user_id)})
        return _serialize(doc)
    except Exception:
        return None


def update_user(user_id: str, updates: dict) -> dict | None:
    """Apply a partial update to a user document and return the updated doc."""
    col = users_col()
    updates["updated_at"] = datetime.now(timezone.utc)
    col.update_one({"user_id": user_id}, {"$set": updates})
    return find_user_by_id(user_id)
