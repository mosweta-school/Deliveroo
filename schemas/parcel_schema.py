from marshmallow import Schema, fields, validates, ValidationError


WEIGHT_CATEGORIES = ["Light", "Medium", "Heavy"]


class LocationSchema(Schema):
    id = fields.Str(dump_only=True)
    address = fields.Str(required=True)
    latitude = fields.Float(required=False, allow_none=True)
    longitude = fields.Float(required=False, allow_none=True)


class ParcelCreateSchema(Schema):
    id = fields.Str(dump_only=True)
    user_id = fields.Str(required=True)
    tracking_number = fields.Str(dump_only=True)
    pickup_location = fields.Nested(LocationSchema, required=True)
    destination = fields.Nested(LocationSchema, required=True)
    weight = fields.Float(required=True)
    weight_category = fields.Str(required=True)
    status = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)

    @validates("weight_category")
    def validate_weight_category(self, value, **kwargs):
        if value not in WEIGHT_CATEGORIES:
            raise ValidationError(
                f"Invalid weight category. Must be one of: {WEIGHT_CATEGORIES}"
            )


class ParcelResponseSchema(Schema):
    id = fields.Str(dump_only=True)
    user_id = fields.Str(required=True)
    tracking_number = fields.Str(dump_only=True)
    pickup_location = fields.Nested(LocationSchema, required=True)
    destination = fields.Nested(LocationSchema, required=True)
    weight = fields.Float(required=True)
    weight_category = fields.Str(required=True)
    status = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates("weight_category")
    def validate_weight_category(self, value, **kwargs):
        if value not in WEIGHT_CATEGORIES:
            raise ValidationError(
                f"Invalid weight category. Must be one of: {WEIGHT_CATEGORIES}"
            )