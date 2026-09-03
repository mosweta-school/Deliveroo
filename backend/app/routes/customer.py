# backend/app/routes/customer.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.parcel import Parcel
from app.models.parcel_status_history import ParcelStatusHistory
from app.models.user import User
from app.models.location import Location
from app.services.notification_service import notify_destination_updated, notify_parcel_cancelled
from datetime import datetime
import traceback

customer_bp = Blueprint("customer", __name__)


def is_customer():
    """Check if current user is a customer"""
    claims = get_jwt()
    return claims.get('role') == 'customer'


@customer_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def get_customer_dashboard():
    """Get customer dashboard data"""
    user_id = get_jwt_identity()
    
    try:
        # Get all parcels for this user
        parcels = Parcel.query.filter_by(user_id=user_id).order_by(Parcel.created_at.desc()).all()
        
        # Get stats
        total_orders = len(parcels)
        active_orders = len([p for p in parcels if p.status not in ['Delivered', 'Cancelled']])
        completed_orders = len([p for p in parcels if p.status == 'Delivered'])
        pending_orders = len([p for p in parcels if p.status == 'Pending'])
        
        # Get user info
        user = User.query.get(user_id)
        
        return jsonify({
            "success": True,
            "user": user.to_dict() if user else None,
            "stats": {
                "total_orders": total_orders,
                "active_orders": active_orders,
                "completed_orders": completed_orders,
                "pending_orders": pending_orders
            },
            "recent_orders": [parcel.to_dict() for parcel in parcels[:5]],
            "all_orders": [parcel.to_dict() for parcel in parcels]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in get_customer_dashboard: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@customer_bp.route("/orders", methods=["GET"])
@jwt_required()
def get_customer_orders():
    """Get all orders for the current customer with pagination"""
    user_id = get_jwt_identity()
    
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    status = request.args.get("status", None)
    
    try:
        query = Parcel.query.filter_by(user_id=user_id)
        
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
            "pages": paginated.pages
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in get_customer_orders: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@customer_bp.route("/orders/<order_id>", methods=["GET"])
@jwt_required()
def get_customer_order(order_id):
    """Get a specific order by ID"""
    user_id = get_jwt_identity()
    
    try:
        parcel = Parcel.query.get(order_id)
        if not parcel:
            return jsonify({"error": "Order not found"}), 404
        
        # Verify ownership
        if parcel.user_id != user_id:
            return jsonify({"error": "Unauthorized: Not your order"}), 403
        
        return jsonify({
            "success": True,
            "order": parcel.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in get_customer_order: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@customer_bp.route("/orders/<order_id>/destination", methods=["PATCH"])
@jwt_required()
def update_order_destination(order_id):
    """Update the destination of an order"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or "destination" not in data:
        return jsonify({"error": "Destination is required"}), 400
    
    try:
        parcel = Parcel.query.get(order_id)
        if not parcel:
            return jsonify({"error": "Order not found"}), 404
        
        # Verify ownership
        if parcel.user_id != user_id:
            return jsonify({"error": "Unauthorized: Not your order"}), 403
        
        # Check if order can be modified (MVP: only before delivered)
        if parcel.status == 'Delivered':
            return jsonify({"error": "Cannot update destination: order already delivered"}), 400
        
        if parcel.status == 'Cancelled':
            return jsonify({"error": "Cannot update destination: order already cancelled"}), 400
        
        # Store old destination for notification
        old_destination = parcel.destination.address if parcel.destination else None
        
        # Update destination
        destination_data = data.get("destination", {})
        
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
                longitude=destination_data.get("longitude")
            )
        
        parcel.updated_at = datetime.utcnow()
        
        # Add status history
        status_history = ParcelStatusHistory(
            parcel_id=parcel.id,
            status=parcel.status,
            updated_by=user_id,
            remarks=f"Destination updated to: {destination_data.get('address', 'N/A')}"
        )
        db.session.add(status_history)
        
        db.session.commit()
        
        # Send notification
        notify_destination_updated(parcel, old_destination, destination_data.get('address', 'N/A'))
        
        return jsonify({
            "success": True,
            "message": "Destination updated successfully",
            "order": parcel.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in update_order_destination: {str(e)}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@customer_bp.route("/orders/<order_id>/cancel", methods=["PATCH"])
@jwt_required()
def cancel_customer_order(order_id):
    """Cancel an order"""
    user_id = get_jwt_identity()
    
    try:
        parcel = Parcel.query.get(order_id)
        if not parcel:
            return jsonify({"error": "Order not found"}), 404
        
        # Verify ownership (MVP: Only the user who created the order can cancel)
        if parcel.user_id != user_id:
            return jsonify({"error": "Unauthorized: Not your order"}), 403
        
        # Check if order can be cancelled (MVP: only before delivered)
        if parcel.status == 'Delivered':
            return jsonify({"error": "Cannot cancel: order already delivered"}), 400
        
        if parcel.status == 'Cancelled':
            return jsonify({"error": "Cannot cancel: order already cancelled"}), 400
        
        # Only allow cancellation if status is Pending, Picked Up, or In Transit
        if parcel.status not in ['Pending', 'Picked Up', 'In Transit']:
            return jsonify({"error": f"Cannot cancel: order status is {parcel.status}"}), 400
        
        # Update status
        old_status = parcel.status
        parcel.status = 'Cancelled'
        parcel.updated_at = datetime.utcnow()
        
        # Add status history
        status_history = ParcelStatusHistory(
            parcel_id=parcel.id,
            status='Cancelled',
            updated_by=user_id,
            remarks="Cancelled by customer"
        )
        db.session.add(status_history)
        
        db.session.commit()
        
        # Send notification
        notify_parcel_cancelled(parcel)
        
        return jsonify({
            "success": True,
            "message": "Order cancelled successfully",
            "order": parcel.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in cancel_customer_order: {str(e)}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@customer_bp.route("/profile", methods=["GET", "PUT"])
@jwt_required()
def customer_profile():
    """Get or update customer profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if request.method == 'GET':
        return jsonify({
            "success": True,
            "user": user.to_dict()
        }), 200
    
    # PUT - Update profile
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
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in customer_profile: {str(e)}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@customer_bp.route("/track/<tracking_number>", methods=["GET"])
@jwt_required()
def track_parcel(tracking_number):
    """Track a parcel by tracking number"""
    user_id = get_jwt_identity()
    
    try:
        parcel = Parcel.query.filter_by(tracking_number=tracking_number).first()
        if not parcel:
            return jsonify({"error": "Parcel not found"}), 404
        
        # Check if user has access to this parcel
        if parcel.user_id != user_id:
            return jsonify({"error": "Unauthorized: Not your parcel"}), 403
        
        return jsonify({
            "success": True,
            "parcel": parcel.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in track_parcel: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500