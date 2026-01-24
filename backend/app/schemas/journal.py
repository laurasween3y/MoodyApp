from datetime import date

from marshmallow import Schema, fields


class JournalCreateSchema(Schema):
    title = fields.Str(required=True, metadata={"description": "Journal title"})
    description = fields.Str(required=False, allow_none=True)


class JournalUpdateSchema(Schema):
    title = fields.Str(required=False)
    description = fields.Str(required=False, allow_none=True)


class JournalResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str()
    description = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class JournalEntryCreateSchema(Schema):
    title = fields.Str(required=False, allow_none=True)
    content = fields.Str(required=True)
    entry_date = fields.Date(required=False, load_default=date.today)


class JournalEntryUpdateSchema(Schema):
    title = fields.Str(required=False, allow_none=True)
    content = fields.Str(required=False)
    entry_date = fields.Date(required=False)


class JournalEntryResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    journal_id = fields.Int()
    title = fields.Str(allow_none=True)
    content = fields.Str()
    entry_date = fields.Date()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

