from datetime import date

from flask.views import MethodView
from flask_smorest import Blueprint, abort

from app.extensions import db
from app.models.mood import Mood
from ..schemas.mood import (
    MOOD_OPTIONS,
    MoodCreateSchema,
    MoodOptionsSchema,
    MoodResponseSchema,
)

blp = Blueprint(
    "moods",
    __name__,
    url_prefix="/moods",
    description="Submit and view moods",
)


@blp.route("/")
class MoodsResource(MethodView):
    @blp.response(200, MoodResponseSchema(many=True))
    def get(self):
        """List all moods for the current user (temporary user_id=1)."""

        moods = (
            Mood.query.filter_by(user_id=1)
            .order_by(Mood.date.desc(), Mood.id.desc())
            .all()
        )
        return moods

    @blp.arguments(MoodCreateSchema)
    @blp.response(201, MoodResponseSchema)
    def post(self, mood_data):
        """Create a mood entry and return it."""

        mood = Mood()
        mood.user_id = 1  # TEMP until auth is added
        mood.mood = mood_data.get("mood")
        mood.note = mood_data.get("note")

        db.session.add(mood)
        db.session.commit()

        return mood


@blp.route("/<int:mood_id>")
class MoodDetailResource(MethodView):
    @blp.response(200, MoodResponseSchema)
    def get(self, mood_id):
        """Get a single mood by id for the current user."""

        mood = Mood.query.filter_by(user_id=1, id=mood_id).first()
        if mood is None:
            abort(404, message="Mood not found")

        return mood

    @blp.arguments(MoodCreateSchema)
    @blp.response(200, MoodResponseSchema)
    def patch(self, update_data, mood_id):
        """Update a mood's mood/note fields."""

        mood = Mood.query.filter_by(user_id=1, id=mood_id).first()
        if mood is None:
            abort(404, message="Mood not found")

        mood.mood = update_data.get("mood", mood.mood)
        mood.note = update_data.get("note")
        db.session.commit()

        return mood

    @blp.response(204)
    def delete(self, mood_id):
        """Delete a mood for the current user."""

        mood = Mood.query.filter_by(user_id=1, id=mood_id).first()
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
            Mood.query.filter_by(user_id=1, date=date.today())
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
