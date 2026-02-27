import jwt
from functools import wraps
from flask import current_app, request, g
from flask_smorest import abort

from app.models import User


def get_current_user() -> User:
    cookie_name = current_app.config.get("JWT_COOKIE_NAME", "moody_access_token")
    token = request.cookies.get(cookie_name)

    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header.split()[1]
        else:
            abort(401, message="Authentication token missing")
    try:
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        abort(401, message="Token expired")
    except jwt.InvalidTokenError:
        abort(401, message="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        abort(401, message="Invalid token payload")

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        abort(401, message="Invalid token payload")

    user = User.query.get(user_id)
    if user is None:
        abort(401, message="User not found")

    return user


def jwt_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if request.method == "OPTIONS":
            return "", 200
        g.current_user = get_current_user()
        return fn(*args, **kwargs)

    return wrapper
