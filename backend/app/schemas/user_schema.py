# app/schemas/user_schema.py - Simpler version
from app.extensions import ma
from app.models.user import User
from marshmallow import fields, validate, ValidationError, validates_schema


class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        # Don't use load_instance - we'll create the user manually
        load_instance = False
        exclude = ('password_hash',)
    
    # Add validation for registration
    password = fields.Str(required=True, validate=validate.Length(min=6))
    confirm_password = fields.Str(required=True)
    
    full_name = fields.Method("get_full_name", dump_only=True)
    
    def get_full_name(self, obj):
        return obj.full_name if hasattr(obj, 'full_name') else f"{obj.first_name} {obj.last_name}"
    
    # Validate that password and confirm_password match
    @validates_schema
    def validate_passwords(self, data, **kwargs):
        if data.get('password') != data.get('confirm_password'):
            raise ValidationError("Passwords do not match")
        return data

# Create schema instances
user_schema = UserSchema()
users_schema = UserSchema(many=True)
