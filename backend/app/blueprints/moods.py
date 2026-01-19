from flask.views import MethodView
from flask_smorest import Blueprint

from app.extensions import db
from app.models.mood import Mood
from ..schemas.mood import MoodCreateSchema, MoodResponseSchema

blp = Blueprint(
    "moods",
    __name__,
    url_prefix="/moods",
    description="Submit and view moods",
)


@blp.route("/")
class MoodsResource(MethodView):
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
