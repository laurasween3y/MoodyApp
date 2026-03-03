"""App-wide configuration loaded from env."""

import os


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL")

    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is required and must point to PostgreSQL (e.g., postgres://user:pass@host:5432/db)")

    if DATABASE_URL.startswith("sqlite"):
        raise ValueError("SQLite is not supported for this deployment; please configure PostgreSQL via DATABASE_URL")

    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY is required and must be set via environment variables")

    JWT_COOKIE_NAME = os.getenv("JWT_COOKIE_NAME", "moody_access_token")
    JWT_COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "false").lower() == "true"
    JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
    JWT_COOKIE_MAX_AGE = int(os.getenv("JWT_COOKIE_MAX_AGE", "86400"))
