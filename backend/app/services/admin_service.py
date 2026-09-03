# app/services/admin_service.py
from datetime import datetime
from app.extensions import db
from app.models.parcel import Parcel
from app.models.parcel_status_history import ParcelStatusHistory
from app.models.notification import Notification
from app.models.user import User
from app.models.location import Location
from app.services.email_service import send_email_notification


def update_parcel_status(parcel_id, admin_id, status_data):
    """Update parcel status (admin only)"""
    parcel = Parcel.query.get(parcel_id)
    if not parcel:
        return None, "Parcel not found"

    new_status = status_data.get("status")
    remarks = status_data.get("remarks", f"Status updated to {new_status}")

    # Validate status
    valid_statuses = ["Pending", "Picked Up", "In Transit", "Delivered", "Cancelled"]
    if new_status not in valid_statuses:
        return None, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"

    # Store old status for notification
    old_status = parcel.status
    parcel.status = new_status
    parcel.updated_at = datetime.utcnow()

    # Add status history
    status_history = ParcelStatusHistory(
        parcel_id=parcel.id,
        status=new_status,
        updated_by=admin_id,
        remarks=remarks
    )
    db.session.add(status_history)

    # Create notification for user
    notification = Notification(
        user_id=parcel.user_id,
        parcel_id=parcel.id,
        type="status_update",
        title=f"Parcel {parcel.tracking_number} Location Update",
        message=f"Your parcel {parcel.tracking_number} status changed from {old_status} to {new_status}",
        is_read=False
    )
    db.session.add(notification)

    db.session.commit()

    # Send email notification
    user = User.query.get(parcel.user_id)
    if user and user.email:
        send_email_notification(
            to_email=user.email,
            subject=f"Parcel {parcel.tracking_number} Status Update",
            body=f"Your parcel status has been updated from {old_status} to {new_status}.\n\n"
                 f"Tracking Number: {parcel.tracking_number}\n"
                 f"Remarks: {remarks}"
        )

    return parcel, None


def update_parcel_location(parcel_id, admin_id, location_data):
    """Update parcel current location (admin only)"""
    parcel = Parcel.query.get(parcel_id)
    if not parcel:
        return None, "Parcel not found"

    # Create new location for current position
    location = Location(
        address=location_data.get("address"),
        city=location_data.get("city"),
        county=location_data.get("county"),
        latitude=location_data.get("latitude"),
        longitude=location_data.get("longitude"),
    )
    db.session.add(location)
    db.session.flush()

    # Update parcel's current location
    # Note: You might want to add a `current_location_id` field to Parcel model
    # For now, we'll store it in the status history remarks
    parcel.updated_at = datetime.utcnow()

    # Add status history with location info
    status_history = ParcelStatusHistory(
        parcel_id=parcel.id,
        status=parcel.status,  # Keep current status
        updated_by=admin_id,
        remarks=f"Location updated to: {location_data.get('address', 'N/A')}, {location_data.get('city', 'N/A')}"
    )
    db.session.add(status_history)

    # Create notification for user
    notification = Notification(
        user_id=parcel.user_id,
        parcel_id=parcel.id,
        type="location_update",
        title=f"Parcel {parcel.tracking_number} Location Update",
        message=f"Your parcel {parcel.tracking_number} is now at {location_data.get('address', 'N/A')}",
        is_read=False
    )
    db.session.add(notification)

    db.session.commit()

    # Send email notification
    user = User.query.get(parcel.user_id)
    if user and user.email:
        send_email_notification(
            to_email=user.email,
            subject=f"Parcel {parcel.tracking_number} Location Update",
            body=f"Your parcel is now at:\n"
                 f"Address: {location_data.get('address', 'N/A')}\n"
                 f"City: {location_data.get('city', 'N/A')}\n"
                 f"County: {location_data.get('county', 'N/A')}\n\n"
                 f"Tracking Number: {parcel.tracking_number}"
        )

    return parcel, None


def get_admin_stats():
    """Get admin dashboard statistics"""
    total_orders = Parcel.query.count()
    active_deliveries = Parcel.query.filter(Parcel.status.in_(["Picked Up", "In Transit"])).count()
    delivered_today = Parcel.query.filter(
        Parcel.status == "Delivered",
        db.func.date(Parcel.updated_at) == db.func.current_date()
    ).count()
    pending = Parcel.query.filter_by(status="Pending").count()
    cancelled = Parcel.query.filter_by(status="Cancelled").count()

    return {
        "total_orders": total_orders,
        "active_deliveries": active_deliveries,
        "delivered_today": delivered_today,
        "pending": pending,
        "cancelled": cancelled,
        "total_users": User.query.count()
    }