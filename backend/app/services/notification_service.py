# backend/app/services/notification_service.py
from datetime import datetime
from app.extensions import db, socketio
from app.models.notification import Notification
from app.models.parcel import Parcel
from app.models.user import User
from app.services.email_service import send_email_notification
import uuid
import logging

logger = logging.getLogger(__name__)


def create_notification(user_id, parcel_id, notification_type, title, message, data=None):
    """Create a new notification for a specific user"""
    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        parcel_id=parcel_id,
        type=notification_type,
        title=title,
        message=message,
        data=data or {},
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.session.add(notification)
    db.session.commit()
    
    # Send real-time notification via socket to the specific user
    try:
        socketio.emit('new_notification', {
            'id': notification.id,
            'title': notification.title,
            'message': notification.message,
            'type': notification.type,
            'parcel_id': notification.parcel_id,
            'created_at': notification.created_at.isoformat(),
            'data': notification.data
        }, room=f'user_{user_id}')
    except Exception as e:
        logger.error(f"Failed to send socket notification: {str(e)}")
    
    return notification


def get_user_notifications(user_id, page=1, per_page=20, unread_only=False):
    """Get notifications ONLY for a specific user"""
    query = Notification.query.filter_by(user_id=user_id)
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    query = query.order_by(Notification.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return paginated.items, paginated.total, paginated.pages


def get_unread_count(user_id):
    """Get count of unread notifications for a specific user"""
    return Notification.query.filter_by(user_id=user_id, is_read=False).count()


def mark_notification_as_read(notification_id, user_id):
    """Mark a notification as read - verify ownership"""
    notification = Notification.query.get(notification_id)
    if not notification:
        return None, "Notification not found"
    
    # --- IMPORTANT: Verify the notification belongs to this user ---
    if notification.user_id != user_id:
        return None, "Unauthorized: Not your notification"
    
    notification.is_read = True
    db.session.commit()
    return notification, None


def mark_all_notifications_as_read(user_id):
    """Mark all notifications for a specific user as read"""
    notifications = Notification.query.filter_by(user_id=user_id, is_read=False).all()
    count = len(notifications)
    for notification in notifications:
        notification.is_read = True
    db.session.commit()
    return count


def delete_notification(notification_id, user_id):
    """Delete a notification - verify ownership"""
    notification = Notification.query.get(notification_id)
    if not notification:
        return None, "Notification not found"
    
    # --- IMPORTANT: Verify the notification belongs to this user ---
    if notification.user_id != user_id:
        return None, "Unauthorized: Not your notification"
    
    db.session.delete(notification)
    db.session.commit()
    return notification, None


def delete_all_notifications(user_id):
    """Delete all notifications for a specific user"""
    notifications = Notification.query.filter_by(user_id=user_id).all()
    count = len(notifications)
    for notification in notifications:
        db.session.delete(notification)
    db.session.commit()
    return count


def get_notification_by_id(notification_id, user_id):
    """Get notification by ID - verify ownership"""
    notification = Notification.query.get(notification_id)
    if not notification:
        return None, "Notification not found"
    
    # --- IMPORTANT: Verify the notification belongs to this user ---
    if notification.user_id != user_id:
        return None, "Unauthorized: Not your notification"
    
    return notification, None


# ============ SPECIFIC NOTIFICATION TYPES ============

def notify_parcel_created(user_id, parcel):
    """Notify the parcel creator when parcel is created"""
    title = "Parcel Order Created"
    message = f"Your parcel {parcel.tracking_number} has been created and is pending pickup."
    notification = create_notification(
        user_id=user_id,  # Only the parcel owner gets this
        parcel_id=parcel.id,
        notification_type='parcel_created',
        title=title,
        message=message,
        data={'tracking_number': parcel.tracking_number, 'status': parcel.status}
    )
    
    # Send email to the parcel owner only
    user = User.query.get(user_id)
    if user and user.email:
        send_email_notification(
            to_email=user.email,
            subject=f"Parcel Order Created - {parcel.tracking_number}",
            body=f"""
Hi {user.full_name},

Your parcel order has been created successfully!

Tracking Number: {parcel.tracking_number}
Pickup: {parcel.pickup_location.address if parcel.pickup_location else 'N/A'}
Destination: {parcel.destination.address if parcel.destination else 'N/A'}
Weight: {parcel.weight}kg
Status: {parcel.status}

You can track your parcel at: http://localhost:5173/track/{parcel.tracking_number}

Best regards,
Deliveroo Team
"""
        )
    
    return notification


def notify_rider_assigned(parcel, rider):
    """Notify the rider when assigned to a parcel"""
    title = "New Delivery Assignment"
    message = f"You have been assigned to deliver parcel {parcel.tracking_number}."
    notification = create_notification(
        user_id=rider.id,  # Only the assigned rider gets this
        parcel_id=parcel.id,
        notification_type='rider_assigned',
        title=title,
        message=message,
        data={
            'tracking_number': parcel.tracking_number,
            'pickup': parcel.pickup_location.address if parcel.pickup_location else 'N/A',
            'destination': parcel.destination.address if parcel.destination else 'N/A'
        }
    )
    
    # Send email to the rider only
    if rider.email:
        send_email_notification(
            to_email=rider.email,
            subject=f"New Delivery Assignment - {parcel.tracking_number}",
            body=f"""
Hi {rider.full_name},

You have been assigned a new delivery!

Tracking Number: {parcel.tracking_number}
Pickup: {parcel.pickup_location.address if parcel.pickup_location else 'N/A'}
Destination: {parcel.destination.address if parcel.destination else 'N/A'}
Weight: {parcel.weight}kg

Please log in to your dashboard to view details.

Best regards,
Deliveroo Team
"""
        )
    
    return notification


def notify_parcel_picked_up(parcel):
    """Notify the parcel owner when parcel is picked up"""
    title = "Parcel Picked Up"
    message = f"Your parcel {parcel.tracking_number} has been picked up and is on its way!"
    notification = create_notification(
        user_id=parcel.user_id,  # Only the parcel owner gets this
        parcel_id=parcel.id,
        notification_type='parcel_picked_up',
        title=title,
        message=message,
        data={'tracking_number': parcel.tracking_number, 'status': parcel.status}
    )
    
    # Send email to the parcel owner
    user = User.query.get(parcel.user_id)
    if user and user.email:
        send_email_notification(
            to_email=user.email,
            subject=f"Parcel Picked Up - {parcel.tracking_number}",
            body=f"""
Hi {user.full_name},

Great news! Your parcel has been picked up by the rider.

Tracking Number: {parcel.tracking_number}
Status: Picked Up

Track your parcel: http://localhost:5173/track/{parcel.tracking_number}

Best regards,
Deliveroo Team
"""
        )
    
    return notification


def notify_parcel_in_transit(parcel):
    """Notify the parcel owner when parcel is in transit"""
    title = "Parcel In Transit"
    message = f"Your parcel {parcel.tracking_number} is now in transit to the destination."
    notification = create_notification(
        user_id=parcel.user_id,
        parcel_id=parcel.id,
        notification_type='parcel_in_transit',
        title=title,
        message=message,
        data={'tracking_number': parcel.tracking_number, 'status': parcel.status}
    )
    
    user = User.query.get(parcel.user_id)
    if user and user.email:
        send_email_notification(
            to_email=user.email,
            subject=f"Parcel In Transit - {parcel.tracking_number}",
            body=f"""
Hi {user.full_name},

Your parcel is now in transit!

Tracking Number: {parcel.tracking_number}
Status: In Transit

Track your parcel: http://localhost:5173/track/{parcel.tracking_number}

Best regards,
Deliveroo Team
"""
        )
    
    return notification


def notify_parcel_delivered(parcel):
    """Notify the parcel owner when parcel is delivered"""
    title = "Parcel Delivered Successfully!"
    message = f"Your parcel {parcel.tracking_number} has been delivered successfully."
    notification = create_notification(
        user_id=parcel.user_id,
        parcel_id=parcel.id,
        notification_type='parcel_delivered',
        title=title,
        message=message,
        data={'tracking_number': parcel.tracking_number, 'status': parcel.status}
    )
    
    user = User.query.get(parcel.user_id)
    if user and user.email:
        send_email_notification(
            to_email=user.email,
            subject=f"Parcel Delivered - {parcel.tracking_number}",
            body=f"""
Hi {user.full_name},

Your parcel has been delivered successfully!

Tracking Number: {parcel.tracking_number}
Status: Delivered
Delivered At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}

Thank you for using Deliveroo!

Best regards,
Deliveroo Team
"""
        )
    
    return notification


def notify_parcel_cancelled(parcel):
    """Notify the parcel owner when parcel is cancelled"""
    title = "Parcel Cancelled"
    message = f"Your parcel {parcel.tracking_number} has been cancelled."
    notification = create_notification(
        user_id=parcel.user_id,
        parcel_id=parcel.id,
        notification_type='parcel_cancelled',
        title=title,
        message=message,
        data={'tracking_number': parcel.tracking_number, 'status': parcel.status}
    )
    
    user = User.query.get(parcel.user_id)
    if user and user.email:
        send_email_notification(
            to_email=user.email,
            subject=f"Parcel Cancelled - {parcel.tracking_number}",
            body=f"""
Hi {user.full_name},

Your parcel has been cancelled.

Tracking Number: {parcel.tracking_number}
Status: Cancelled

If you have any questions, please contact our support team.

Best regards,
Deliveroo Team
"""
        )
    
    return notification


def notify_destination_updated(parcel, old_destination, new_destination):
    """Notify the parcel owner when destination is updated"""
    title = "Delivery Destination Updated"
    message = f"The destination for parcel {parcel.tracking_number} has been updated."
    notification = create_notification(
        user_id=parcel.user_id,
        parcel_id=parcel.id,
        notification_type='destination_updated',
        title=title,
        message=message,
        data={
            'tracking_number': parcel.tracking_number,
            'old_destination': old_destination,
            'new_destination': new_destination
        }
    )
    
    user = User.query.get(parcel.user_id)
    if user and user.email:
        send_email_notification(
            to_email=user.email,
            subject=f"Delivery Destination Updated - {parcel.tracking_number}",
            body=f"""
Hi {user.full_name},

The delivery destination for your parcel has been updated.

Tracking Number: {parcel.tracking_number}
Previous Destination: {old_destination}
New Destination: {new_destination}

Track your parcel: http://localhost:5173/track/{parcel.tracking_number}

Best regards,
Deliveroo Team
"""
        )
    
    return notification


# ============ ADMIN NOTIFICATIONS ============

def notify_admins_parcel_created(parcel):
    """Notify ALL admins when a new parcel is created"""
    title = "New Parcel Order"
    message = f"New parcel {parcel.tracking_number} has been created by {parcel.user.full_name}"
    
    # Get all admin users
    admins = User.query.filter_by(role='admin').all()
    
    for admin in admins:
        # Send to each admin individually
        create_notification(
            user_id=admin.id,  # Each admin gets their own notification
            parcel_id=parcel.id,
            notification_type='admin_alert',
            title=title,
            message=message,
            data={
                'tracking_number': parcel.tracking_number,
                'customer': parcel.user.full_name,
                'pickup': parcel.pickup_location.address if parcel.pickup_location else 'N/A',
                'destination': parcel.destination.address if parcel.destination else 'N/A'
            }
        )
    
    # Send email to admins
    admin_emails = [admin.email for admin in admins if admin.email]
    if admin_emails:
        for email in admin_emails:
            send_email_notification(
                to_email=email,
                subject=f"New Parcel Order - {parcel.tracking_number}",
                body=f"""
A new parcel order has been created.

Tracking Number: {parcel.tracking_number}
Customer: {parcel.user.full_name}
Pickup: {parcel.pickup_location.address if parcel.pickup_location else 'N/A'}
Destination: {parcel.destination.address if parcel.destination else 'N/A'}
Weight: {parcel.weight}kg

Please log in to the admin dashboard to manage this order.

Best regards,
Deliveroo System
"""
            )


def notify_admins_rider_status_change(rider, old_status, new_status):
    """Notify ALL admins when a rider changes status"""
    title = "Rider Status Changed"
    message = f"Rider {rider.full_name} changed status from {old_status} to {new_status}"
    
    admins = User.query.filter_by(role='admin').all()
    for admin in admins:
        create_notification(
            user_id=admin.id,
            parcel_id=None,
            notification_type='admin_alert',
            title=title,
            message=message,
            data={
                'rider_id': rider.id,
                'rider_name': rider.full_name,
                'old_status': old_status,
                'new_status': new_status
            }
        )


def notify_rider_status_update(rider, status):
    """Notify the rider when their status changes"""
    title = "Status Updated"
    message = f"Your status has been updated to: {status}"
    create_notification(
        user_id=rider.id,  # Only the rider gets this
        parcel_id=None,
        notification_type='rider_status_update',
        title=title,
        message=message,
        data={'status': status}
    )