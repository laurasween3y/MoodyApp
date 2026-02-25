from marshmallow import Schema, fields


class JournalPromptSchema(Schema):
    id = fields.Int(dump_only=True)
    text = fields.Str()
    category = fields.Str()
