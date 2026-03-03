"""Habit model + completion join table; tracks daily/weekly targets."""

from datetime import datetime, date

from app.extensions import db


class Habit(db.Model):
    __tablename__ = "habits"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(180), nullable=False)
    frequency = db.Column(db.String(32), nullable=False, default="daily")
    target_per_week = db.Column(db.Integer, nullable=False, default=7)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    completions = db.relationship(
        "HabitCompletion",
        back_populates="habit",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="HabitCompletion.date",
    )

    __table_args__ = (
        db.Index("ix_habits_user_title", "user_id", "title"),
    )


class HabitCompletion(db.Model):
    __tablename__ = "habit_completions"

    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(
        db.Integer,
        db.ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, default=date.today)

    habit = db.relationship("Habit", back_populates="completions")

    __table_args__ = (
        db.UniqueConstraint("habit_id", "user_id", "date", name="uq_habit_completion_per_user_day"),
    )
