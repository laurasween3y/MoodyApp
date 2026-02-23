from datetime import date

from marshmallow import Schema, fields


class JournalCreateSchema(Schema):
    title = fields.Str(required=True, metadata={"description": "Journal title"})
    description = fields.Str(required=False, allow_none=True)
    cover_url = fields.Str(required=False, allow_none=True)


class JournalUpdateSchema(Schema):
    title = fields.Str(required=False)
    description = fields.Str(required=False, allow_none=True)
    cover_url = fields.Str(required=False, allow_none=True)


class JournalResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str()
    description = fields.Str(allow_none=True)
    cover_url = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class JournalEntryCreateSchema(Schema):
    title = fields.Str(required=False, allow_none=True)
    content_json = fields.Dict(required=True)
    background = fields.Str(required=False, load_default="lined")
    font_family = fields.Str(required=False, load_default="Inter")
    font_size = fields.Int(required=False, load_default=16)
    entry_date = fields.Date(required=False, load_default=date.today)


class JournalEntryUpdateSchema(Schema):
    title = fields.Str(required=False, allow_none=True)
    content_json = fields.Dict(required=False)
    background = fields.Str(required=False)
    font_family = fields.Str(required=False)
    font_size = fields.Int(required=False)
    entry_date = fields.Date(required=False)


class JournalEntryResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    journal_id = fields.Int()
    title = fields.Str(allow_none=True)
    content_json = fields.Dict()
    background = fields.Str()
    font_family = fields.Str()
    font_size = fields.Int()
    entry_date = fields.Date()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    awarded = fields.List(
        fields.Str(),
        dump_only=True,
        dump_default=[],
        metadata={"description": "Newly awarded achievement keys"},
    )
