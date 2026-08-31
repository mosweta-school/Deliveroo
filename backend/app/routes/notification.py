# app/routes/notification.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flasgger import swag_from
from app.services.notification_service import (
    get_user_notifications,
    get_unread_count,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    delete_notification,
    get_notification_by_id
)
from app.extensions import db
from app.models.notification import Notification

notification_bp = Blueprint("notification", __name__)


@notification_bp.route("/", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Notifications'],
    'summary': 'Get all notifications',
    'description': 'Get all notifications for the current user',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'page',
            'in': 'query',
            'type': 'integer',
            'default': 1,
            'description': 'Page number'
        },
        {
            'name': 'per_page',
            'in': 'query',
            'type': 'integer',
            'default': 20,
            'description': 'Items per page'
        },
        {
            'name': 'unread_only',
            'in': 'query',
            'type': 'boolean',
            'default': False,
            'description': 'Filter unread notifications only'
        }
    ],
    'responses': {
        200: {
            'description': 'Notifications retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'notifications': {'type': 'array'},
                    'pagination': {'type': 'object'}
                }
            }
        },
        401: {'description': 'Unauthorized'}
    }
})
def get_notifications():
    """Get all notifications for current user"""
    user_id = get_jwt_identity()
    
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    unread_only = request.args.get("unread_only", "false").lower() == "true"
    
    notifications, total, pages = get_user_notifications(
        user_id=user_id,
        page=page,
        per_page=per_page,
        unread_only=unread_only
    )
    
    return jsonify({
        "success": True,
        "notifications": [n.to_dict() for n in notifications],
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages
        }
    }), 200


@notification_bp.route("/unread/count", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Notifications'],
    'summary': 'Get unread notification count',
    'description': 'Get the count of unread notifications for the current user',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'Unread count retrieved',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'unread_count': {'type': 'integer'}
                }
            }
        },
        401: {'description': 'Unauthorized'}
    }
})
def get_unread_count_route():
    """Get count of unread notifications"""
    user_id = get_jwt_identity()
    count = get_unread_count(user_id)
    
    return jsonify({
        "success": True,
        "unread_count": count
    }), 200


@notification_bp.route("/<notification_id>/read", methods=["PATCH"])
@jwt_required()
@swag_from({
    'tags': ['Notifications'],
    'summary': 'Mark notification as read',
    'description': 'Mark a specific notification as read',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'notification_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Notification ID'
        }
    ],
    'responses': {
        200: {
            'description': 'Notification marked as read',
            'schema': {'type': 'object'}
        },
        401: {'description': 'Unauthorized'},
        404: {'description': 'Notification not found'}
    }
})
def mark_read(notification_id):
    """Mark a notification as read"""
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
@swag_from({
    'tags': ['Notifications'],
    'summary': 'Mark all notifications as read',
    'description': 'Mark all notifications as read for the current user',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'All notifications marked as read',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'count': {'type': 'integer'}
                }
            }
        },
        401: {'description': 'Unauthorized'}
    }
})
def mark_all_read():
    """Mark all notifications as read"""
    user_id = get_jwt_identity()
    count = mark_all_notifications_as_read(user_id)
    
    return jsonify({
        "success": True,
        "message": f"{count} notifications marked as read",
        "count": count
    }), 200


@notification_bp.route("/<notification_id>", methods=["DELETE"])
@jwt_required()
@swag_from({
    'tags': ['Notifications'],
    'summary': 'Delete a notification',
    'description': 'Delete a specific notification',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'notification_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Notification ID'
        }
    ],
    'responses': {
        200: {
            'description': 'Notification deleted successfully',
            'schema': {'type': 'object'}
        },
        401: {'description': 'Unauthorized'},
        404: {'description': 'Notification not found'}
    }
})
def delete_notification_route(notification_id):
    """Delete a notification"""
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
@swag_from({
    'tags': ['Notifications'],
    'summary': 'Delete all notifications',
    'description': 'Delete all notifications for the current user',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'All notifications deleted',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'count': {'type': 'integer'}
                }
            }
        },
        401: {'description': 'Unauthorized'}
    }
})
def clear_all_notifications():
    """Delete all notifications for current user"""
    user_id = get_jwt_identity()
    
    # Delete all notifications for this user
    notifications = Notification.query.filter_by(user_id=user_id).all()
    count = len(notifications)
    
    for notification in notifications:
        db.session.delete(notification)
    
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": f"{count} notifications cleared",
        "count": count
    }), 200