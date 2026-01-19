from marshmallow import Schema, fields


class MoodSchema(Schema):
    mood = fields.Str(
        required=True,
        metadata={"description": "The current mood"},
    )
    note = fields.Str(
        required=False,
        allow_none=True,
        metadata={"description": "Optional note about the mood"},
    )
