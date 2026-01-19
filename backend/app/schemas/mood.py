from marshmallow import Schema, fields


class MoodCreateSchema(Schema):
    mood = fields.Str(required=True, metadata={"description": "The current mood"})
    note = fields.Str(allow_none=True, metadata={"description": "Optional note about the mood"})


class MoodDBSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(required=True)
    mood = fields.Str(required=True)
    note = fields.Str(allow_none=True)
    date = fields.Date(dump_only=True)


class MoodResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    mood = fields.Str(metadata={"description": "The submitted mood"})
    note = fields.Str(allow_none=True, metadata={"description": "Optional note about the mood"})
    date = fields.Date(dump_only=True)
