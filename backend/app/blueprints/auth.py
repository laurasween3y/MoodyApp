"""Auth endpoints for register/login/logout."""

from datetime import datetime, timedelta
from uuid import uuid4

import jwt
from flask import current_app, request, make_response
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
    # jti enables server-side revocation; exp keeps sessions short-lived.
    payload = {
        "sub": str(user_id),
        "jti": str(uuid4()),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    secret = current_app.config.get("SECRET_KEY")
    return jwt.encode(payload, secret, algorithm="HS256")


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
    # Cleanup expired rows to keep the blacklist small.
    TokenBlacklist.query.filter(TokenBlacklist.expires_at <= datetime.utcnow()).delete(synchronize_session=False)
    if TokenBlacklist.query.filter_by(jti=jti).first():
        return

    db.session.add(TokenBlacklist(jti=jti, expires_at=expires_at))  # type: ignore[call-arg]
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
        """Authenticate and return a JWT."""

        email = data["email"].lower()
        user = User.query.filter_by(email=email).first()
        if user is None or not user.check_password(data["password"]):
            abort(401, message="Invalid credentials")

        token = _sign_jwt(user.id)

        # Issue the token both in the JSON body and as an HttpOnly cookie so
        # browser-style clients (and our tests) automatically send it on
        # subsequent requests without hand-adding Authorization headers.
        cookie_name = current_app.config.get("JWT_COOKIE_NAME", "moody_access_token")
        secure = current_app.config.get("JWT_COOKIE_SECURE", False)
        same_site = current_app.config.get("JWT_COOKIE_SAMESITE", "Lax")
        max_age = current_app.config.get("JWT_COOKIE_MAX_AGE", 86400)

        payload = {"message": "Login successful", "access_token": token}
        response = make_response(payload, 200)
        response.set_cookie(
            cookie_name,
            token,
            httponly=True,
            secure=secure,
            samesite=same_site,
            max_age=max_age,
            path="/",
        )
        return response


@blp.route("/logout")
class LogoutResource(MethodView):
    @blp.response(200, LogoutResponseSchema)
    def post(self):
        token = None
        # Prefer Authorization header when present.
        auth_header = request.headers.get("Authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header.split()[1]
        if token:
            _revoke_token(token)

        return {"message": "Logged out"}
