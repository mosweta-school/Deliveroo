# backend/app/routes/customer.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy.orm import joinedload, selectinload

from app.extensions import db
from app.models.parcel import Parcel
from app.models.parcel_status_history import ParcelStatusHistory
from app.models.user import User
from app.models.location import Location
from app.services.notification_service import (
    notify_parcel_created,
    notify_destination_updated,
    notify_parcel_cancelled,
)
from app.services.redis_service import redis_service
from datetime import datetime
import uuid
import math
import logging
import json

logger = logging.getLogger(__name__)

customer_bp = Blueprint("customer", __name__)


# ============================================================
# HELPERS
# ============================================================

def is_customer():
    """Check if current user has the customer role."""
    claims = get_jwt()
    return claims.get('role') == 'customer'


def category_from_weight(weight: float) -> str:
    """Derive the weight category from a numeric weight in kg.

    The client no longer sends weight_category — the server is the source
    of truth, so the category and the price charge can never drift apart.
    """
    if weight < 2:
        return "Light"
    if weight <= 5:
        return "Medium"
    return "Heavy"


def calculate_order_price(weight, weight_category, distance, is_fragile):
    """
    Compute order price.

    Formula:
      base_fare (500) + weight_rate * weight + distance * 5 + fragile (200 if flagged)
    """
    base_fare = 500
    weight_rates = {"Light": 100, "Medium": 200, "Heavy": 350}
    weight_charge = weight_rates.get(weight_category, 200) * weight
    distance_charge = distance * 5
    fragile_charge = 200 if is_fragile else 0
    return round(base_fare + weight_charge + distance_charge + fragile_charge, 2)


