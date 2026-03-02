from datetime import date as dt_date

from flask import g, request
from flask.views import MethodView
from flask_smorest import Blueprint, abort

from app.extensions import db
from app.auth_utils import jwt_required
from app.models.planner import PlannerEvent
from app.services.gamification import evaluate_planner
from app.schemas.planner import (
    PlannerEventCreateSchema,
    PlannerEventResponseSchema,
    PlannerEventUpdateSchema,
)

blp = Blueprint(
    "planner",
    __name__,
    url_prefix="/planner",
    description="Plan events and reminders",
)


def _get_event_or_404(event_id: int) -> PlannerEvent:
    event = PlannerEvent.query.filter_by(user_id=g.current_user.id, id=event_id).first()
    if event is None:
        abort(404, message="Event not found")
    return event


def _commit_or_abort(message: str) -> None:
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        abort(500, message=message)


@blp.route("/events")
class PlannerEventsResource(MethodView):
    decorators = [jwt_required]
    @blp.response(200, PlannerEventResponseSchema(many=True))
    def get(self):
        """List planner events (optionally filter by date)"""

        query = PlannerEvent.query.filter_by(user_id=g.current_user.id).order_by(
            PlannerEvent.event_date.asc(), PlannerEvent.start_time.asc().nullsfirst()
        )
        date_str = request.args.get("date")
        if date_str:
            try:
                # Filter uses ISO date strings to keep client/simple URLs.
                filter_date = dt_date.fromisoformat(date_str)
                query = query.filter_by(event_date=filter_date)
            except ValueError:
                abort(400, message="Invalid date format; use YYYY-MM-DD")
        page = request.args.get("page", default=1, type=int)
        page_size = request.args.get("page_size", default=50, type=int)
        if page <= 0 or page_size <= 0 or page_size > 100:
            abort(400, message="Invalid pagination parameters")
        return query.limit(page_size).offset((page - 1) * page_size).all()

    @blp.arguments(PlannerEventCreateSchema)
    @blp.response(201, PlannerEventResponseSchema)
    def post(self, payload):
        """Create a planner event"""

        event = PlannerEvent()
        event.user_id = g.current_user.id
        event.title = payload.get("title")
        event.description = payload.get("description")
        event.event_date = payload.get("event_date")
        event.start_time = payload.get("start_time")
        event.end_time = payload.get("end_time")
        event.reminder_minutes_before = payload.get("reminder_minutes_before")

        db.session.add(event)
        _commit_or_abort("Could not create event")
        # Award streaks only on create to avoid double-counting updates.
        awarded = evaluate_planner(g.current_user.id)
        _commit_or_abort("Could not update planner streaks")
        setattr(event, "awarded", awarded)
        return event


@blp.route("/events/<int:event_id>")
class PlannerEventDetailResource(MethodView):
    decorators = [jwt_required]
    @blp.response(200, PlannerEventResponseSchema)
    def get(self, event_id):
        return _get_event_or_404(event_id)

    @blp.arguments(PlannerEventUpdateSchema)
    @blp.response(200, PlannerEventResponseSchema)
    def put(self, payload, event_id):
        event = _get_event_or_404(event_id)

        if "title" in payload:
            event.title = payload.get("title")
        if "description" in payload:
            event.description = payload.get("description")
        if "event_date" in payload:
            event.event_date = payload.get("event_date")
        if "start_time" in payload:
            event.start_time = payload.get("start_time")
        if "end_time" in payload:
            event.end_time = payload.get("end_time")
        if "reminder_minutes_before" in payload:
            event.reminder_minutes_before = payload.get("reminder_minutes_before")

        _commit_or_abort("Could not update event")
        return event

    @blp.response(204)
    def delete(self, event_id):
        deleted = (
            PlannerEvent.query.filter_by(user_id=g.current_user.id, id=event_id)
            .delete()
        )
        if not deleted:
            abort(404, message="Event not found")

        _commit_or_abort("Could not delete event")
        return "", 204
