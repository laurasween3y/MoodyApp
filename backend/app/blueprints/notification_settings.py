from flask import g
from flask.views import MethodView
from flask_smorest import Blueprint

from app.auth_utils import jwt_required
from app.extensions import db
from app.models import UserNotificationSettings
from app.schemas.notification_settings import UserNotificationSettingsSchema

blp = Blueprint(
    "notification_settings",
    __name__,
    url_prefix="/notification-settings",
    description="User notification settings",
)


def _get_or_create_settings(user_id: int) -> UserNotificationSettings:
    settings = UserNotificationSettings.query.filter_by(user_id=user_id).first()
    if settings:
        return settings
    settings = UserNotificationSettings()
    settings.user_id = user_id
    db.session.add(settings)
    db.session.commit()
    return settings


@blp.route("")
class NotificationSettingsResource(MethodView):
    decorators = [jwt_required]
    @blp.response(200, UserNotificationSettingsSchema)
    def get(self):
        return _get_or_create_settings(g.current_user.id)

    @blp.arguments(UserNotificationSettingsSchema)
    @blp.response(200, UserNotificationSettingsSchema)
    def put(self, data):
        settings = _get_or_create_settings(g.current_user.id)

        if "mood_reminder_enabled" in data:
            settings.mood_reminder_enabled = data["mood_reminder_enabled"]
        if "mood_reminder_time" in data:
            settings.mood_reminder_time = data["mood_reminder_time"]
        if "habit_reminder_enabled" in data:
            settings.habit_reminder_enabled = data["habit_reminder_enabled"]
        if "habit_reminder_time" in data:
            settings.habit_reminder_time = data["habit_reminder_time"]

        db.session.add(settings)
        db.session.commit()
        return settings
