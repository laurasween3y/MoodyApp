import datetime as dt
from typing import List
from sqlalchemy import func

from app.extensions import db
from app.models import (
    Streak,
    Achievement,
    Mood,
    HabitCompletion,
    JournalEntry,
    PlannerEvent,
)


def _touch_streak(user_id: int, module: str, action_date: dt.date) -> Streak:
    streak = Streak.query.filter_by(user_id=user_id, module=module).first()
    if not streak:
        streak = Streak()
        streak.user_id = user_id
        streak.module = module
        streak.current_streak = 0
        streak.longest_streak = 0
        db.session.add(streak)

    if streak.last_action_date == action_date:
        return streak

    if streak.last_action_date == action_date - dt.timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_action_date = action_date
    return streak


def _award(user_id: int, module: str, key: str, awarded: List[str]) -> None:
    exists = Achievement.query.filter_by(user_id=user_id, achievement_key=key).first()
    if not exists:
        achievement = Achievement()
        achievement.user_id = user_id
        achievement.module = module
        achievement.achievement_key = key
        db.session.add(achievement)
        awarded.append(key)


def evaluate_mood(user_id: int, action_date: dt.date) -> List[str]:
    """Update mood streaks and award achievements that align with progress API keys."""

    awarded: List[str] = []
    streak = _touch_streak(user_id, "mood", action_date)

    total = db.session.query(func.count(Mood.id)).filter_by(user_id=user_id).scalar() or 0

    # Achievement keys must match progress.ALL_ACHIEVEMENTS
    if streak and streak.current_streak >= 7:
        _award(user_id, "mood", "mood_7_day", awarded)
    if total >= 30:
        _award(user_id, "mood", "mood_30_day", awarded)

    return awarded


def evaluate_habit(user_id: int, action_date: dt.date) -> List[str]:
    """Update habit streaks and award achievements matching progress API keys."""

    awarded: List[str] = []
    _touch_streak(user_id, "habit", action_date)

    total = db.session.query(func.count(HabitCompletion.id)).filter_by(user_id=user_id).scalar() or 0

    if total >= 10:
        _award(user_id, "habit", "habit_10", awarded)

    return awarded


def evaluate_journal(user_id: int, action_date: dt.date | None = None) -> List[str]:
    """Award journal achievements that match progress API keys and optionally touch streaks."""

    awarded: List[str] = []

    if action_date:
        _touch_streak(user_id, "journal", action_date)

    total = db.session.query(func.count(JournalEntry.id)).filter_by(user_id=user_id).scalar() or 0
    if total >= 5:
        _award(user_id, "journal", "journal_5", awarded)
    return awarded


def evaluate_planner(user_id: int, action_date: dt.date | None = None) -> List[str]:
    """Award planner achievements matching progress API keys and update streak when date provided."""

    awarded: List[str] = []

    if action_date:
        _touch_streak(user_id, "planner", action_date)

    total = db.session.query(func.count(PlannerEvent.id)).filter_by(user_id=user_id).scalar() or 0
    if total >= 7:
        _award(user_id, "planner", "planner_7", awarded)
    return awarded
