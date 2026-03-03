"""Schemas for planner events (create/update) used by planner blueprint."""

from datetime import date, time

from marshmallow import Schema, fields, validate, validates_schema, ValidationError, pre_load


class PlannerEventCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True, load_default=None)
    event_date = fields.Date(required=False, load_default=date.today, metadata={"description": "Date of the event"})
    start_time = fields.Time(allow_none=True, load_default=None, metadata={"description": "Start time (HH:MM)"})
    end_time = fields.Time(allow_none=True, load_default=None, metadata={"description": "End time (HH:MM)"})
    reminder_minutes_before = fields.Int(allow_none=True, load_default=None, metadata={"description": "Minutes before event to remind"})

    @pre_load
    def normalize(self, data, **kwargs):
        # Convert empty strings to None so validation passes for optional fields
        for key in ["start_time", "end_time", "reminder_minutes_before", "description"]:
            if data.get(key) == "":
                data[key] = None
        # Coerce reminder to int when sent as a numeric string
        if isinstance(data.get("reminder_minutes_before"), str):
            try:
                data["reminder_minutes_before"] = int(data["reminder_minutes_before"])
            except ValueError:
                pass
        return data

    @validates_schema
    def validate_times(self, data, **kwargs):
        start = data.get("start_time")
        end = data.get("end_time")
        if start and end and end < start:
            raise ValidationError("end_time must be after start_time", field_name="end_time")


class PlannerEventUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    event_date = fields.Date(metadata={"description": "Date of the event"})
    start_time = fields.Time(allow_none=True, metadata={"description": "Start time (HH:MM)"})
    end_time = fields.Time(allow_none=True, metadata={"description": "End time (HH:MM)"})
    reminder_minutes_before = fields.Int(allow_none=True)

    @pre_load
    def normalize(self, data, **kwargs):
        for key in ["start_time", "end_time", "reminder_minutes_before", "description"]:
            if data.get(key) == "":
                data[key] = None
        if isinstance(data.get("reminder_minutes_before"), str):
            try:
                data["reminder_minutes_before"] = int(data["reminder_minutes_before"])
            except ValueError:
                pass
        return data

    @validates_schema
    def validate_times(self, data, **kwargs):
        start = data.get("start_time")
        end = data.get("end_time")
        if start and end and end < start:
            raise ValidationError("end_time must be after start_time", field_name="end_time")


class PlannerEventResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str()
    description = fields.Str(allow_none=True)
    event_date = fields.Date()
    start_time = fields.Time(allow_none=True)
    end_time = fields.Time(allow_none=True)
    reminder_minutes_before = fields.Int(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    awarded = fields.List(
        fields.Str(),
        dump_only=True,
        dump_default=[],
        metadata={"description": "Newly awarded achievement keys"},
    )


class PlannerEventListSchema(Schema):
    events = fields.List(fields.Nested(PlannerEventResponseSchema))
