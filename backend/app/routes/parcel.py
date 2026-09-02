"""
Parcel CRUD routes.

Endpoints:
    GET /parcels              -> List user parcels (paginated)
    POST /parcels             -> Create a new parcel
    GET /parcels/<parcel_id> -> Get parcel by ID
    PATCH /parcels/<parcel_id>/destination -> Update parcel destination
    PATCH /parcels/<parcel_id>/cancel -> Cancel parcel
"""

import uuid
from datetime import datetime
from flask import Blueprint, current_app, request, jsonify, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.parcel import Parcel, generate_tracking_number
from app.models.location import Location
from app.schemas.parcel_schema import ParcelSchema, ParcelCreateSchema
from app.extensions import db

parcel_bp = Blueprint("parcel", __name__)
parcel_schema = ParcelSchema()
parcel_create_schema = ParcelCreateSchema()


@parcel_bp.route("", methods=["GET"])
@jwt_required()
def list_parcels():
    """List authenticated user's parcels with pagination."""
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    parcels = Parcel.query.filter_by(user_id=user_id)\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "parcels": [p.to_dict() for p in parcels.items],
        "page": parcels.page,
        "per_page": parcels.per_page,
        "total": parcels.total,
        "pages": parcels.pages,
    }), 200


@parcel_bp.route("", methods=["POST"])
@jwt_required()
def create_parcel():
    """Create a new parcel for authenticated user."""
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    try:
        result = parcel_create_schema.load(data)
    except Exception as e:
        return jsonify({"error": str(e.messages)}), 422

    # Validate required fields
    if not result.get("pickup_location") or not result["pickup_location"].get("address"):
        return jsonify({"error": "Pickup location address is required"}), 422
    if not result.get("destination") or not result["destination"].get("address"):
        return jsonify({"error": "Destination address is required"}), 422
    if result.get("weight") is None:
        return jsonify({"error": "Weight is required"}), 422
    if not result.get("weight_category") or result["weight_category"] not in ("Light", "Medium", "Heavy"):
        return jsonify({"error": "Weight category must be one of: Light, Medium, Heavy"}), 422

    # Create or get pickup location
    pickup_addr = result["pickup_location"]["address"]
    pickup_lat = result["pickup_location"].get("latitude")
    pickup_lon = result["pickup_location"].get("longitude")
    pickup_loc = Location.query.filter_by(address=pickup_addr)\
        .first() or Location(address=pickup_addr, latitude=pickup_lat, longitude=pickup_lon)
    if not pickup_loc.id:
        db.session.add(pickup_loc)

    # Create or get destination location
    dest_addr = result["destination"]["address"]
    dest_lat = result["destination"].get("latitude")
    dest_lon = result["destination"].get("longitude")
    dest_loc = Location.query.filter_by(address=dest_addr)\
        .first() or Location(address=dest_addr, latitude=dest_lat, longitude=dest_lon)
    if not dest_loc.id:
        db.session.add(dest_loc)

    # Create parcel
    tracking_number = generate_tracking_number()
    parcel = Parcel(
        id=str(uuid.uuid4()),
        user_id=user_id,
        pickup_location_id=pickup_loc.id,
        destination_id=dest_loc.id,
        weight=result["weight"],
        weight_category=result["weight_category"],
        status="Pending",
        tracking_number=tracking_number,
    )
    db.session.add(parcel)
    db.session.commit()

    return jsonify({
        "message": "Parcel created successfully",
        "parcel": parcel.to_dict(),
    }), 201


@parcel_bp.route("/<parcel_id>", methods=["GET"])
@jwt_required()
def get_parcel(parcel_id):
    """Get parcel details by ID."""
    user_id = get_jwt_identity()
    parcel = Parcel.query.filter_by(id=parcel_id, user_id=user_id).first()
    if not parcel:
        abort(404, description="Parcel not found")
    return jsonify(parcel.to_dict()), 200


@parcel_bp.route("/<parcel_id>/destination", methods=["PATCH"])
@jwt_required()
def change_destination(parcel_id):
    """Update parcel destination."""
    user_id = get_jwt_identity()
    parcel = Parcel.query.filter_by(id=parcel_id, user_id=user_id).first()
    if not parcel:
        abort(404, description="Parcel not found")

    if parcel.is_delivered():
        abort(400, description="Cannot change destination: parcel has been delivered")

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    new_address = data.get("address")
    new_latitude = data.get("latitude")
    new_longitude = data.get("longitude")

    if not new_address:
        return jsonify({"error": "New destination address is required"}), 400

    # Update or create destination location
    dest_loc = Location.query.filter_by(address=new_address).first()
    if not dest_loc:
        dest_loc = Location(address=new_address, latitude=new_latitude, longitude=new_longitude)
        db.session.add(dest_loc)

    parcel.destination_id = dest_loc.id
    parcel.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message": "Destination updated successfully",
        "parcel": parcel.to_dict(),
    }), 200


@parcel_bp.route("/<parcel_id>/cancel", methods=["PATCH"])
@jwt_required()
def cancel_parcel(parcel_id):
    """Cancel a parcel."""
    user_id = get_jwt_identity()
    parcel = Parcel.query.filter_by(id=parcel_id, user_id=user_id).first()
    if not parcel:
        abort(404, description="Parcel not found")

    if not parcel.is_cancelable():
        abort(400, description=f"Cannot cancel parcel: current status is '{parcel.status}'")

    parcel.status = "Cancelled"
    parcel.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message": "Parcel cancelled successfully",
        "parcel": parcel.to_dict(),
    }), 200