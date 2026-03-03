"""Per-user notification settings (times + toggles for reminders)."""

from app.extensions import db


class UserNotificationSettings(db.Model):
    __tablename__ = "user_notification_settings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    mood_reminder_enabled = db.Column(db.Boolean, nullable=False, default=False)
    mood_reminder_time = db.Column(db.Time, nullable=True)
    habit_reminder_enabled = db.Column(db.Boolean, nullable=False, default=False)
    habit_reminder_time = db.Column(db.Time, nullable=True)
