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


class MoodResponseSchema(Schema):
    """Response payload for a created mood entry."""

    mood = fields.Str(metadata={"description": "The submitted mood"})
    note = fields.Str(allow_none=True, metadata={"description": "Optional note about the mood"})
