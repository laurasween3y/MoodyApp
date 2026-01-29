from datetime import date

from marshmallow import Schema, fields, validate, validates, ValidationError

FREQUENCY_OPTIONS = ["daily", "weekly", "custom"]


class HabitCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=180))
    frequency = fields.Str(
        required=False,
        load_default="daily",
        validate=validate.OneOf(FREQUENCY_OPTIONS),
        metadata={"description": "daily, weekly, or custom"},
    )
    target_per_week = fields.Int(
        required=False,
        load_default=7,
        metadata={"description": "How many completions per week constitutes success"},
    )

    @validates("target_per_week")
    def validate_target(self, value, **kwargs):
        if value < 1 or value > 21:
            raise ValidationError("target_per_week must be between 1 and 21")


class HabitUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=180))
    frequency = fields.Str(validate=validate.OneOf(FREQUENCY_OPTIONS))
    target_per_week = fields.Int()

    @validates("target_per_week")
    def validate_target(self, value, **kwargs):
        if value is not None and (value < 1 or value > 21):
            raise ValidationError("target_per_week must be between 1 and 21")


class HabitResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str()
    frequency = fields.Str()
    target_per_week = fields.Int()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    completions = fields.Method("get_completions", dump_only=True)

    def get_completions(self, obj):
        return [c.date for c in sorted(obj.completions, key=lambda c: c.date)]


class HabitCompletionResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    habit_id = fields.Int()
    date = fields.Date()


class HabitListSchema(Schema):
    habits = fields.List(fields.Nested(HabitResponseSchema))


class HabitToggleSchema(Schema):
    date = fields.Date(
        required=False,
        load_default=date.today,
        metadata={"description": "Date to mark complete (defaults to today)"},
    )
