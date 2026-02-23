from flask import g
from flask.views import MethodView
from flask_smorest import Blueprint

from app.auth_utils import jwt_required
from app.models import Streak, Achievement
from app.schemas.gamification import StreakSchema, AchievementSchema

blp = Blueprint(
    "gamification",
    __name__,
    url_prefix="/gamification",
    description="Streaks and achievements",
)


@blp.route("/streaks")
class StreaksResource(MethodView):
    decorators = [jwt_required]
    @blp.response(200, StreakSchema(many=True))
    def get(self):
        streaks = Streak.query.filter_by(user_id=g.current_user.id).all()
        return streaks


@blp.route("/achievements")
class AchievementsResource(MethodView):
    decorators = [jwt_required]
    @blp.response(200, AchievementSchema(many=True))
    def get(self):
        achievements = Achievement.query.filter_by(user_id=g.current_user.id).all()
        return achievements
