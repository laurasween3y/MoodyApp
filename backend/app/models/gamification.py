"""Streaks and achievements tracked per user/module (mood/habit/etc)."""

from datetime import date, datetime

from app.extensions import db


class Streak(db.Model):
    __tablename__ = "streaks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    module = db.Column(db.String(32), nullable=False)  # mood | habit | journal | planner
    current_streak = db.Column(db.Integer, nullable=False, default=0)
    longest_streak = db.Column(db.Integer, nullable=False, default=0)
    last_action_date = db.Column(db.Date, nullable=True)

    # One streak row per module per user (keeps streak math consistent).
    __table_args__ = (db.UniqueConstraint("user_id", "module", name="uq_streak_user_module"),)


class Achievement(db.Model):
    __tablename__ = "achievements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    module = db.Column(db.String(32), nullable=False)
    achievement_key = db.Column(db.String(64), nullable=False)
    # Use UTC timestamps so unlock ordering is consistent across timezones.
    unlocked_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Prevent duplicate awards of the same achievement.
    __table_args__ = (db.UniqueConstraint("user_id", "achievement_key", name="uq_achievement_user_key"),)
