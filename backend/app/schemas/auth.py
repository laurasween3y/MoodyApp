from marshmallow import Schema, fields, validate, EXCLUDE


class RegisterSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))


class LoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.Str(required=True)


class RegisterResponseSchema(Schema):
    message = fields.Str(dump_only=True)


class LoginResponseSchema(Schema):
    access_token = fields.Str(dump_only=True)
