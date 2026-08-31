# app/services/notification_service.py
from datetime import datetime
from app.extensions import db
from app.models.notification import Notification
from app.models.parcel import Parcel
from app.models.user import User


def create_notification(user_id, parcel_id, notification_type, message):
    """Create a new notification for a user"""
    notification = Notification(
        user_id=user_id,
        parcel_id=parcel_id,
        type=notification_type,
        message=message,
        is_read=False
    )
    db.session.add(notification)
    db.session.commit()
    return notification


def get_user_notifications(user_id, page=1, per_page=20, unread_only=False):
    """Get all notifications for a user with pagination"""
    query = Notification.query.filter_by(user_id=user_id)
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    query = query.order_by(Notification.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return paginated.items, paginated.total, paginated.pages


def get_unread_count(user_id):
    """Get count of unread notifications for a user"""
    return Notification.query.filter_by(user_id=user_id, is_read=False).count()


def mark_notification_as_read(notification_id, user_id):
    """Mark a notification as read"""
    notification = Notification.query.get(notification_id)
    if not notification:
        return None, "Notification not found"
    
    if notification.user_id != user_id:
        return None, "Unauthorized: Not your notification"
    
    notification.is_read = True
    db.session.commit()
    return notification, None


def mark_all_notifications_as_read(user_id):
    """Mark all notifications for a user as read"""
    notifications = Notification.query.filter_by(user_id=user_id, is_read=False).all()
    count = len(notifications)
    for notification in notifications:
        notification.is_read = True
    db.session.commit()
    return count


def delete_notification(notification_id, user_id):
    """Delete a notification"""
    notification = Notification.query.get(notification_id)
    if not notification:
        return None, "Notification not found"
    
    if notification.user_id != user_id:
        return None, "Unauthorized: Not your notification"
    
    db.session.delete(notification)
    db.session.commit()
    return notification, None


def get_notification_by_id(notification_id):
    """Get notification by ID"""
    notification = Notification.query.get(notification_id)
    if not notification:
        return None, "Notification not found"
    return notification, None


def create_status_update_notification(parcel_id, old_status, new_status):
    """Create notification for status update"""
    parcel = Parcel.query.get(parcel_id)
    if not parcel:
        return None, "Parcel not found"
    
    message = f"Your parcel {parcel.tracking_number} status changed from {old_status} to {new_status}"
    
    return create_notification(
        user_id=parcel.user_id,
        parcel_id=parcel_id,
        notification_type="status_update",
        message=message
    ), None


def create_location_update_notification(parcel_id, location_data):
    """Create notification for location update"""
    parcel = Parcel.query.get(parcel_id)
    if not parcel:
        return None, "Parcel not found"
    
    address = location_data.get("address", "N/A")
    city = location_data.get("city", "N/A")
    message = f"Your parcel {parcel.tracking_number} is now at {address}, {city}"
    
    return create_notification(
        user_id=parcel.user_id,
        parcel_id=parcel_id,
        notification_type="location_update",
        message=message
    ), None