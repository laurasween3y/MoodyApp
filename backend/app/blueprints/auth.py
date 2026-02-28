from datetime import datetime, timedelta
from uuid import uuid4

import jwt
from flask import current_app, make_response, request
from flask.views import MethodView
from flask_smorest import Blueprint, abort

from app.extensions import db
from app.models import TokenBlacklist, User
from app.schemas.auth import (
    LoginSchema,
    LoginResponseSchema,
    LogoutResponseSchema,
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
        "sub": str(user_id),
        "jti": str(uuid4()),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    secret = current_app.config.get("SECRET_KEY")
    return jwt.encode(payload, secret, algorithm="HS256")

def _set_auth_cookie(response, token: str) -> None:
    response.set_cookie(
        current_app.config.get("JWT_COOKIE_NAME", "moody_access_token"),
        token,
        httponly=True,
        secure=current_app.config.get("JWT_COOKIE_SECURE", False),
        samesite=current_app.config.get("JWT_COOKIE_SAMESITE", "Lax"),
        max_age=current_app.config.get("JWT_COOKIE_MAX_AGE", 86400),
        path="/",
    )


def _clear_auth_cookie(response) -> None:
    response.delete_cookie(
        current_app.config.get("JWT_COOKIE_NAME", "moody_access_token"),
        path="/",
        samesite=current_app.config.get("JWT_COOKIE_SAMESITE", "Lax"),
    )


def _revoke_token(token: str) -> None:
    secret = current_app.config.get("SECRET_KEY")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_exp": False})
    except jwt.InvalidTokenError:
        return

    jti = payload.get("jti")
    exp = payload.get("exp")
    if not jti or not exp:
        return

    expires_at = datetime.utcfromtimestamp(int(exp))
    TokenBlacklist.query.filter(TokenBlacklist.expires_at <= datetime.utcnow()).delete(synchronize_session=False)
    if TokenBlacklist.query.filter_by(jti=jti).first():
        return

    db.session.add(TokenBlacklist(jti=jti, expires_at=expires_at))
    _commit_or_abort("Could not revoke token")


def _commit_or_abort(message: str) -> None:
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        abort(500, message=message)


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
        _commit_or_abort("Could not register user")

        return {"message": "User registered successfully"}


@blp.route("/login")
class LoginResource(MethodView):
    @blp.arguments(LoginSchema)
    @blp.response(200, LoginResponseSchema)
    def post(self, data):
        """Authenticate and set a JWT cookie."""

        email = data["email"].lower()
        user = User.query.filter_by(email=email).first()
        if user is None or not user.check_password(data["password"]):
            abort(401, message="Invalid credentials")

        token = _sign_jwt(user.id)
        response = make_response({"message": "Login successful"})
        _set_auth_cookie(response, token)
        return response


@blp.route("/logout")
class LogoutResource(MethodView):
    @blp.response(200, LogoutResponseSchema)
    def post(self):
        response = make_response({"message": "Logged out"})
        token = request.cookies.get(current_app.config.get("JWT_COOKIE_NAME", "moody_access_token"))
        if token:
            _revoke_token(token)
        _clear_auth_cookie(response)
        return response
