"""User model with password helpers."""

from datetime import datetime

import bcrypt
from werkzeug.security import check_password_hash

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password: str):
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        self.password_hash = hashed.decode("utf-8")

    def check_password(self, password: str) -> bool:
        stored = self.password_hash
        if isinstance(stored, bytes):
            stored = stored.decode("utf-8", errors="ignore")

        if stored.startswith("scrypt:") or stored.startswith("pbkdf2:"):
            return check_password_hash(stored, password)

        try:
            return bcrypt.checkpw(password.encode("utf-8"), stored.encode("utf-8"))
        except ValueError:
            return False
