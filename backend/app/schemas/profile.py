from marshmallow import Schema, fields


class ProfileSchema(Schema):
    id = fields.Integer(required=True)
    email = fields.Email(required=True)
    username = fields.String(required=True, allow_none=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(allow_none=True)


class ProfileUpdateSchema(Schema):
    email = fields.Email(load_default=None, allow_none=True)
    username = fields.String(load_default=None, allow_none=True)
    password = fields.String(load_default=None, allow_none=True)
