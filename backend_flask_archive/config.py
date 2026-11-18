"""
config.py - Application configuration loaded from .env file.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()


class Config:
    """Central configuration object for the Flask application."""

    # MongoDB connection URI
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

    # MongoDB database name
    DB_NAME: str = os.getenv("DB_NAME", "hoteldb")

    # RapidAPI key for any external APIs
    RAPIDAPI_KEY: str = os.getenv("RAPIDAPI_KEY", "")

    # Flask secret key – used for session signing, etc.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")

    # Debug mode toggle
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    # Server port
    PORT: int = int(os.getenv("PORT", "5000"))
