import os


class Config:
    # Default to local Postgres; override with DATABASE_URL env if provided.
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://moody_user:moody_password@localhost:5432/moody",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