def haversine_distance(lat1, lon1, lat2, lon2):
    """Compute straight-line distance (km) then multiply by 1.3 for road factor."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c * 1.3, 1)


def compute_payment_policy(user_id, price, payment_choice=None):
    """Compute the payment policy for an order.

    Rules:
      - Non-eligible customers (< 2 delivered orders): fixed 40% deposit.
      - Eligible customers (>= 2 delivered orders): choose between
        'cod' (pay full on delivery) and 'full' (pay full now).

    Returns:
        (policy_dict, error_message_or_None)
    """
    completed_count = Parcel.query.filter_by(
        user_id=user_id, status='Delivered'
    ).count()
    cod_eligible = completed_count >= 2

    if cod_eligible:
        choice = (payment_choice or "").strip().lower()
        if choice not in ("cod", "full"):
            return None, "Please choose Cash on Delivery or Pay full amount"

        if choice == "cod":
            return {
                "cod_eligible": True,
                "payment_method": "cod",
                "deposit_percent": 0,
                "deposit_amount": 0.0,
                "amount_due": round(price, 2),
                "completed_deliveries": completed_count,
            }, None
        else:  # 'full'
            return {
                "cod_eligible": True,
                "payment_method": "deposit",
                "deposit_percent": 100,
                "deposit_amount": round(price, 2),
                "amount_due": 0.0,
                "completed_deliveries": completed_count,
            }, None

    # Not eligible — fixed 40% deposit, no choice.
    deposit_amount = round(price * 0.40, 2)
    return {
        "cod_eligible": False,
        "payment_method": "deposit",
        "deposit_percent": 40,
        "deposit_amount": deposit_amount,
        "amount_due": round(price - deposit_amount, 2),
        "completed_deliveries": completed_count,
    }, None


def _parcel_eager_options():
    """Standard eager-load options for any query that will serialize parcels.

    Without these, every Parcel.to_dict() triggers a lazy load of
    pickup_location, destination, user, rider, and payments — 5 extra
    queries per parcel. For a customer with 40 orders that's 200 queries
    per dashboard call.
    """
    return (
        joinedload(Parcel.pickup_location),
        joinedload(Parcel.destination),
        joinedload(Parcel.user),
        joinedload(Parcel.rider),
        selectinload(Parcel.payments),
    )


# ============================================================
# DASHBOARD
# ============================================================

@customer_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def get_customer_dashboard():
    """Get customer dashboard data.

    The response deliberately omits a full order list. Recent orders are
    capped at 10 and the client should use GET /customer/orders for the
    paginated list. Shipping every order the customer ever placed was
    both a payload problem and an N+1 trap (each serialization touched
    locations, users, rider, and payments).
    """
    user_id = get_jwt_identity()

    try:
        recent_limit = request.args.get("recent_limit", 10, type=int)
        recent_limit = max(1, min(recent_limit, 20))

        # ---- Stats via aggregates, not by scanning a fully loaded list ----
        base_q = Parcel.query.filter_by(user_id=user_id)
        total_orders = base_q.count()

        active_orders = Parcel.query.filter(
            Parcel.user_id == user_id,
            Parcel.status.notin_(['Delivered', 'Cancelled']),
        ).count()

        completed_orders = Parcel.query.filter_by(
            user_id=user_id, status='Delivered'
        ).count()

        pending_orders = Parcel.query.filter_by(
            user_id=user_id, status='Pending'
        ).count()

        # Total spent = sum of completed, non-fragile-adjustment-inclusive prices
        # for delivered parcels. Uses an aggregate, not Python-side summation.
        total_revenue = (
            db.session.query(db.func.coalesce(db.func.sum(Parcel.price), 0.0))
            .filter(Parcel.user_id == user_id, Parcel.status == 'Delivered')
            .scalar()
        ) or 0.0

        # ---- Recent orders — one query, eager-loaded relations ----
        recent = (
            Parcel.query
            .filter_by(user_id=user_id)
            .options(*_parcel_eager_options())
            .order_by(Parcel.created_at.desc())
            .limit(recent_limit)
            .all()
        )

        # Serialize once, reuse. Avoids double-serializing the same parcel
        # if it appears in both recent_orders and (previously) all_orders.
        recent_serialized = [p.to_dict() for p in recent]

        user = User.query.get(user_id)

        return jsonify({
            "success": True,
            "user": user.to_dict() if user else None,
            "stats": {
                "total_orders": total_orders,
                "active_orders": active_orders,
                "completed_orders": completed_orders,
                "pending_orders": pending_orders,
                "total_revenue": round(float(total_revenue), 2),
            },
            "recent_orders": recent_serialized,
        }), 200

    except Exception as e:
        logger.error(f"Error in get_customer_dashboard: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
# ORDER LIST
# ============================================================

@customer_bp.route("/orders", methods=["GET"])
@jwt_required()
def get_customer_orders():
    """Get all orders for current customer with pagination."""
    user_id = get_jwt_identity()

    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 10, type=int), 50)
    status = request.args.get("status", None)

    try:
        query = (
            Parcel.query
            .filter_by(user_id=user_id)
            .options(*_parcel_eager_options())
        )
        if status and status != 'all':
            query = query.filter_by(status=status)

        paginated = query.order_by(Parcel.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        return jsonify({
            "success": True,
            "orders": [parcel.to_dict() for parcel in paginated.items],
            "total": paginated.total,
            "page": page,
            "per_page": per_page,
            "pages": paginated.pages,
        }), 200

    except Exception as e:
        logger.error(f"Error in get_customer_orders: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
# ⚠️ CRITICAL: STATIC ROUTES MUST COME BEFORE /orders/<order_id>
# ============================================================

@customer_bp.route("/orders/calculate-price", methods=["POST", "OPTIONS"])
@jwt_required()
def calculate_price():
    """Calculate price for an order without creating it."""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    data = request.get_json() or {}
    logger.info(f"💰 [calculate_price] payload: {json.dumps(data, default=str)}")

    try:
        weight = float(data.get("weight", 0))
    except (ValueError, TypeError):
        weight = 0

    try:
        distance = float(data.get("distance", 100))
    except (ValueError, TypeError):
        distance = 100

    if weight > 0:
        weight_category = category_from_weight(weight)
    else:
        weight_category = data.get("weight_category", "Medium")
        if weight_category not in ["Light", "Medium", "Heavy"]:
            weight_category = "Medium"

    is_fragile = bool(data.get("is_fragile", False))

    base_fare = 500
    weight_rates = {"Light": 100, "Medium": 200, "Heavy": 350}
    weight_charge = weight_rates.get(weight_category, 200) * weight
    distance_charge = distance * 5
    fragile_charge = 200 if is_fragile else 0
    total = base_fare + weight_charge + distance_charge + fragile_charge

    return jsonify({
        "success": True,
        "breakdown": {
            "base_fare": base_fare,
            "weight_charge": round(weight_charge, 2),
            "distance_charge": round(distance_charge, 2),
            "fragile_charge": fragile_charge,
            "total": round(total, 2),
        },
        "weight_category": weight_category,
        "currency": "KES",
    }), 200


@customer_bp.route("/orders/preview-payment", methods=["POST", "OPTIONS"])
@jwt_required()
def preview_payment():
    """Preview pricing and payment policy for a prospective order."""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    user_id = get_jwt_identity()
    data = request.get_json() or {}

    try:
        weight = float(data.get("weight", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid weight"}), 400
    if weight <= 0:
        return jsonify({"error": "Weight must be greater than 0"}), 400

    try:
        distance = float(data.get("distance", 100))
    except (ValueError, TypeError):
        distance = 100

    is_fragile = bool(data.get("is_fragile", False))
    weight_category = category_from_weight(weight)
    price = calculate_order_price(weight, weight_category, distance, is_fragile)

    policy, err = compute_payment_policy(user_id, price)
    if err:
        return jsonify({"error": err}), 400

    return jsonify({
        "success": True,
        "price": round(price, 2),
        "currency": "KES",
        "weight": weight,
        "weight_category": weight_category,
        "distance": distance,
        "is_fragile": is_fragile,
        "cod_eligible": policy["cod_eligible"],
        "completed_deliveries": policy["completed_deliveries"],
        "payment_method": policy["payment_method"],
        "deposit_percent": policy["deposit_percent"],
        "deposit_amount": policy["deposit_amount"],
        "amount_due": policy["amount_due"],
        "allowed_choices": (
            ["cod", "full"] if policy["cod_eligible"] else ["deposit"]
        ),
    }), 200


# ============================================================
# CREATE ORDER
# ============================================================

@customer_bp.route("/orders", methods=["POST", "OPTIONS"])
@jwt_required()
def create_order():
    """Create a new delivery order for the current customer."""
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    user_id = get_jwt_identity()

    if not is_customer():
        return jsonify({"error": "Customer access required"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    logger.info(f"📥 [create_order] payload: {json.dumps(data, default=str)}")

    # ---- Validate pickup ----
    pickup_data = data.get("pickup_location") or {}
    pickup_address = (pickup_data.get("address") or "").strip()
    if not pickup_address:
        logger.warning(f"❌ Missing pickup address. pickup_data={pickup_data}")
        return jsonify({
            "error": "Pickup address is required",
            "received": pickup_data,
        }), 400

    pickup_lat = pickup_data.get("latitude")
    pickup_lng = pickup_data.get("longitude")

    # ---- Validate destination ----
    dest_data = data.get("destination") or {}
    destination_address = (dest_data.get("address") or "").strip()
    if not destination_address:
        logger.warning(f"❌ Missing destination address. dest_data={dest_data}")
        return jsonify({
            "error": "Destination address is required",
            "received": dest_data,
        }), 400

    dest_lat = dest_data.get("latitude")
    dest_lng = dest_data.get("longitude")

    # ---- Validate weight ----
    try:
        weight = float(data.get("weight", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid weight"}), 400

    if weight <= 0:
        return jsonify({"error": "Weight must be greater than 0"}), 400

    weight_category = category_from_weight(weight)

    # ---- Validate sender / receiver ----
    sender_name = (data.get("sender_name") or "").strip()
    sender_phone = (data.get("sender_phone") or "").strip()
    receiver_name = (data.get("receiver_name") or "").strip()
    receiver_phone = (data.get("receiver_phone") or "").strip()

    if not sender_name:
        return jsonify({"error": "Sender name is required"}), 400
    if not sender_phone:
        return jsonify({"error": "Sender phone is required"}), 400
    if not receiver_name:
        return jsonify({"error": "Receiver name is required"}), 400
    if not receiver_phone:
        return jsonify({"error": "Receiver phone is required"}), 400

    try:
        pickup = Location(
            address=pickup_address,
            street_address=(pickup_data.get("street_address") or "").strip() or None,
            city=pickup_data.get("city", ""),
            county=pickup_data.get("county", ""),
            latitude=float(pickup_lat) if pickup_lat is not None else None,
            longitude=float(pickup_lng) if pickup_lng is not None else None,
        )
        db.session.add(pickup)

        destination = Location(
            address=destination_address,
            street_address=(dest_data.get("street_address") or "").strip() or None,
            city=dest_data.get("city", ""),
            county=dest_data.get("county", ""),
            latitude=float(dest_lat) if dest_lat is not None else None,
            longitude=float(dest_lng) if dest_lng is not None else None,
        )
        db.session.add(destination)
        db.session.flush()

        # ---- Compute distance ----
        distance = data.get("distance")
        if distance is None or float(distance) <= 0:
            if all(v is not None for v in [
                pickup.latitude, pickup.longitude,
                destination.latitude, destination.longitude,
            ]):
                distance = haversine_distance(
                    pickup.latitude, pickup.longitude,
                    destination.latitude, destination.longitude,
                )
            else:
                distance = 100
        else:
            distance = float(distance)

        # ---- Compute price ----
        is_fragile = bool(data.get("is_fragile", False))
        price = calculate_order_price(weight, weight_category, distance, is_fragile)

        # ---- Compute payment policy ----
        payment_choice = data.get("payment_choice")
        policy, policy_err = compute_payment_policy(
            user_id=user_id,
            price=price,
            payment_choice=payment_choice,
        )
        if policy_err:
            return jsonify({
                "error": policy_err,
                "cod_eligible": True,
                "allowed_choices": ["cod", "full"],
            }), 400

        # ---- Create parcel ----
        tracking_number = f"TRK-{uuid.uuid4().hex[:8].upper()}"
        parcel = Parcel(
            user_id=user_id,
            pickup_location_id=pickup.id,
            destination_id=destination.id,
            weight=weight,
            weight_category=weight_category,
            price=price,
            status="Pending",
            tracking_number=tracking_number,

            sender_name=sender_name,
            sender_email=(data.get("sender_email") or "").strip() or None,
            sender_phone=sender_phone,
            receiver_name=receiver_name,
            receiver_email=(data.get("receiver_email") or "").strip() or None,
            receiver_phone=receiver_phone,
            description=(
                data.get("item_description")
                or data.get("description")
                or ""
            ),
            distance=distance,
            is_fragile=is_fragile,

            deposit_percent=policy["deposit_percent"],
            deposit_amount=policy["deposit_amount"],
            amount_due=policy["amount_due"],
            payment_method=policy["payment_method"],
        )
        db.session.add(parcel)
        db.session.flush()

        db.session.add(ParcelStatusHistory(
            parcel_id=parcel.id,
            status="Pending",
            updated_by=user_id,
            remarks="Order created by customer",
        ))

        db.session.commit()
        logger.info(
            f"✅ Order created: {tracking_number} by user {user_id} "
            f"(method={policy['payment_method']}, "
            f"deposit={policy['deposit_amount']}, "
            f"due={policy['amount_due']})"
        )

        try:
            notify_parcel_created(user_id, parcel)
        except Exception as e:
            logger.warning(f"Notification failed: {e}")

        try:
            redis_service.invalidate_customer_dashboard(user_id)
            redis_service.client.delete("admin:stats")
        except Exception as e:
            logger.warning(f"Cache invalidation failed: {e}")

        # Re-fetch with eager loads so to_dict() doesn't lazy-load
        # pickup/destination/user/rider/payments one-by-one.
        parcel = (
            Parcel.query
            .options(*_parcel_eager_options())
            .filter_by(id=parcel.id)
            .first()
        )

        return jsonify({
            "success": True,
            "message": "Order created successfully",
            "parcel": parcel.to_dict() if parcel else None,
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Order creation failed: {e}", exc_info=True)
        return jsonify({"error": "Failed to create order. Please try again."}), 500


# ============================================================
# ORDER DETAILS
# ============================================================

@customer_bp.route("/orders/<order_id>", methods=["GET"])
@jwt_required()
def get_customer_order(order_id):
    """Get a specific order by ID, including its status timeline."""
    user_id = get_jwt_identity()

    try:
        parcel = (
            Parcel.query
            .options(*_parcel_eager_options())
            .filter_by(id=order_id)
            .first()
        )
        if not parcel:
            return jsonify({"error": "Order not found"}), 404

        if parcel.user_id != user_id:
            return jsonify({"error": "Unauthorized: Not your order"}), 403

        return jsonify({
            "success": True,
            "order": parcel.to_dict(include_history=True),
        }), 200

    except Exception as e:
        logger.error(f"Error in get_customer_order: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
# UPDATE DESTINATION
# ============================================================

@customer_bp.route("/orders/<order_id>/destination", methods=["PATCH"])
@jwt_required()
def update_order_destination(order_id):
    """Update the destination of an order."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or "destination" not in data:
        return jsonify({"error": "Destination is required"}), 400

    try:
        parcel = Parcel.query.get(order_id)
        if not parcel:
            return jsonify({"error": "Order not found"}), 404

        if parcel.user_id != user_id:
            return jsonify({"error": "Unauthorized: Not your order"}), 403

        if parcel.status == 'Delivered':
            return jsonify({"error": "Cannot update destination: order already delivered"}), 400
        if parcel.status == 'Cancelled':
            return jsonify({"error": "Cannot update destination: order already cancelled"}), 400

        old_destination = parcel.destination.address if parcel.destination else None
        destination_data = data.get("destination", {})

        if parcel.destination:
            parcel.destination.address = destination_data.get("address", parcel.destination.address)
            parcel.destination.street_address = destination_data.get("street_address", parcel.destination.street_address)
            parcel.destination.city = destination_data.get("city", parcel.destination.city)
            parcel.destination.county = destination_data.get("county", parcel.destination.county)
            parcel.destination.latitude = destination_data.get("latitude", parcel.destination.latitude)
            parcel.destination.longitude = destination_data.get("longitude", parcel.destination.longitude)
        else:
            parcel.destination = Location(
                address=destination_data.get("address"),
                street_address=destination_data.get("street_address"),
                city=destination_data.get("city"),
                county=destination_data.get("county"),
                latitude=destination_data.get("latitude"),
                longitude=destination_data.get("longitude"),
            )

        parcel.updated_at = datetime.utcnow()

        db.session.add(ParcelStatusHistory(
            parcel_id=parcel.id,
            status=parcel.status,
            updated_by=user_id,
            remarks=f"Destination updated to: {destination_data.get('address', 'N/A')}",
        ))

        db.session.commit()

        try:
            notify_destination_updated(parcel, old_destination, destination_data.get('address', 'N/A'))
        except Exception as e:
            logger.warning(f"Notification failed: {e}")

        try:
            redis_service.invalidate_customer_dashboard(user_id)
        except Exception:
            pass

        # Re-fetch with eager loads before serializing.
        parcel = (
            Parcel.query
            .options(*_parcel_eager_options())
            .filter_by(id=parcel.id)
            .first()
        )

        return jsonify({
            "success": True,
            "message": "Destination updated successfully",
            "order": parcel.to_dict() if parcel else None,
        }), 200

    except Exception as e:
        logger.error(f"Error in update_order_destination: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
# CANCEL ORDER
# ============================================================

@customer_bp.route("/orders/<order_id>/cancel", methods=["PATCH"])
@jwt_required()
def cancel_customer_order(order_id):
    """Cancel an order."""
    user_id = get_jwt_identity()

    try:
        parcel = Parcel.query.get(order_id)
        if not parcel:
            return jsonify({"error": "Order not found"}), 404

        if parcel.user_id != user_id:
            return jsonify({"error": "Unauthorized: Not your order"}), 403

        if parcel.status == 'Delivered':
            return jsonify({"error": "Cannot cancel: order already delivered"}), 400
        if parcel.status == 'Cancelled':
            return jsonify({"error": "Cannot cancel: order already cancelled"}), 400
        if parcel.status not in ['Pending', 'Picked Up', 'In Transit']:
            return jsonify({"error": f"Cannot cancel: order status is {parcel.status}"}), 400

        parcel.status = 'Cancelled'
        parcel.updated_at = datetime.utcnow()

        db.session.add(ParcelStatusHistory(
            parcel_id=parcel.id,
            status='Cancelled',
            updated_by=user_id,
            remarks="Cancelled by customer",
        ))

        db.session.commit()

        try:
            notify_parcel_cancelled(parcel)
        except Exception as e:
            logger.warning(f"Notification failed: {e}")

        try:
            redis_service.invalidate_customer_dashboard(user_id)
        except Exception:
            pass

        parcel = (
            Parcel.query
            .options(*_parcel_eager_options())
            .filter_by(id=parcel.id)
            .first()
        )

        return jsonify({
            "success": True,
            "message": "Order cancelled successfully",
            "order": parcel.to_dict() if parcel else None,
        }), 200

    except Exception as e:
        logger.error(f"Error in cancel_customer_order: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
# PROFILE
# ============================================================

@customer_bp.route("/profile", methods=["GET", "PUT"])
@jwt_required()
def customer_profile():
    """Get or update customer profile."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if request.method == 'GET':
        return jsonify({"success": True, "user": user.to_dict()}), 200

    data = request.get_json()
    try:
        if data.get('first_name'):
            user.first_name = data.get('first_name')
        if data.get('last_name'):
            user.last_name = data.get('last_name')
        if data.get('phone_number'):
            user.phone_number = data.get('phone_number')

        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Profile updated successfully",
            "user": user.to_dict(),
        }), 200

    except Exception as e:
        logger.error(f"Error in customer_profile: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
# TRACK
# ============================================================

@customer_bp.route("/track/<tracking_number>", methods=["GET"])
@jwt_required()
def track_parcel(tracking_number):
    """Track a parcel by tracking number."""
    user_id = get_jwt_identity()

    try:
        parcel = (
            Parcel.query
            .options(*_parcel_eager_options())
            .filter_by(tracking_number=tracking_number)
            .first()
        )
        if not parcel:
            return jsonify({"error": "Parcel not found"}), 404

        if parcel.user_id != user_id:
            return jsonify({"error": "Unauthorized: Not your parcel"}), 403

        return jsonify({"success": True, "parcel": parcel.to_dict()}), 200

    except Exception as e:
        logger.error(f"Error in track_parcel: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500