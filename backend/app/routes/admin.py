# app/routes/admin.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from flasgger import swag_from
from app.extensions import db 
from app.services.admin_service import (
    update_parcel_status, 
    update_parcel_location, 
    get_admin_stats
)
from app.models.user import User
from app.models.parcel import Parcel
from app.models.parcel_status_history import ParcelStatusHistory
from datetime import datetime

admin_bp = Blueprint("admin", __name__)


def is_admin():
    """Check if current user is admin"""
    claims = get_jwt()
    return claims.get('role') == 'admin'


@admin_bp.route("/parcels/<parcel_id>/status", methods=["PUT"])
@jwt_required()
@swag_from({
    'tags': ['Admin'],
    'summary': 'Update parcel status',
    'description': 'Update the status of a parcel (Admin only)',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'parcel_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Parcel ID'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {
                        'type': 'string',
                        'enum': ['Pending', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'],
                        'example': 'In Transit'
                    },
                    'remarks': {'type': 'string', 'example': 'Parcel has been picked up'}
                },
                'required': ['status']
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Status updated successfully',
            'schema': {'type': 'object'}
        },
        403: {'description': 'Admin access required'},
        404: {'description': 'Parcel not found'}
    }
})
def update_status(parcel_id):
    """Update parcel status (Admin only)"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    admin_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or "status" not in data:
        return jsonify({"error": "Status is required"}), 400

    parcel, err = update_parcel_status(parcel_id, admin_id, data)

    if err:
        return jsonify({"error": err}), 400

    return jsonify({
        "success": True,
        "message": "Status updated successfully",
        "parcel": {
            "id": parcel.id,
            "tracking_number": parcel.tracking_number,
            "status": parcel.status
        }
    }), 200


@admin_bp.route("/parcels/<parcel_id>/location", methods=["PUT"])
@jwt_required()
@swag_from({
    'tags': ['Admin'],
    'summary': 'Update parcel location',
    'description': 'Update the current location of a parcel (Admin only)',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'parcel_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Parcel ID'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'address': {'type': 'string', 'example': 'Nakuru'},
                    'city': {'type': 'string', 'example': 'Nakuru'},
                    'county': {'type': 'string', 'example': 'Nakuru'},
                    'latitude': {'type': 'number', 'example': -0.3031},
                    'longitude': {'type': 'number', 'example': 36.0800}
                },
                'required': ['address', 'city']
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Location updated successfully',
            'schema': {'type': 'object'}
        },
        403: {'description': 'Admin access required'},
        404: {'description': 'Parcel not found'}
    }
})
def update_location(parcel_id):
    """Update parcel location (Admin only)"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    admin_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or "address" not in data:
        return jsonify({"error": "Address is required"}), 400

    parcel, err = update_parcel_location(parcel_id, admin_id, data)

    if err:
        return jsonify({"error": err}), 400

    return jsonify({
        "success": True,
        "message": "Location updated successfully",
        "parcel": {
            "id": parcel.id,
            "tracking_number": parcel.tracking_number,
            "location": {
                "address": data.get("address"),
                "city": data.get("city"),
                "county": data.get("county")
            }
        }
    }), 200


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Admin'],
    'summary': 'Get admin dashboard statistics',
    'description': 'Get statistics for the admin dashboard (Admin only)',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'Statistics retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'stats': {
                        'type': 'object',
                        'properties': {
                            'total_orders': {'type': 'integer'},
                            'active_deliveries': {'type': 'integer'},
                            'delivered_today': {'type': 'integer'},
                            'pending': {'type': 'integer'},
                            'cancelled': {'type': 'integer'},
                            'total_users': {'type': 'integer'}
                        }
                    }
                }
            }
        },
        403: {'description': 'Admin access required'}
    }
})
def get_stats():
    """Get admin dashboard statistics"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    stats = get_admin_stats()
    return jsonify({
        "success": True,
        "stats": stats
    }), 200


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Admin'],
    'summary': 'Get all users',
    'description': 'Get a list of all registered users (Admin only)',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'Users retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'users': {'type': 'array'}
                }
            }
        },
        403: {'description': 'Admin access required'}
    }
})
def get_users():
    """Get all users (Admin only)"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    users = User.query.all()
    return jsonify({
        "success": True,
        "users": [user.to_dict() for user in users]
    }), 200


