# app/routes/parcel.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flasgger import swag_from
from app.services.parcel_service import (
    create_parcel,
    get_user_parcels,
    get_parcel_by_id,
    update_destination,
    cancel_parcel,
)

parcel_bp = Blueprint("parcel", __name__)

@parcel_bp.route("/", methods=["POST"])
@jwt_required()
@swag_from({
    'tags': ['Parcels'],
    'summary': 'Create a new parcel order',
    'description': 'Create a new parcel delivery order with pickup and destination locations',
    'security': [{'Bearer': []}],
    'parameters': [{
        'name': 'body',
        'in': 'body',
        'required': True,
        'schema': {
            'type': 'object',
            'properties': {
                'pickup_location': {
                    'type': 'object',
                    'properties': {
                        'address': {'type': 'string', 'example': 'Nairobi CBD'},
                        'city': {'type': 'string', 'example': 'Nairobi'},
                        'county': {'type': 'string', 'example': 'Nairobi'},
                        'latitude': {'type': 'number', 'example': -1.2921},
                        'longitude': {'type': 'number', 'example': 36.8219}
                    }
                },
                'destination': {
                    'type': 'object',
                    'properties': {
                        'address': {'type': 'string', 'example': 'Kisumu'},
                        'city': {'type': 'string', 'example': 'Kisumu'},
                        'county': {'type': 'string', 'example': 'Kisumu'},
                        'latitude': {'type': 'number', 'example': -0.1022},
                        'longitude': {'type': 'number', 'example': 34.7617}
                    }
                },
                'weight': {'type': 'number', 'example': 2.5},
                'weight_category': {'type': 'string', 'enum': ['Light', 'Medium', 'Heavy'], 'example': 'Medium'},
                'distance': {'type': 'number', 'example': 320}
            },
            'required': ['pickup_location', 'destination', 'weight', 'weight_category']
        }
    }],
    'responses': {
        201: {
            'description': 'Parcel created successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'string'},
                    'tracking_number': {'type': 'string'},
                    'status': {'type': 'string'},
                    'price': {'type': 'number'}
                }
            }
        },
        401: {'description': 'Unauthorized'},
        400: {'description': 'Invalid data'}
    }
})
def create():
    user_id = get_jwt_identity()
    data = request.get_json()

    parcel, err = create_parcel(user_id=user_id, data=data)

    if err:
        return jsonify({"error": err}), 400

    return parcel.to_dict(), 201

@parcel_bp.route("/", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Parcels'],
    'summary': 'Get all parcels for current user',
    'description': 'Get a paginated list of all parcels belonging to the current user',
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
            'default': 10,
            'description': 'Items per page'
        }
    ],
    'responses': {
        200: {
            'description': 'Parcels retrieved successfully',
            'schema': {
                'type': 'array',
                'items': {'type': 'object'}
            }
        },
        401: {'description': 'Unauthorized'}
    }
})
def list_user_parcels():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    user_parcels, _ = get_user_parcels(user_id=user_id, page=page, per_page=per_page)
    return [parcel.to_dict() for parcel in user_parcels], 200

@parcel_bp.route("/<parcel_id>", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Parcels'],
    'summary': 'Get parcel details by ID',
    'description': 'Get detailed information about a specific parcel',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'parcel_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Parcel ID'
        }
    ],
    'responses': {
        200: {
            'description': 'Parcel retrieved successfully',
            'schema': {'type': 'object'}
        },
        401: {'description': 'Unauthorized'},
        403: {'description': 'Not your parcel'},
        404: {'description': 'Parcel not found'}
    }
})
def detail(parcel_id):
    user_id = get_jwt_identity()
    parcel, error = get_parcel_by_id(user_id=user_id, parcel_id=parcel_id)

    if error:
        return jsonify({"error": error}), 404

    if parcel.user_id != user_id:
        return jsonify({"error": "Unauthorized: Not your parcel"}), 403

    return parcel.to_dict(), 200

@parcel_bp.route("/<parcel_id>/destination", methods=["PATCH"])
@jwt_required()
@swag_from({
    'tags': ['Parcels'],
    'summary': 'Update parcel destination',
    'description': 'Change the destination of a parcel (only if not delivered)',
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
                    'address': {'type': 'string', 'example': 'Mombasa'},
                    'city': {'type': 'string', 'example': 'Mombasa'},
                    'county': {'type': 'string', 'example': 'Mombasa'},
                    'latitude': {'type': 'number', 'example': -4.0435},
                    'longitude': {'type': 'number', 'example': 39.6682},
                    'distance': {'type': 'number', 'example': 480}
                },
                'required': ['address', 'city']
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Destination updated successfully',
            'schema': {'type': 'object'}
        },
        400: {'description': 'Cannot update destination of delivered/cancelled parcel'},
        401: {'description': 'Unauthorized'},
        403: {'description': 'Not your parcel'},
        404: {'description': 'Parcel not found'}
    }
})
def change_destination(parcel_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    parcel, err = update_destination(user_id=user_id, parcel_id=parcel_id, new_destination_data=data)

    if err:
        return jsonify({"error": err}), 400

    return parcel.to_dict(), 200

@parcel_bp.route("/<parcel_id>/cancel", methods=["PATCH"])
@jwt_required()
@swag_from({
    'tags': ['Parcels'],
    'summary': 'Cancel a parcel order',
    'description': 'Cancel a parcel order (only if not delivered and user is the sender)',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'parcel_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Parcel ID'
        }
    ],
    'responses': {
        200: {
            'description': 'Parcel cancelled successfully',
            'schema': {'type': 'object'}
        },
        400: {'description': 'Cannot cancel delivered parcel'},
        401: {'description': 'Unauthorized'},
        403: {'description': 'Not your parcel'},
        404: {'description': 'Parcel not found'}
    }
})
def cancel(parcel_id):
    user_id = get_jwt_identity()
    parcel, err = cancel_parcel(user_id=user_id, parcel_id=parcel_id)

    if err:
        return jsonify({"error": err}), 400

    return parcel.to_dict(), 200
