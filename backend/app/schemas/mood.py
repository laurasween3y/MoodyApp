from datetime import date

from marshmallow import Schema, fields, validate


MOOD_OPTIONS = [
    "happy",
    "sad",
    "angry",
    "excited",
    "sick",
    "tired",
    "loved",
    "anxious",
    "peaceful",
    "bored",
    "silly",
    "fine",
]


class MoodCreateSchema(Schema):
    mood = fields.Str(
        required=True,
        validate=validate.OneOf(MOOD_OPTIONS),
        metadata={"description": "The current mood (predefined options)"},
    )
    note = fields.Str(allow_none=True, metadata={"description": "Optional note about the mood"})
    date = fields.Date(
        required=False,
        load_default=date.today,
        metadata={"description": "The calendar date for the mood (defaults to today)"},
    )


class MoodUpdateSchema(Schema):
    mood = fields.Str(
        required=False,
        validate=validate.OneOf(MOOD_OPTIONS),
        metadata={"description": "The current mood (predefined options)"},
    )
    note = fields.Str(allow_none=True, required=False, metadata={"description": "Optional note"})
    date = fields.Date(required=False, metadata={"description": "The calendar date for the mood"})


class MoodResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    mood = fields.Str(metadata={"description": "The submitted mood"})
    note = fields.Str(allow_none=True, metadata={"description": "Optional note about the mood"})
    date = fields.Date(dump_only=True)
    awarded = fields.List(
        fields.Str(),
        dump_only=True,
        dump_default=[],
        metadata={"description": "Newly awarded achievement keys"},
    )


class MoodOptionsSchema(Schema):
    options = fields.List(
        fields.Str(validate=validate.OneOf(MOOD_OPTIONS)),
        dump_only=True,
        metadata={"description": "Available mood keys"},
    )