@admin_bp.route("/parcels", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Admin'],
    'summary': 'Get all parcels',
    'description': 'Get a list of all parcels with pagination (Admin only)',
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
        }
    ],
    'responses': {
        200: {
            'description': 'Parcels retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'parcels': {'type': 'array'},
                    'total': {'type': 'integer'},
                    'page': {'type': 'integer'},
                    'per_page': {'type': 'integer'},
                    'pages': {'type': 'integer'}
                }
            }
        },
        403: {'description': 'Admin access required'}
    }
})
def get_all_parcels():
    """Get all parcels (Admin only)"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    
    paginated = Parcel.query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        "success": True,
        "parcels": [parcel.to_dict() for parcel in paginated.items],
        "total": paginated.total,
        "page": page,
        "per_page": per_page,
        "pages": paginated.pages
    }), 200


# NEW: Activities endpoint - Fixed with current_app
@admin_bp.route("/activities", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Admin'],
    'summary': 'Get recent activities',
    'description': 'Get a list of recent parcel status change activities (Admin only)',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'limit',
            'in': 'query',
            'type': 'integer',
            'default': 10,
            'description': 'Number of activities to return'
        }
    ],
    'responses': {
        200: {
            'description': 'Activities retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'activities': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'string'},
                                'status': {'type': 'string'},
                                'created_at': {'type': 'string'},
                                'parcel': {
                                    'type': 'object',
                                    'properties': {
                                        'id': {'type': 'string'},
                                        'tracking_number': {'type': 'string'}
                                    }
                                },
                                'updated_by': {
                                    'type': 'object',
                                    'properties': {
                                        'id': {'type': 'string'},
                                        'full_name': {'type': 'string'}
                                    }
                                },
                                'location': {'type': 'string'}
                            }
                        }
                    }
                }
            }
        },
        403: {'description': 'Admin access required'}
    }
})
def get_activities():
    """Get recent activities (Admin only)"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    limit = request.args.get("limit", 10, type=int)
    
    try:
        # Get recent status history entries
        history = ParcelStatusHistory.query.order_by(
            ParcelStatusHistory.created_at.desc()
        ).limit(limit).all()
        
        activities = []
        for entry in history:
            # Get parcel info
            parcel = Parcel.query.get(entry.parcel_id)
            # Get user info
            user = User.query.get(entry.updated_by)
            
            activities.append({
                "id": entry.id,
                "status": entry.status,
                "created_at": entry.created_at.isoformat() if entry.created_at else None,
                "parcel": {
                    "id": parcel.id if parcel else None,
                    "tracking_number": parcel.tracking_number if parcel else None
                },
                "updated_by": {
                    "id": user.id if user else None,
                    "full_name": user.full_name if user else None
                },
                "location": entry.remarks or "N/A"
            })
        
        return jsonify({
            "success": True,
            "activities": activities
        }), 200
        
    except Exception as e:
        # Use current_app instead of app
        current_app.logger.error(f"Error fetching activities: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to fetch activities",
            "activities": []
        }), 500

    # Add to app/routes/admin.py
@admin_bp.route("/couriers", methods=["GET"])
@jwt_required()
def get_couriers():
    """Get all couriers (Admin only)"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403
    
    # You'll need a Courier model
    # For now, return empty array or mock data
    return jsonify({
        "success": True,
        "couriers": []
    }), 200

# backend/app/routes/admin.py - Add driver endpoints

@admin_bp.route("/drivers", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Admin'],
    'summary': 'Get all drivers',
    'description': 'Get a list of all users with role "driver" (Admin only)',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'Drivers retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'drivers': {'type': 'array'}
                }
            }
        },
        403: {'description': 'Admin access required'}
    }
})
def get_drivers():
    """Get all users with role 'driver' (Admin only)"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403
    
    # Get all users with role 'driver'
    drivers = User.query.filter_by(role='driver').all()
    
    return jsonify({
        "success": True,
        "drivers": [driver.to_dict() for driver in drivers]
    }), 200


@admin_bp.route("/drivers/<driver_id>/status", methods=["PUT"])
@jwt_required()
@swag_from({
    'tags': ['Admin'],
    'summary': 'Update driver status',
    'description': 'Update the status of a driver (Admin only)',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'driver_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Driver ID'
        },
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {
                        'type': 'string',
                        'enum': ['Available', 'Delivering', 'Offline', 'On Break'],
                        'example': 'Available'
                    }
                },
                'required': ['status']
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Driver status updated successfully',
            'schema': {'type': 'object'}
        },
        403: {'description': 'Admin access required'},
        404: {'description': 'Driver not found'}
    }
})
def update_driver_status(driver_id):
    """Update driver status (Admin only)"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403
    
    data = request.get_json()
    if not data or "status" not in data:
        return jsonify({"error": "Status is required"}), 400
    
    driver = User.query.get(driver_id)
    if not driver:
        return jsonify({"error": "Driver not found"}), 404
    
    if driver.role != 'driver':
        return jsonify({"error": "User is not a driver"}), 400
    
    # You might want to store driver status in a separate field or table
    # For now, we'll use a custom field or you can add a 'status' field to User model
    # This is a placeholder - you'll need to add a status field to the User model
    # or create a separate Driver model
    
    return jsonify({
        "success": True,
        "message": "Driver status updated successfully",
        "driver": driver.to_dict()
    }), 200

@admin_bp.route("/parcels/<parcel_id>/assign-rider", methods=["PUT"])
@jwt_required()
def assign_rider(parcel_id):
    """Assign a rider to a parcel (Admin only)"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    if not data or "rider_id" not in data:
        return jsonify({"error": "rider_id is required"}), 400

    parcel = Parcel.query.get(parcel_id)
    if not parcel:
        return jsonify({"error": "Parcel not found"}), 404

    rider = User.query.get(data["rider_id"])
    if not rider:
        return jsonify({"error": "Rider not found"}), 404

    if rider.role != 'driver':
        return jsonify({"error": "User is not a driver"}), 400

    parcel.rider_id = rider.id
    parcel.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Rider assigned successfully",
        "parcel": parcel.to_dict()
    }), 200