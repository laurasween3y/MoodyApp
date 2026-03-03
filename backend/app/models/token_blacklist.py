"""Blacklist table for revoked JWTs (stores jti + expiry)."""

from datetime import datetime

from app.extensions import db


class TokenBlacklist(db.Model):
    __tablename__ = "token_blacklist"

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), unique=True, nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
