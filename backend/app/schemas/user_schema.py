from marshmallow import Schema, fields, validate

from extensions import ma
from models.user import User


class UserSchema(ma.SQLAlchemyAutoSchema):
    """Response schema — used to serialize a User back to the client.
    password_hash is excluded so it never leaves the server.
    """

    class Meta:
        model = User
        load_instance = False
        exclude = ("password_hash",)

    id = fields.String(dump_only=True)
    email = fields.Email(required=True)
    full_name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    role = fields.String(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class RegisterSchema(Schema):
    """Input schema for POST /auth/register.
    Role is intentionally NOT accepted here — every self-registration is a
    'customer'. Promoting someone to admin should be a separate, protected
    action (e.g. done directly in Supabase or via an admin-only endpoint),
    never something a client can set on themselves at signup.
    """

    full_name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True, validate=validate.Length(min=8))


class LoginSchema(Schema):
    """Input schema for POST /auth/login — email + password only."""

    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True)


user_schema = UserSchema()
users_schema = UserSchema(many=True)
register_schema = RegisterSchema()
login_schema = LoginSchema()
