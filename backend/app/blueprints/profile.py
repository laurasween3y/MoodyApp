from flask import g, request
from flask.views import MethodView
from flask_smorest import Blueprint, abort

from app.auth_utils import get_current_user
from app.extensions import db
from app.schemas.profile import ProfileSchema, ProfileUpdateSchema

blp = Blueprint(
    "profile",
    __name__,
    url_prefix="/profile",
    description="User profile",
)


@blp.before_request
def require_auth():
    if request.method == "OPTIONS":
        return None
    g.current_user = get_current_user()


def _commit_or_abort(message: str) -> None:
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        abort(500, message=message)


@blp.route("")
class ProfileResource(MethodView):
    @blp.response(200, ProfileSchema)
    def get(self):
        return g.current_user

    @blp.arguments(ProfileUpdateSchema)
    @blp.response(200, ProfileSchema)
    def put(self, data):
        user = g.current_user
        if data.get("email"):
            user.email = data["email"].lower()
        if data.get("password"):
            user.set_password(data["password"])
        db.session.add(user)
        _commit_or_abort("Could not update profile")
        return user
