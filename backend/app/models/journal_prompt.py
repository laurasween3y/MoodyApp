"""Static journal prompts grouped by category."""

from app.extensions import db


class JournalPrompt(db.Model):
    __tablename__ = "journal_prompts"

    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(64), nullable=False, index=True)
