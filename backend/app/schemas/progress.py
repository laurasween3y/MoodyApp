from marshmallow import Schema, fields


class StreakSummarySchema(Schema):
    mood_current = fields.Integer(required=True)
    mood_longest = fields.Integer(required=True)
    habit_current = fields.Integer(required=True)
    habit_longest = fields.Integer(required=True)
    journal_current = fields.Integer(required=True)
    journal_longest = fields.Integer(required=True)
    planner_current = fields.Integer(required=True)
    planner_longest = fields.Integer(required=True)


class AchievementItemSchema(Schema):
    module = fields.String(required=True)
    key = fields.String(required=True)
    title = fields.String(required=True)
    description = fields.String(required=True)
    icon = fields.String(required=True)
    locked = fields.Boolean(required=True)
    unlocked_at = fields.DateTime(allow_none=True)
    progress_current = fields.Integer(required=True)
    progress_target = fields.Integer(required=True)


class AchievementsResponseSchema(Schema):
    unlocked = fields.List(fields.Nested(AchievementItemSchema), required=True)
    all_possible = fields.List(fields.Nested(AchievementItemSchema), required=True)
