"""
Marshmallow schemas — one file per model, owned by whoever owns that model:

    schemas/user_schema.py     -> Member 1
    schemas/parcel_schema.py   -> Member 2

A schema does two jobs:
  1. Validates incoming request data (schema.load(request.json))
  2. Serializes model instances into JSON-safe dicts (schema.dump(instance))

Use ma.SQLAlchemyAutoSchema as a base to avoid hand-writing every field:

    from app.extensions import ma
    from app.models.user import User

    class UserSchema(ma.SQLAlchemyAutoSchema):
        class Meta:
            model = User
            load_instance = True
            exclude = ("password_hash",)  # never serialize this back out

A schema.load() failure raises marshmallow.ValidationError automatically —
the global handler in app/errors.py already turns that into a clean 422
response, so routes don't need their own try/except around it.
"""
