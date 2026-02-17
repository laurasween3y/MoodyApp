from flask import g, request
from flask.views import MethodView
from flask_smorest import Blueprint

from app.auth_utils import get_current_user
from app.models import Streak, Achievement
from app.schemas.gamification import StreakSchema, AchievementSchema

blp = Blueprint(
    "gamification",
    __name__,
    url_prefix="/gamification",
    description="Streaks and achievements",
)


@blp.before_request
def require_auth():
    if request.method == "OPTIONS":
        return None
    g.current_user = get_current_user()


@blp.route("/streaks")
class StreaksResource(MethodView):
    @blp.response(200, StreakSchema(many=True))
    def get(self):
        streaks = Streak.query.filter_by(user_id=g.current_user.id).all()
        return streaks


@blp.route("/achievements")
class AchievementsResource(MethodView):
    @blp.response(200, AchievementSchema(many=True))
    def get(self):
        achievements = Achievement.query.filter_by(user_id=g.current_user.id).all()
        return achievements
