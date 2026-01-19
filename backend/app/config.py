import os


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://moody_user:moody_password@localhost:5432/moody",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
