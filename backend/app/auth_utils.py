import jwt
from flask import current_app, request
from flask_smorest import abort

from app.models import User


def get_current_user() -> User:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.lower().startswith("bearer "):
        abort(401, message="Authorization header missing or invalid")

    token = auth_header.split()[1]
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
