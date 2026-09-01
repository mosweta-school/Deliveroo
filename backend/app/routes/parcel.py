"""
Parcel CRUD routes.

Endpoints:
    GET /parcels              -> List user parcels (paginated)
    POST /parcels             -> Create a new parcel
    GET /parcels/<parcel_id> -> Get parcel by ID
    PATCH /parcels/<parcel_id>/destination -> Update parcel destination
    PATCH /parcels/<parcel_id>/cancel -> Cancel parcel
"""

from flask import Blueprint, current_app, request, jsonify
from app.schemas.parcel_schema import ParcelSchema, ParcelCreateSchema

parcel_bp = Blueprint("parcel", __name__)
parcel_schema = ParcelSchema()
parcel_create_schema = ParcelCreateSchema()


@parcel_bp.route("", methods=["GET"])
def list_parcels():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    return jsonify({
        "parcels": [],
        "page": page,
        "per_page": per_page,
        "total": 0,
    }), 200


@parcel_bp.route("", methods=["POST"])
def create_parcel():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    try:
        result = parcel_create_schema.load(data)
    except Exception as e:
        return jsonify({"error": str(e.messages)}), 422

    return jsonify({"message": "Parcel created successfully", "parcel": result}), 201


@parcel_bp.route("/<parcel_id>", methods=["GET"])
def get_parcel(parcel_id):
    return jsonify({"id": parcel_id}), 200


@parcel_bp.route("/<parcel_id>/destination", methods=["PATCH"])
def change_destination(parcel_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    new_destination = data.get("new_destination")
    if not new_destination:
        return jsonify({"error": "new_destination is required"}), 400

    return jsonify({"message": "Destination updated successfully", "parcel_id": parcel_id}), 200


@parcel_bp.route("/<parcel_id>/cancel", methods=["PATCH"])
def cancel_parcel(parcel_id):
    return jsonify({"message": "Parcel cancelled successfully", "parcel_id": parcel_id}), 200