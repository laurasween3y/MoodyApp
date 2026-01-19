from flask.views import MethodView
from flask_smorest import Blueprint

from ..schemas.mood import MoodSchema

blp = Blueprint(
    "moods",
    __name__,
    url_prefix="/moods",
    description="Submit and view moods",
)


@blp.route("/")
class MoodsResource(MethodView):
    @blp.arguments(MoodSchema)
    @blp.response(201, MoodSchema)
    def post(self, mood_data):
        """Accept a mood entry and echo it back.

        This keeps the vertical slice minimal while demonstrating
        request validation and response serialization.
        """
        return mood_data
