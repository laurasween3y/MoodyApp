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
        streak = Streak(user_id=user_id, module=module, current_streak=0, longest_streak=0)
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
        db.session.add(Achievement(user_id=user_id, module=module, achievement_key=key))
        awarded.append(key)


def evaluate_mood(user_id: int, action_date: dt.date) -> List[str]:
    awarded: List[str] = []
    _touch_streak(user_id, "mood", action_date)

    total = db.session.query(func.count(Mood.id)).filter_by(user_id=user_id).scalar()
    streak = Streak.query.filter_by(user_id=user_id, module="mood").first()

    if total >= 1:
        _award(user_id, "mood", "mood_first_log", awarded)
    for threshold in (3, 7, 30):
        if streak and streak.current_streak >= threshold:
            _award(user_id, "mood", f"mood_{threshold}_day_streak", awarded)
    if total >= 100:
        _award(user_id, "mood", "mood_100_total_logs", awarded)
    return awarded


def evaluate_habit(user_id: int, action_date: dt.date) -> List[str]:
    awarded: List[str] = []
    _touch_streak(user_id, "habit", action_date)

    total = db.session.query(func.count(HabitCompletion.id)).filter_by(user_id=user_id).scalar()
    streak = Streak.query.filter_by(user_id=user_id, module="habit").first()

    if total >= 1:
        _award(user_id, "habit", "habit_first_complete", awarded)
    if total >= 7:
        _award(user_id, "habit", "habit_7_completions", awarded)
    if total >= 30:
        _award(user_id, "habit", "habit_30_completions", awarded)
    if streak and streak.current_streak >= 14:
        _award(user_id, "habit", "habit_14_day_streak", awarded)
    if total >= 100:
        _award(user_id, "habit", "habit_100_total_completions", awarded)
    return awarded


def evaluate_journal(user_id: int) -> List[str]:
    awarded: List[str] = []
    total = db.session.query(func.count(JournalEntry.id)).filter_by(user_id=user_id).scalar()
    if total >= 1:
        _award(user_id, "journal", "journal_first_entry", awarded)
    if total >= 10:
        _award(user_id, "journal", "journal_10_entries", awarded)
    if total >= 25:
        _award(user_id, "journal", "journal_25_entries", awarded)
    if total >= 50:
        _award(user_id, "journal", "journal_50_entries", awarded)
    if total >= 100:
        _award(user_id, "journal", "journal_100_entries", awarded)
    return awarded


def evaluate_planner(user_id: int) -> List[str]:
    awarded: List[str] = []
    total = db.session.query(func.count(PlannerEvent.id)).filter_by(user_id=user_id).scalar()
    for threshold in (1, 10, 25, 50, 100):
        key = "planner_first_event" if threshold == 1 else f"planner_{threshold}_events"
        if total >= threshold:
            _award(user_id, "planner", key, awarded)
    return awarded
