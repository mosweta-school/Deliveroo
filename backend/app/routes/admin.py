# app/routes/admin.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from flasgger import swag_from
from app.services.admin_service import (
    update_parcel_status, 
    update_parcel_location, 
    get_admin_stats
)
from app.models.user import User
from app.models.parcel import Parcel

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