import datetime as dt
from flask import g
from flask.views import MethodView
from flask_smorest import Blueprint

from app.auth_utils import jwt_required
from app.models import Achievement, Streak
from app.schemas.progress import AchievementsResponseSchema, StreakSummarySchema

blp = Blueprint(
    "progress",
    __name__,
    url_prefix="/progress",
    description="Aggregated streaks and achievements for dashboards",
)

ALL_ACHIEVEMENTS = [
    {
        "module": "mood",
        "key": "mood_first_log",
        "title": "First Check-in",
        "description": "Log your first mood",
        "icon": "/assets/achievements/firstmood.png",
        "target": 1,
    },
    {
        "module": "mood",
        "key": "mood_7_day",
        "title": "Mood Keeper",
        "description": "Log moods 7 days in a row",
        "icon": "/assets/badges/mood_7_day.svg",
        "target": 7,
    },
    {
        "module": "mood",
        "key": "mood_30_day",
        "title": "Mood Maestro",
        "description": "Log moods for 30 days",
        "icon": "/assets/badges/mood_30_day.svg",
        "target": 30,
    },
    {
        "module": "habit",
        "key": "habit_first_completion",
        "title": "First Habit Check-in",
        "description": "Complete your first habit",
        "icon": "/assets/achievements/firsthabit.png",
        "target": 1,
    },
    {
        "module": "habit",
        "key": "habit_10",
        "title": "Habit Hero",
        "description": "Complete 10 habit check-ins",
        "icon": "/assets/badges/habit_10.svg",
        "target": 10,
    },
    {
        "module": "journal",
        "key": "journal_first_entry",
        "title": "First Entry",
        "description": "Write your first journal entry",
        "icon": "/assets/achievements/firstjournal.png",
        "target": 1,
    },
    {
        "module": "journal",
        "key": "journal_5",
        "title": "Storyteller",
        "description": "Write 5 journal entries",
        "icon": "/assets/badges/journal_5.svg",
        "target": 5,
    },
    {
        "module": "planner",
        "key": "planner_first_event",
        "title": "First Plan",
        "description": "Create your first planner event",
        "icon": "/assets/achievements/firstplan.png",
        "target": 1,
    },
    {
        "module": "planner",
        "key": "planner_7",
        "title": "Planner Pro",
        "description": "Complete 7 planner tasks",
        "icon": "/assets/badges/planner_7.svg",
        "target": 7,
    },
]


def _aggregate_streaks(user_id: int):
    streaks = {m: {"current": 0, "longest": 0} for m in ["mood", "habit", "journal", "planner"]}
    rows = Streak.query.filter_by(user_id=user_id).all()
    for row in rows:
        if row.module in streaks:
            streaks[row.module] = {
                "current": row.current_streak or 0,
                "longest": row.longest_streak or 0,
        }
    return streaks


def _safe_unlocked_at(row):
    val = getattr(row, "unlocked_at", None)
    if isinstance(val, dt.datetime):
        return val
    if isinstance(val, str):
        try:
            return dt.datetime.fromisoformat(val)
        except Exception:
            return None
    return None


@blp.route("/streaks")
class StreakSummaryResource(MethodView):
    decorators = [jwt_required]
    @blp.response(200, StreakSummarySchema)
    def get(self):
        streaks = _aggregate_streaks(g.current_user.id)
        return {
            "mood_current": streaks["mood"]["current"],
            "mood_longest": streaks["mood"]["longest"],
            "habit_current": streaks["habit"]["current"],
            "habit_longest": streaks["habit"]["longest"],
            "journal_current": streaks["journal"]["current"],
            "journal_longest": streaks["journal"]["longest"],
            "planner_current": streaks["planner"]["current"],
            "planner_longest": streaks["planner"]["longest"],
        }


@blp.route("/achievements")
class AchievementsResource(MethodView):
    decorators = [jwt_required]
    @blp.response(200, AchievementsResponseSchema)
    def get(self):
        unlocked_rows = Achievement.query.filter_by(user_id=g.current_user.id).all()
        unlocked_lookup = {a.achievement_key: a for a in unlocked_rows}

        all_payload = []
        unlocked_payload = []

        for ach in ALL_ACHIEVEMENTS:
            db_row = unlocked_lookup.get(ach["key"])
            progress_current = ach.get("target", 0)
            progress_target = ach.get("target", 0)
            unlocked_at = _safe_unlocked_at(db_row) if db_row else None
            payload = {
                "module": ach["module"],
                "key": ach["key"],
                "title": ach["title"],
                "description": ach["description"],
                "icon": ach["icon"],
                "locked": db_row is None,
                # keep as datetime for marshmallow to format
                "unlocked_at": unlocked_at if unlocked_at else None,
                "progress_current": progress_current if db_row else 0,
                "progress_target": progress_target,
            }
            all_payload.append(payload)
            if db_row:
                unlocked_payload.append(payload)

        return {"unlocked": unlocked_payload, "all_possible": all_payload}
