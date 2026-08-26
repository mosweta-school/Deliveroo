from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.parcel_service import (
    create_parcel,
    get_user_parcels,
    get_parcel_by_id,
    update_destination,
    cancel_parcel,
)
from schemas.parcel_schema import ParcelResponseSchema

parcel_bp = Blueprint("parcel", __name__)
parcel_response_schema = ParcelResponseSchema()


@parcel_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    user_id = get_jwt_identity()
    data = request.get_json()

    parcel, err = create_parcel(user_id=user_id, data=data)

    if err:
        return jsonify({"error": err}), 400

    return parcel_response_schema.dump(parcel), 201


@parcel_bp.route("/", methods=["GET"])
@jwt_required()
def list_user_parcels():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    user_parcels = get_user_parcels(user_id=user_id, page=page, per_page=per_page)
    return parcel_response_schema.dump(user_parcels, many=True), 200


@parcel_bp.route("/<parcel_id>", methods=["GET"])
@jwt_required()
def detail(parcel_id):
    user_id = get_jwt_identity()
    parcel, error = get_parcel_by_id(user_id=user_id, parcel_id=parcel_id)

    if error:
        return jsonify({"error": error}), 404

    if parcel.user_id != user_id:
        return jsonify({"error": "Unauthorized: Not your parcel"}), 403

    return parcel_response_schema.dump(parcel), 200


@parcel_bp.route("/<parcel_id>/destination", methods=["PATCH"])
@jwt_required()
def change_destination(parcel_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    parcel, err = update_destination(user_id=user_id, parcel_id=parcel_id, new_destination_data=data)

    if err:
        return jsonify({"error": err}), 400

    return parcel_response_schema.dump(parcel), 200


@parcel_bp.route("/<parcel_id>/cancel", methods=["PATCH"])
@jwt_required()
def cancel(parcel_id):
    user_id = get_jwt_identity()
    parcel, err = cancel_parcel(user_id=user_id, parcel_id=parcel_id)

    if err:
        return jsonify({"error": err}), 400

    return parcel_response_schema.dump(parcel), 200