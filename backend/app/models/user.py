from datetime import datetime

import bcrypt
from sqlalchemy.types import TypeDecorator

from app.extensions import db


class BcryptText(TypeDecorator):
    """Stores bcrypt hashes as text; tolerates bytes/memoryview on read."""

    impl = db.Text
    cache_ok = True

    def process_bind_param(self, value, dialect):  # type: ignore[override]
        if value is None:
            return value
        if isinstance(value, (bytes, bytearray, memoryview)):
            return bytes(value).decode("utf-8")
        return value

    def process_result_value(self, value, dialect):  # type: ignore[override]
        if value is None:
            return value
        if isinstance(value, memoryview):
            value = value.tobytes()
        if isinstance(value, (bytes, bytearray)):
            return value.decode("utf-8")
        return value


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(BcryptText(), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password: str):
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password: str) -> bool:
        stored = self.password_hash

        if isinstance(stored, memoryview):
            stored = stored.tobytes()
        if isinstance(stored, str):
            if stored.startswith("\\x"):
                # Postgres bytea text representation (e.g., "\\x2432...")
                stored = bytes.fromhex(stored[2:])
            else:
                stored = stored.encode("utf-8")

        return bcrypt.checkpw(
            password.encode("utf-8"),
            stored
        )
