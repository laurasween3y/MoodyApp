from datetime import date

from flask import g, request
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.habit import Habit, HabitCompletion
from app.auth_utils import get_current_user
from app.schemas.habit import (
    HabitCreateSchema,
    HabitResponseSchema,
    HabitUpdateSchema,
    HabitToggleSchema,
)

blp = Blueprint(
    "habits",
    __name__,
    url_prefix="/habits",
    description="Create, update, and complete habits",
)


@blp.before_request
def require_auth():
    if request.method == "OPTIONS":
        return None
    g.current_user = get_current_user()


def _get_habit_or_404(habit_id: int) -> Habit:
    habit = Habit.query.filter_by(user_id=g.current_user.id, id=habit_id).first()
    if habit is None:
        abort(404, message="Habit not found")
    return habit


@blp.route("/")
class HabitsResource(MethodView):
    @blp.response(200, HabitResponseSchema(many=True))
    def get(self):
        """List habits for the current user"""

        habits = (
            Habit.query.filter_by(user_id=g.current_user.id)
            .order_by(Habit.created_at.desc())
            .all()
        )
        return habits

    @blp.arguments(HabitCreateSchema)
    @blp.response(201, HabitResponseSchema)
    def post(self, payload):
        """Create a habit"""

        habit = Habit()
        habit.user_id = g.current_user.id
        habit.title = payload.get("title")
        habit.frequency = payload.get("frequency", "daily")
        habit.target_per_week = payload.get("target_per_week", 7)

        db.session.add(habit)
        db.session.commit()
        return habit


@blp.route("/<int:habit_id>")
class HabitDetailResource(MethodView):
    @blp.response(200, HabitResponseSchema)
    def get(self, habit_id):
        habit = _get_habit_or_404(habit_id)
        return habit

    @blp.arguments(HabitUpdateSchema)
    @blp.response(200, HabitResponseSchema)
    def patch(self, payload, habit_id):
        habit = _get_habit_or_404(habit_id)

        if "title" in payload:
            habit.title = payload["title"]
        if "frequency" in payload:
            habit.frequency = payload["frequency"]
        if "target_per_week" in payload:
            habit.target_per_week = payload["target_per_week"]

        db.session.commit()
        return habit

    @blp.response(204)
    def delete(self, habit_id):
        habit = _get_habit_or_404(habit_id)
        db.session.delete(habit)
        db.session.commit()
        return "", 204


@blp.route("/<int:habit_id>/completions/<string:date_str>")
class HabitCompletionResource(MethodView):
    @blp.response(200, HabitResponseSchema)
    def put(self, habit_id, date_str):
        """Mark a habit complete for a given date (default today)."""

        habit = _get_habit_or_404(habit_id)
        try:
            completion_date = date.fromisoformat(date_str)
        except ValueError:
            abort(400, message="Invalid date format; use YYYY-MM-DD")

        completion = HabitCompletion()
        completion.habit_id = habit.id
        completion.user_id = g.current_user.id
        completion.date = completion_date

        db.session.add(completion)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            # Already exists, treat as idempotent success
        habit = _get_habit_or_404(habit_id)
        return habit

    @blp.response(200, HabitResponseSchema)
    def delete(self, habit_id, date_str):
        """Remove a completion for a given date."""

        habit = _get_habit_or_404(habit_id)
        try:
            completion_date = date.fromisoformat(date_str)
        except ValueError:
            abort(400, message="Invalid date format; use YYYY-MM-DD")

        HabitCompletion.query.filter_by(
            habit_id=habit.id,
            user_id=g.current_user.id,
            date=completion_date,
        ).delete()
        db.session.commit()

        habit = _get_habit_or_404(habit_id)
        return habit


@blp.route("/<int:habit_id>/toggle")
class HabitToggleResource(MethodView):
    @blp.arguments(HabitToggleSchema)
    @blp.response(200, HabitResponseSchema)
    def post(self, payload, habit_id):
        """Toggle completion for a date (default today)."""

        habit = _get_habit_or_404(habit_id)
        completion_date = payload.get("date", date.today())

        existing = HabitCompletion.query.filter_by(
            habit_id=habit.id,
            user_id=g.current_user.id,
            date=completion_date,
        ).first()

        if existing:
            db.session.delete(existing)
        else:
            completion = HabitCompletion()
            completion.habit_id = habit.id
            completion.user_id = g.current_user.id
            completion.date = completion_date
            db.session.add(completion)

        db.session.commit()
        habit = _get_habit_or_404(habit_id)
        return habit
