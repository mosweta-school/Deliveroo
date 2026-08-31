# app/schemas/notification_schema.py
from marshmallow import Schema, fields


class NotificationSchema(Schema):
    id = fields.Str(dump_only=True)
    user_id = fields.Str(required=True)
    parcel_id = fields.Str(required=True)
    type = fields.Str(required=True)
    message = fields.Str(required=True)
    is_read = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)


class NotificationCreateSchema(Schema):
    user_id = fields.Str(required=True)
    parcel_id = fields.Str(required=True)
    type = fields.Str(required=True)
    message = fields.Str(required=True)


class NotificationUpdateSchema(Schema):
    is_read = fields.Bool(required=True)


# Create schema instances
notification_schema = NotificationSchema()
notifications_schema = NotificationSchema(many=True)
notification_create_schema = NotificationCreateSchema()
notification_update_schema = NotificationUpdateSchema()