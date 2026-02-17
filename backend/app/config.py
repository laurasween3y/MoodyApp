import os


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL")

    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is required and must point to PostgreSQL (e.g., postgres://user:pass@host:5432/db)")

    if DATABASE_URL.startswith("sqlite"):
        raise ValueError("SQLite is not supported for this deployment; please configure PostgreSQL via DATABASE_URL")

    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
