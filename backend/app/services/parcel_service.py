# app/services/parcel_service.py
from marshmallow import ValidationError
from datetime import datetime
from app.extensions import db
from app.models.parcel import Parcel, WEIGHT_CATEGORIES
from app.models.location import Location
from app.models.parcel_status_history import ParcelStatusHistory
from app.schemas.parcel_schema import ParcelCreateSchema, ParcelResponseSchema

parcel_create_schema = ParcelCreateSchema()
parcel_response_schema = ParcelResponseSchema()


def generate_tracking_number():
    import uuid
    return "TRK-" + uuid.uuid4().hex[:8].upper()


def calculate_price(weight, category, distance=100):
    """Calculate price based on weight, category, and distance"""
    base_fare = 500
    weight_rates = {
        "Light": 100,   # < 2kg
        "Medium": 200,  # 2-5kg
        "Heavy": 350    # > 5kg
    }
    weight_charge = weight_rates.get(category, 200) * weight
    distance_charge = distance * 5
    return base_fare + weight_charge + distance_charge


def create_parcel(user_id, data):
    weight_category = data.get("weight_category", "Light")

    if weight_category not in WEIGHT_CATEGORIES:
        return None, f"Invalid weight category. Must be one of: {WEIGHT_CATEGORIES}"

    pickup_data = data.get("pickup_location", {})
    dest_data = data.get("destination", {})

    pickup_location = Location(
        address=pickup_data.get("address"),
        city=pickup_data.get("city"),
        county=pickup_data.get("county"),
        latitude=pickup_data.get("latitude"),
        longitude=pickup_data.get("longitude"),
    )

    destination = Location(
        address=dest_data.get("address"),
        city=dest_data.get("city"),
        county=dest_data.get("county"),
        latitude=dest_data.get("latitude"),
        longitude=dest_data.get("longitude"),
    )

    weight = data.get("weight", 0.0)
    distance = data.get("distance", 100)  # Default distance if not provided
    
    # Calculate price
    price = calculate_price(weight, weight_category, distance)

    tracking_number = generate_tracking_number()

    parcel = Parcel(
        user_id=user_id,
        pickup_location=pickup_location,
        destination=destination,
        weight=weight,
        weight_category=weight_category,
        price=price,
        tracking_number=tracking_number,
        status="Pending"
    )

    db.session.add(parcel)
    db.session.flush()  # Get the ID before committing

    # Add initial status history
    status_history = ParcelStatusHistory(
        parcel_id=parcel.id,
        status="Pending",
        updated_by=user_id,
        remarks="Order created"
    )
    db.session.add(status_history)

    db.session.commit()

    return parcel, None


def get_user_parcels(user_id, page=1, per_page=10):
    query = Parcel.query.filter_by(user_id=user_id)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return paginated.items, None


def get_parcel_by_id(user_id, parcel_id):
    parcel = Parcel.query.get(parcel_id)
    if not parcel:
        return None, "Parcel not found"

    if parcel.user_id != user_id:
        return None, "Unauthorized: Not your parcel"

    return parcel, None


def update_destination(user_id, parcel_id, new_destination_data):
    parcel = Parcel.query.get(parcel_id)
    if not parcel:
        return None, "Parcel not found"

    if parcel.user_id != user_id:
        return None, "Unauthorized: Not your parcel"

    if parcel.status == "Delivered":
        return None, "Cannot change destination: parcel is already delivered"
    
    if parcel.status == "Cancelled":
        return None, "Cannot change destination: parcel is cancelled"

    # Update destination location
    destination_data = new_destination_data if isinstance(new_destination_data, dict) else {}
    
    # If destination exists, update it, otherwise create new
    if parcel.destination:
        parcel.destination.address = destination_data.get("address", parcel.destination.address)
        parcel.destination.city = destination_data.get("city", parcel.destination.city)
        parcel.destination.county = destination_data.get("county", parcel.destination.county)
        parcel.destination.latitude = destination_data.get("latitude", parcel.destination.latitude)
        parcel.destination.longitude = destination_data.get("longitude", parcel.destination.longitude)
    else:
        parcel.destination = Location(
            address=destination_data.get("address"),
            city=destination_data.get("city"),
            county=destination_data.get("county"),
            latitude=destination_data.get("latitude"),
            longitude=destination_data.get("longitude"),
        )

    # Recalculate price if distance changed
    if destination_data.get("distance"):
        parcel.price = calculate_price(parcel.weight, parcel.weight_category, destination_data.get("distance"))

    parcel.updated_at = datetime.utcnow()
    db.session.commit()

    return parcel, None


def cancel_parcel(user_id, parcel_id):
    parcel = Parcel.query.get(parcel_id)
    if not parcel:
        return None, "Parcel not found"

    if parcel.user_id != user_id:
        return None, "Unauthorized: Not your parcel"

    if parcel.status == "Delivered":
        return None, "Cannot cancel: parcel is already delivered"
    
    if parcel.status == "Cancelled":
        return None, "Cannot cancel: parcel is already cancelled"

    # Only allow cancellation if status is Pending, Picked Up, or In Transit
    if parcel.status not in ["Pending", "Picked Up", "In Transit"]:
        return None, f"Cannot cancel: parcel status is {parcel.status}"

    parcel.status = "Cancelled"
    parcel.updated_at = datetime.utcnow()

    # Add status history
    status_history = ParcelStatusHistory(
        parcel_id=parcel.id,
        status="Cancelled",
        updated_by=user_id,
        remarks="Cancelled by user"
    )
    db.session.add(status_history)

    db.session.commit()

    return parcel, None