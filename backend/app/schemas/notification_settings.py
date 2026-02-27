from marshmallow import Schema, fields


class UserNotificationSettingsSchema(Schema):
    id = fields.Int(dump_only=True)
    mood_reminder_enabled = fields.Boolean()
    mood_reminder_time = fields.Time(allow_none=True)
    habit_reminder_enabled = fields.Boolean()
    habit_reminder_time = fields.Time(allow_none=True)
