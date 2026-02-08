from datetime import date

from app.extensions import db


class Mood(db.Model):
    __tablename__ = "moods"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mood = db.Column(db.String(50), nullable=False)
    note = db.Column(db.Text)
    date = db.Column(db.Date, default=date.today, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "date", name="one_mood_per_day"),
    )
