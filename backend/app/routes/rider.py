# backend/app/routes/rider.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.parcel import Parcel
from app.models.parcel_status_history import ParcelStatusHistory
from app.models.user import User
from app.models.location import Location
from datetime import datetime
import traceback

rider_bp = Blueprint("rider", __name__)


def is_rider():
    """Check if current user is a rider/driver"""
    claims = get_jwt()
    return claims.get('role') == 'driver'


@rider_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def get_rider_dashboard():
    """Get rider dashboard data"""
    if not is_rider():
        return jsonify({"error": "Rider access required"}), 403

    rider_id = get_jwt_identity()
    
    try:
        # Get active deliveries (not delivered or cancelled)
        active_deliveries = Parcel.query.filter(
            Parcel.rider_id == rider_id,
            Parcel.status.notin_(['Delivered', 'Cancelled'])
        ).order_by(Parcel.created_at.desc()).all()
        
        # Get completed deliveries
        completed_deliveries = Parcel.query.filter(
            Parcel.rider_id == rider_id,
            Parcel.status == 'Delivered'
        ).order_by(Parcel.updated_at.desc()).limit(10).all()
        
        # Get stats
        total_deliveries = Parcel.query.filter_by(rider_id=rider_id).count()
        completed_count = Parcel.query.filter_by(rider_id=rider_id, status='Delivered').count()
        cancelled_count = Parcel.query.filter_by(rider_id=rider_id, status='Cancelled').count()
        active_count = Parcel.query.filter(
            Parcel.rider_id == rider_id,
            Parcel.status.notin_(['Delivered', 'Cancelled'])
        ).count()
        
        # Get rider info
        rider = User.query.get(rider_id)
        
        return jsonify({
            "success": True,
            "rider": rider.to_dict() if rider else None,
            "stats": {
                "active_deliveries": active_count,
                "completed_deliveries": completed_count,
                "cancelled_deliveries": cancelled_count,
                "total_deliveries": total_deliveries
            },
            "active_deliveries": [parcel.to_dict() for parcel in active_deliveries],
            "completed_deliveries": [parcel.to_dict() for parcel in completed_deliveries]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in get_rider_dashboard: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@rider_bp.route("/parcels/<parcel_id>/pickup", methods=["PUT"])
@jwt_required()
def update_pickup(parcel_id):
    """Rider updates that they have picked up the parcel"""
    if not is_rider():
        return jsonify({"error": "Rider access required"}), 403

    rider_id = get_jwt_identity()
    
    try:
        parcel = Parcel.query.get(parcel_id)
        if not parcel:
            return jsonify({"error": "Parcel not found"}), 404
        
        # Verify rider is assigned to this parcel
        if parcel.rider_id != rider_id:
            return jsonify({"error": "You are not assigned to this parcel"}), 403
        
        # Check if already picked up
        if parcel.status == 'Picked Up':
            return jsonify({"error": "Parcel already picked up"}), 400
        
        if parcel.status == 'Delivered':
            return jsonify({"error": "Parcel already delivered"}), 400
        
        if parcel.status == 'Cancelled':
            return jsonify({"error": "Parcel has been cancelled"}), 400
        
        # Update status
        parcel.status = 'Picked Up'
        parcel.updated_at = datetime.utcnow()
        
        # Add status history
        status_history = ParcelStatusHistory(
            parcel_id=parcel.id,
            status='Picked Up',
            updated_by=rider_id,
            remarks="Parcel picked up by rider"
        )
        db.session.add(status_history)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Parcel marked as picked up",
            "parcel": parcel.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in update_pickup: {str(e)}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@rider_bp.route("/parcels/<parcel_id>/deliver", methods=["PUT"])
@jwt_required()
def update_delivered(parcel_id):
    """Rider marks parcel as delivered"""
    if not is_rider():
        return jsonify({"error": "Rider access required"}), 403

    rider_id = get_jwt_identity()
    data = request.get_json() or {}
    
    try:
        parcel = Parcel.query.get(parcel_id)
        if not parcel:
            return jsonify({"error": "Parcel not found"}), 404
        
        # Verify rider is assigned to this parcel
        if parcel.rider_id != rider_id:
            return jsonify({"error": "You are not assigned to this parcel"}), 403
        
        # Check if already delivered
        if parcel.status == 'Delivered':
            return jsonify({"error": "Parcel already delivered"}), 400
        
        if parcel.status == 'Cancelled':
            return jsonify({"error": "Parcel has been cancelled"}), 400
        
        # Update status
        parcel.status = 'Delivered'
        parcel.updated_at = datetime.utcnow()
        
        # If location provided, update it
        if data.get('address'):
            location = Location(
                address=data.get('address'),
                city=data.get('city', ''),
                county=data.get('county', ''),
                latitude=data.get('latitude'),
                longitude=data.get('longitude')
            )
            db.session.add(location)
            db.session.flush()
        
        # Add status history
        status_history = ParcelStatusHistory(
            parcel_id=parcel.id,
            status='Delivered',
            updated_by=rider_id,
            remarks=data.get('remarks', "Parcel delivered by rider")
        )
        db.session.add(status_history)
        
        # Update rider's delivery count
        rider = User.query.get(rider_id)
        if rider:
            rider.deliveries = (rider.deliveries or 0) + 1
            rider.status = 'Available'  # Rider becomes available again
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Parcel marked as delivered",
            "parcel": parcel.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in update_delivered: {str(e)}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@rider_bp.route("/parcels/<parcel_id>/status", methods=["PUT"])
@jwt_required()
def update_status(parcel_id):
    """Rider updates parcel status (In Transit)"""
    if not is_rider():
        return jsonify({"error": "Rider access required"}), 403

    rider_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or "status" not in data:
        return jsonify({"error": "Status is required"}), 400
    
    new_status = data.get("status")
    valid_statuses = ['In Transit']
    
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
    
    try:
        parcel = Parcel.query.get(parcel_id)
        if not parcel:
            return jsonify({"error": "Parcel not found"}), 404
        
        # Verify rider is assigned to this parcel
        if parcel.rider_id != rider_id:
            return jsonify({"error": "You are not assigned to this parcel"}), 403
        
        # Check status flow
        if parcel.status == 'Pending':
            return jsonify({"error": "Please pick up the parcel first"}), 400
        
        if parcel.status == 'Delivered':
            return jsonify({"error": "Parcel already delivered"}), 400
        
        if parcel.status == 'Cancelled':
            return jsonify({"error": "Parcel has been cancelled"}), 400
        
        # Update status
        parcel.status = new_status
        parcel.updated_at = datetime.utcnow()
        
        # Add status history
        status_history = ParcelStatusHistory(
            parcel_id=parcel.id,
            status=new_status,
            updated_by=rider_id,
            remarks=data.get('remarks', f"Status updated to {new_status}")
        )
        db.session.add(status_history)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Parcel status updated to {new_status}",
            "parcel": parcel.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in update_status: {str(e)}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@rider_bp.route("/profile", methods=["GET", "PUT"])
@jwt_required()
def rider_profile():
    """Get or update rider profile"""
    if not is_rider():
        return jsonify({"error": "Rider access required"}), 403

    rider_id = get_jwt_identity()
    rider = User.query.get(rider_id)
    
    if not rider:
        return jsonify({"error": "Rider not found"}), 404
    
    if request.method == 'GET':
        return jsonify({
            "success": True,
            "rider": rider.to_dict()
        }), 200
    
    # PUT - Update profile
    data = request.get_json()
    
    try:
        if data.get('vehicle'):
            rider.vehicle = data.get('vehicle')
        if data.get('plate'):
            rider.plate = data.get('plate')
        if data.get('phone_number'):
            rider.phone_number = data.get('phone_number')
        
        # Update availability status
        if data.get('status') in ['Available', 'Offline', 'On Break']:
            # Check if rider has active deliveries before going offline
            if data.get('status') == 'Offline':
                active = Parcel.query.filter(
                    Parcel.rider_id == rider.id,
                    Parcel.status.notin_(['Delivered', 'Cancelled'])
                ).first()
                if active:
                    return jsonify({
                        "error": "Cannot go offline. You have active deliveries."
                    }), 400
            rider.status = data.get('status')
        
        rider.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Profile updated successfully",
            "rider": rider.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in rider_profile: {str(e)}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500