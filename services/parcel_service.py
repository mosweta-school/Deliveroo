from marshmallow import ValidationError

from models.parcel import Parcel, WEIGHT_CATEGORIES
from models.location import Location
from schemas.parcel_schema import ParcelCreateSchema, ParcelResponseSchema

parcel_create_schema = ParcelCreateSchema()
parcel_response_schema = ParcelResponseSchema()


def generate_tracking_number():
    import uuid
    return "TRK-" + uuid.uuid4().hex[:8].upper()


def create_parcel(user_id, data):
    weight_category = data.get("weight_category", "Light")

    if weight_category not in WEIGHT_CATEGORIES:
        return None, f"Invalid weight category. Must be one of: {WEIGHT_CATEGORIES}"

    pickup_data = data.get("pickup_location", {})
    dest_data = data.get("destination", {})

    pickup_location = Location(
        address=pickup_data.get("address"),
        latitude=pickup_data.get("latitude"),
        longitude=pickup_data.get("longitude"),
    )

    destination = Location(
        address=dest_data.get("address"),
        latitude=dest_data.get("latitude"),
        longitude=dest_data.get("longitude"),
    )

    weight = data.get("weight", 0.0)

    tracking_number = generate_tracking_number()

    parcel = Parcel(
        user_id=user_id,
        pickup_location=pickup_location,
        destination=destination,
        weight=weight,
        weight_category=weight_category,
        tracking_number=tracking_number,
    )

    from app import db

    db.session.add(parcel)
    db.session.commit()

    return parcel, None


def get_user_parcels(user_id, page=1, per_page=10):
    from app import db

    query = Parcel.query.filter_by(user_id=user_id)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return paginated.items, None


def get_parcel_by_id(user_id, parcel_id):
    from app import db

    parcel = Parcel.query.get(parcel_id)
    if not parcel:
        return None, "Parcel not found"

    if parcel.user_id != user_id:
        return None, "Unauthorized: Not your parcel"

    return parcel, None


def update_destination(user_id, parcel_id, new_destination_data):
    from app import db

    parcel = Parcel.query.get(parcel_id)
    if not parcel:
        return None, "Parcel not found"

    if parcel.user_id != user_id:
        return None, "Unauthorized: Not your parcel"

    if parcel.status == "Delivered":
        return None, "Cannot change destination: parcel is already delivered"

    destination_data = new_destination_data if isinstance(new_destination_data, dict) else {}

    parcel.destination = Location(
        address=destination_data.get("address"),
        latitude=destination_data.get("latitude"),
        longitude=destination_data.get("longitude"),
    )

    db.session.commit()

    return parcel, None


def cancel_parcel(user_id, parcel_id):
    from app import db
    from datetime import datetime

    parcel = Parcel.query.get(parcel_id)
    if not parcel:
        return None, "Parcel not found"

    if parcel.user_id != user_id:
        return None, "Unauthorized: Not your parcel"

    if parcel.status == "Delivered":
        return None, "Cannot cancel: parcel is already delivered"

    parcel.status = "Cancelled"
    parcel.updated_at = datetime.utcnow()

    db.session.commit()

    return parcel, None