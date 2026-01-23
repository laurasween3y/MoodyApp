from datetime import date

from flask import g, request
from flask.views import MethodView
from flask_smorest import Blueprint, abort

from app.extensions import db
from app.models.mood import Mood
from app.auth_utils import get_current_user
from ..schemas.mood import (
    MOOD_OPTIONS,
    MoodCreateSchema,
    MoodOptionsSchema,
    MoodResponseSchema,
    MoodUpdateSchema,
)

blp = Blueprint(
    "moods",
    __name__,
    url_prefix="/moods",
    description="Submit and view moods",
)


@blp.before_request
def require_auth():
    if request.method == "OPTIONS":
        return None

    g.current_user = get_current_user()


@blp.route("/")
class MoodsResource(MethodView):
    @blp.response(200, MoodResponseSchema(many=True))
    def get(self):
        """List all moods for the current user (temporary user_id=1)."""

        moods = (
            Mood.query.filter_by(user_id=g.current_user.id)
            .order_by(Mood.date.desc(), Mood.id.desc())
            .all()
        )
        return moods

    @blp.arguments(MoodCreateSchema)
    @blp.response(201, MoodResponseSchema)
    def post(self, mood_data):
        """Create a mood entry and return it."""

        mood_date = mood_data.get("date") or date.today()

        existing = (
            Mood.query.filter_by(user_id=g.current_user.id, date=mood_date)
            .order_by(Mood.id.desc())
            .first()
        )

        if existing:
            existing.mood = mood_data.get("mood", existing.mood)
            if "note" in mood_data:
                existing.note = mood_data.get("note")
            db.session.commit()
            return existing, 200

        mood = Mood()
        mood.user_id = g.current_user.id
        mood.mood = mood_data.get("mood")
        mood.note = mood_data.get("note")
        mood.date = mood_date

        db.session.add(mood)
        db.session.commit()

        return mood


@blp.route("/<int:mood_id>")
class MoodDetailResource(MethodView):
    @blp.response(200, MoodResponseSchema)
    def get(self, mood_id):
        """Get a single mood by id for the current user."""

        mood = Mood.query.filter_by(user_id=g.current_user.id, id=mood_id).first()
        if mood is None:
            abort(404, message="Mood not found")

        return mood

    @blp.arguments(MoodUpdateSchema)
    @blp.response(200, MoodResponseSchema)
    def patch(self, update_data, mood_id):
        """Update a mood's mood/note fields."""

        mood = Mood.query.filter_by(user_id=g.current_user.id, id=mood_id).first()
        if mood is None:
            abort(404, message="Mood not found")

        if "mood" in update_data:
            mood.mood = update_data.get("mood", mood.mood)

        if "note" in update_data:
            mood.note = update_data.get("note")

        if "date" in update_data:
            new_date = update_data.get("date")
            if new_date != mood.date:
                conflict = Mood.query.filter_by(user_id=g.current_user.id, date=new_date).first()
                if conflict and conflict.id != mood.id:
                    abort(409, message="Mood already exists for that date")
                mood.date = new_date

        db.session.commit()

        return mood

    @blp.response(204)
    def delete(self, mood_id):
        """Delete a mood for the current user."""

        mood = Mood.query.filter_by(user_id=g.current_user.id, id=mood_id).first()
        if mood is None:
            abort(404, message="Mood not found")

        db.session.delete(mood)
        db.session.commit()

        return "", 204


@blp.route("/today")
class TodayMoodResource(MethodView):
    @blp.response(200, MoodResponseSchema)
    def get(self):
        """Get today's mood for the current user (temporary user_id=1)."""

        mood = (
            Mood.query.filter_by(user_id=g.current_user.id, date=date.today())
            .order_by(Mood.id.desc())
            .first()
        )

        if mood is None:
            abort(404, message="No mood submitted for today")

        return mood


@blp.route("/options")
class MoodOptionsResource(MethodView):
    @blp.response(200, MoodOptionsSchema)
    def get(self):
        """List allowed mood keys for the client UI."""

        return {"options": MOOD_OPTIONS}
