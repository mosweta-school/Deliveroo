# backend/app/routes/notification.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flasgger import swag_from
from app.services.notification_service import (
    get_user_notifications,
    get_unread_count,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    delete_notification,
    delete_all_notifications,
    get_notification_by_id
)
from app.extensions import db
from app.models.notification import Notification

notification_bp = Blueprint("notification", __name__)


@notification_bp.route("/", methods=["GET"])
@jwt_required()
def get_notifications():
    """
    Get notifications for the CURRENT user only.
    The user_id is taken from the JWT token, not from the request.
    """
    user_id = get_jwt_identity()  # Get user from token
    
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    unread_only = request.args.get("unread_only", "false").lower() == "true"
    
    # This automatically filters by the current user's ID
    notifications, total, pages = get_user_notifications(
        user_id=user_id,  # Only this user's notifications
        page=page,
        per_page=per_page,
        unread_only=unread_only
    )
    
    unread_count = get_unread_count(user_id)
    
    return jsonify({
        "success": True,
        "notifications": [n.to_dict() for n in notifications],
        "unread_count": unread_count,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages
        }
    }), 200


@notification_bp.route("/unread/count", methods=["GET"])
@jwt_required()
def get_unread_count_route():
    """Get unread count for the CURRENT user only"""
    user_id = get_jwt_identity()
    count = get_unread_count(user_id)
    
    return jsonify({
        "success": True,
        "unread_count": count
    }), 200


@notification_bp.route("/<notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_read(notification_id):
    """Mark notification as read - verifies ownership"""
    user_id = get_jwt_identity()
    
    notification, err = mark_notification_as_read(notification_id, user_id)
    if err:
        return jsonify({"error": err}), 404
    
    return jsonify({
        "success": True,
        "message": "Notification marked as read",
        "notification": notification.to_dict()
    }), 200


@notification_bp.route("/read/all", methods=["PATCH"])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read for the CURRENT user only"""
    user_id = get_jwt_identity()
    count = mark_all_notifications_as_read(user_id)
    
    return jsonify({
        "success": True,
        "message": f"{count} notifications marked as read",
        "count": count
    }), 200


@notification_bp.route("/<notification_id>", methods=["DELETE"])
@jwt_required()
def delete_notification_route(notification_id):
    """Delete notification - verifies ownership"""
    user_id = get_jwt_identity()
    
    notification, err = delete_notification(notification_id, user_id)
    if err:
        return jsonify({"error": err}), 404
    
    return jsonify({
        "success": True,
        "message": "Notification deleted successfully"
    }), 200


@notification_bp.route("/clear/all", methods=["DELETE"])
@jwt_required()
def clear_all_notifications():
    """Delete all notifications for the CURRENT user only"""
    user_id = get_jwt_identity()
    count = delete_all_notifications(user_id)
    
    return jsonify({
        "success": True,
        "message": f"{count} notifications cleared",
        "count": count
    }), 200