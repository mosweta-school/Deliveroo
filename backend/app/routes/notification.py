from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models.notification import Notification

notification_bp = Blueprint("notification", __name__)


@notification_bp.get("/")
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()

    notifications = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return jsonify([
        {
            "id": notification.id,
            "parcel_id": notification.parcel_id,
            "message": notification.message,
            "notification_type": notification.notification_type,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat(),
        }
        for notification in notifications
    ]), 200
