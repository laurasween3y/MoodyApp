from flask import g, request, current_app
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from werkzeug.utils import secure_filename
import os

from app.extensions import db
from app.auth_utils import get_current_user
from app.models import Journal, JournalEntry
from app.schemas.journal import (
    JournalCreateSchema,
    JournalEntryCreateSchema,
    JournalEntryResponseSchema,
    JournalEntryUpdateSchema,
    JournalResponseSchema,
    JournalUpdateSchema,
)

blp = Blueprint(
    "journals",
    __name__,
    url_prefix="/journals",
    description="Create journals and write entries",
)


@blp.before_request
def require_auth():
    if request.method == "OPTIONS":
        return None
    g.current_user = get_current_user()


@blp.route("/")
class JournalsResource(MethodView):
    @blp.response(200, JournalResponseSchema(many=True))
    def get(self):
        """List journals for the current user."""
        journals = (
            Journal.query.filter_by(user_id=g.current_user.id)
            .order_by(Journal.created_at.desc())
            .all()
        )
        return journals

    @blp.arguments(JournalCreateSchema)
    @blp.response(201, JournalResponseSchema)
    def post(self, data):
        """Create a new journal."""
        journal = Journal()
        journal.user_id = g.current_user.id
        journal.title = data["title"].strip()
        journal.description = data.get("description")
        if "cover_url" in data:
            journal.cover_url = data.get("cover_url")

        # Prevent duplicates by title for the same user
        existing = Journal.query.filter_by(user_id=g.current_user.id, title=journal.title).first()
        if existing:
            abort(409, message="A journal with that title already exists")

        db.session.add(journal)
        db.session.commit()
        return journal


@blp.route("/<int:journal_id>")
class JournalDetailResource(MethodView):
    @blp.response(200, JournalResponseSchema)
    def get(self, journal_id):
        journal = Journal.query.filter_by(user_id=g.current_user.id, id=journal_id).first()
        if journal is None:
            abort(404, message="Journal not found")
        return journal

    @blp.arguments(JournalUpdateSchema)
    @blp.response(200, JournalResponseSchema)
    def patch(self, data, journal_id):
        journal = Journal.query.filter_by(user_id=g.current_user.id, id=journal_id).first()
        if journal is None:
            abort(404, message="Journal not found")

        if "title" in data and data["title"]:
            new_title = data["title"].strip()
            conflict = Journal.query.filter_by(user_id=g.current_user.id, title=new_title).first()
            if conflict and conflict.id != journal.id:
                abort(409, message="A journal with that title already exists")
            journal.title = new_title

        if "description" in data:
            journal.description = data.get("description")

        if "cover_url" in data:
            journal.cover_url = data.get("cover_url")

        db.session.commit()
        return journal

    @blp.response(204)
    def delete(self, journal_id):
        journal = Journal.query.filter_by(user_id=g.current_user.id, id=journal_id).first()
        if journal is None:
            abort(404, message="Journal not found")

        db.session.delete(journal)
        db.session.commit()
        return "", 204


@blp.route("/<int:journal_id>/cover")
class JournalCoverResource(MethodView):
    @blp.response(200, JournalResponseSchema)
    def post(self, journal_id):
        journal = Journal.query.filter_by(user_id=g.current_user.id, id=journal_id).first()
        if journal is None:
            abort(404, message="Journal not found")

        if "file" not in request.files:
            abort(400, message="No file provided")

        file = request.files["file"]
        if file.filename == "":
            abort(400, message="Empty filename")

        filename = secure_filename(file.filename or "cover")
        name, ext = os.path.splitext(filename)
        final_name = f"journal_{journal_id}_{g.current_user.id}{ext}"
        upload_path = os.path.join(current_app.config["UPLOAD_FOLDER"], final_name)
        file.save(upload_path)

        base_url = request.url_root.rstrip("/")
        journal.cover_url = f"{base_url}/uploads/{final_name}"
        db.session.commit()
        return journal


@blp.route("/<int:journal_id>/entries")
class JournalEntriesResource(MethodView):
    @blp.response(200, JournalEntryResponseSchema(many=True))
    def get(self, journal_id):
        journal = Journal.query.filter_by(user_id=g.current_user.id, id=journal_id).first()
        if journal is None:
            abort(404, message="Journal not found")

        entries = (
            JournalEntry.query.filter_by(user_id=g.current_user.id, journal_id=journal_id)
            .order_by(JournalEntry.entry_date.desc(), JournalEntry.created_at.desc())
            .all()
        )
        return entries

    @blp.arguments(JournalEntryCreateSchema)
    @blp.response(201, JournalEntryResponseSchema)
    def post(self, data, journal_id):
        journal = Journal.query.filter_by(user_id=g.current_user.id, id=journal_id).first()
        if journal is None:
            abort(404, message="Journal not found")

        entry = JournalEntry()
        entry.journal_id = journal.id
        entry.user_id = g.current_user.id
        entry.title = data.get("title")
        entry.content = data.get("content")
        entry.entry_date = data.get("entry_date")

        db.session.add(entry)
        db.session.commit()
        return entry


@blp.route("/<int:journal_id>/entries/<int:entry_id>")
class JournalEntryDetailResource(MethodView):
    @blp.response(200, JournalEntryResponseSchema)
    def get(self, journal_id, entry_id):
        entry = self._get_entry(journal_id, entry_id)
        return entry

    @blp.arguments(JournalEntryUpdateSchema)
    @blp.response(200, JournalEntryResponseSchema)
    def patch(self, data, journal_id, entry_id):
        entry = self._get_entry(journal_id, entry_id)

        if "title" in data:
            entry.title = data.get("title")
        if "content" in data and data.get("content"):
            entry.content = data.get("content")
        if "entry_date" in data:
            entry.entry_date = data.get("entry_date")

        db.session.commit()
        return entry

    @blp.response(204)
    def delete(self, journal_id, entry_id):
        entry = self._get_entry(journal_id, entry_id)
        db.session.delete(entry)
        db.session.commit()
        return "", 204

    def _get_entry(self, journal_id, entry_id):
        entry = JournalEntry.query.filter_by(
            user_id=g.current_user.id, journal_id=journal_id, id=entry_id
        ).first()
        if entry is None:
            abort(404, message="Entry not found")
        return entry
