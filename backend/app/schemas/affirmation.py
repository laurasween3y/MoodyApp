from marshmallow import Schema, fields


class AffirmationResponseSchema(Schema):
    affirmation = fields.Str(required=True)
