from datetime import datetime, date

from app.extensions import db


class Journal(db.Model):
    __tablename__ = "journals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    cover_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    entries = db.relationship(
        "JournalEntry",
        back_populates="journal",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "title", name="uq_journals_user_title"),
    )


class JournalEntry(db.Model):
    __tablename__ = "journal_entries"

    id = db.Column(db.Integer, primary_key=True)
    journal_id = db.Column(
        db.Integer, db.ForeignKey("journals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = db.Column(db.Integer, nullable=False, index=True)
    title = db.Column(db.String(200))
    # TipTap / ProseMirror JSON payload for the document
    content_json = db.Column(db.JSON, nullable=False, default=dict)
    # Presentation metadata (kept separate from content)
    background = db.Column(db.String(32), nullable=False, default="lined")
    font_family = db.Column(db.String(64), nullable=False, default="Inter")
    font_size = db.Column(db.Integer, nullable=False, default=16)
    entry_date = db.Column(db.Date, default=date.today, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    journal = db.relationship("Journal", back_populates="entries")

    __table_args__ = (
        db.Index("ix_journal_entries_user_journal_date", "user_id", "journal_id", "entry_date"),
    )
