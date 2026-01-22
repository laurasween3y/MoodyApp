from datetime import datetime, timedelta

import jwt
from flask import current_app
from flask.views import MethodView
from flask_smorest import Blueprint, abort

from app.extensions import db
from app.models import User
from app.schemas.auth import (
    LoginSchema,
    LoginResponseSchema,
    RegisterResponseSchema,
    RegisterSchema,
)

blp = Blueprint(
    "auth",
    __name__,
    url_prefix="/auth",
    description="Authentication endpoints",
)


def _sign_jwt(user_id: int) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    secret = current_app.config.get("SECRET_KEY")
    return jwt.encode(payload, secret, algorithm="HS256")


@blp.route("/register")
class RegisterResource(MethodView):
    @blp.arguments(RegisterSchema)
    @blp.response(201, RegisterResponseSchema)
    def post(self, data):
        """Create a new user account."""

        email = data["email"].lower()
        if User.query.filter_by(email=email).first():
            abort(409, message="Email already registered")

        user = User()
        user.email = email
        user.set_password(data["password"])

        db.session.add(user)
        db.session.commit()

        return {"message": "User registered successfully"}


@blp.route("/login")
class LoginResource(MethodView):
    @blp.arguments(LoginSchema)
    @blp.response(200, LoginResponseSchema)
    def post(self, data):
        """Authenticate and return a JWT."""

        email = data["email"].lower()
        user = User.query.filter_by(email=email).first()
        if user is None or not user.check_password(data["password"]):
            abort(401, message="Invalid credentials")

        token = _sign_jwt(user.id)
        return {"access_token": token}
