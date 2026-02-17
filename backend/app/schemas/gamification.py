from marshmallow import Schema, fields


class StreakSchema(Schema):
    module = fields.String(required=True)
    current_streak = fields.Integer(required=True)
    longest_streak = fields.Integer(required=True)
    last_action_date = fields.Date(allow_none=True)


class AchievementSchema(Schema):
    module = fields.String(required=True)
    achievement_key = fields.String(required=True)
    unlocked_at = fields.DateTime(required=True)
