# backend/app/socket_events.py
from flask import request
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from app.extensions import socketio, db
from app.services.redis_service import redis_service
from app.models.user import User
from app.models.parcel import Parcel
from datetime import datetime
import logging
import traceback

logger = logging.getLogger(__name__)

# Store active connections
active_connections = {}

# --- FIX: Define helper function at module level ---
def _get_rider_locations_from_db():
    """Get rider locations from database as fallback"""
    locations = []
    try:
        # Get all drivers with recent location updates
        drivers = User.query.filter_by(role='driver').filter(
            User.current_latitude.isnot(None),
            User.current_longitude.isnot(None),
            User.last_location_update.isnot(None)
        ).all()
        
        for driver in drivers:
            if driver.last_location_update:
                time_diff = (datetime.utcnow() - driver.last_location_update).total_seconds()
                if time_diff < 300:  # Within last 5 minutes
                    location_data = {
                        'rider_id': driver.id,
                        'latitude': driver.current_latitude,
                        'longitude': driver.current_longitude,
                        'status': driver.status or 'online',
                        'last_updated': driver.last_location_update.isoformat()
                    }
                    locations.append(location_data)
                    
                    # Also store back in Redis for future requests
                    redis_service.set_rider_location(
                        driver.id,
                        driver.current_latitude,
                        driver.current_longitude,
                        driver.status or 'online'
                    )
                    logger.info(f"🔄 Restored driver {driver.id} location from database to Redis")
        logger.info(f"📍 Retrieved {len(locations)} riders from database")
    except Exception as e:
        logger.error(f"Error getting riders from database: {str(e)}")
    return locations
# --- END FIX ---


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    
    token = request.args.get('token')
    if not token:
        logger.warning(f"Client {request.sid} connected without token")
        return False
    
    try:
        decoded = decode_token(token)
        user_id = decoded.get('sub')
        user_role = decoded.get('role')
        
        if not user_id:
            return False
        
        # Store connection
        active_connections[user_id] = {
            'sid': request.sid,
            'role': user_role,
            'connected_at': datetime.utcnow()
        }
        
        join_room(f"user_{user_id}")
        
        if user_role == 'driver':
            join_room('rider_room')
            location = redis_service.get_rider_location(user_id)
            if location:
                emit('rider_location_update', location, room='admin_room')
        
        if user_role == 'admin':
            join_room('admin_room')
            all_locations = redis_service.get_all_rider_locations()
            
            # --- FIX: Use the module-level function ---
            if not all_locations or len(all_locations) == 0:
                logger.info("📍 Redis empty on admin connect, fetching from database...")
                all_locations = _get_rider_locations_from_db()
            # --- END FIX ---
            
            if all_locations:
                for loc in all_locations:
                    rider = User.query.get(loc.get('rider_id'))
                    if rider:
                        loc['rider_name'] = rider.full_name
                        current_parcel = Parcel.query.filter(
                            Parcel.rider_id == rider.id,
                            Parcel.status.notin_(['Delivered', 'Cancelled'])
                        ).first()
                        if current_parcel:
                            loc['current_parcel'] = current_parcel.tracking_number
                            loc['parcel_status'] = current_parcel.status
                            loc['destination'] = current_parcel.destination.to_dict() if current_parcel.destination else None
                emit('all_rider_locations', all_locations, room=request.sid)
        
        return True
        
    except Exception as e:
        logger.error(f"Connection error: {str(e)}")
        logger.error(traceback.format_exc())
        return False


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")
    
    for user_id, conn in list(active_connections.items()):
        if conn['sid'] == request.sid:
            if conn['role'] == 'driver':
                redis_service.remove_rider_location(user_id)
                emit('rider_offline', {'rider_id': user_id}, room='admin_room')
            del active_connections[user_id]
            break


@socketio.on('authenticate')
def handle_authenticate(data):
    """Authenticate user and assign role"""
    try:
        user_id = data.get('user_id')
        role = data.get('role')
        
        if not user_id:
            return {'error': 'User ID required'}
        
        # Update or create connection entry
        if user_id in active_connections:
            active_connections[user_id]['sid'] = request.sid
            active_connections[user_id]['role'] = role
            active_connections[user_id]['connected_at'] = datetime.utcnow()
        else:
            active_connections[user_id] = {
                'sid': request.sid,
                'role': role,
                'connected_at': datetime.utcnow()
            }
        
        # Join appropriate room
        if role == 'driver':
            join_room('rider_room')
            # Send last known location
            location = redis_service.get_rider_location(user_id)
            if location:
                emit('rider_location_update', location, room='admin_room')
        elif role == 'admin':
            join_room('admin_room')
            # Send all riders on authentication
            locations = redis_service.get_all_rider_locations()
            
            # --- FIX: Use the module-level function ---
            if not locations or len(locations) == 0:
                locations = _get_rider_locations_from_db()
            # --- END FIX ---
            
            for loc in locations:
                rider = User.query.get(loc.get('rider_id'))
                if rider:
                    loc['rider_name'] = rider.full_name
                    current_parcel = Parcel.query.filter(
                        Parcel.rider_id == rider.id,
                        Parcel.status.notin_(['Delivered', 'Cancelled'])
                    ).first()
                    if current_parcel:
                        loc['current_parcel'] = current_parcel.tracking_number
                        loc['parcel_status'] = current_parcel.status
                        loc['destination'] = current_parcel.destination.to_dict() if current_parcel.destination else None
            
            if locations:
                emit('all_rider_locations', locations, room=request.sid)
        
        logger.info(f"✅ User {user_id} authenticated as {role} on socket {request.sid}")
        return {'success': True, 'role': role}
        
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        logger.error(traceback.format_exc())
        return {'error': str(e)}


@socketio.on('update_location')
def handle_location_update(data):
    """Handle rider location update"""
    try:
        user_id = None
        for uid, conn in active_connections.items():
            if conn['sid'] == request.sid:
                user_id = uid
                break
        
        if not user_id:
            return {'error': 'User not found'}
        
        user = User.query.get(user_id)
        if not user or user.role != 'driver':
            return {'error': 'Not a rider'}
        
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        status = data.get('status', 'online')
        speed = data.get('speed', 0)
        
        if latitude is None or longitude is None:
            return {'error': 'Invalid coordinates'}
        
        # Store in Redis
        location_data = redis_service.set_rider_location(
            user_id, latitude, longitude, status, speed
        )
        
        # Store in database as backup
        if user:
            user.current_latitude = latitude
            user.current_longitude = longitude
            user.last_location_update = datetime.utcnow()
            user.status = status
            db.session.commit()
            logger.info(f"✅ Stored rider {user_id} location in database")
        
        if not location_data:
            return {'error': 'Failed to store location'}
        
        redis_service.add_rider_path_point(user_id, latitude, longitude)
        
        current_parcel = Parcel.query.filter(
            Parcel.rider_id == user_id,
            Parcel.status.notin_(['Delivered', 'Cancelled'])
        ).first()
        
        update_data = {
            'rider_id': user_id,
            'rider_name': user.full_name,
            'latitude': latitude,
            'longitude': longitude,
            'status': status,
            'speed': speed,
            'last_updated': location_data.get('last_updated', datetime.utcnow().isoformat()),
            'current_parcel': current_parcel.tracking_number if current_parcel else None,
            'parcel_status': current_parcel.status if current_parcel else None,
            'destination': current_parcel.destination.to_dict() if current_parcel and current_parcel.destination else None
        }
        
        emit('rider_location_update', update_data, room='admin_room')
        
        if current_parcel:
            customer_room = f"user_{current_parcel.user_id}"
            emit('rider_location_update', update_data, room=customer_room)
        
        return {'success': True}
        
    except Exception as e:
        logger.error(f"Location update error: {str(e)}")
        logger.error(traceback.format_exc())
        return {'error': str(e)}


@socketio.on('rider_status_update')
def handle_rider_status(data):
    """Handle rider status change"""
    try:
        user_id = None
        for uid, conn in active_connections.items():
            if conn['sid'] == request.sid:
                user_id = uid
                break
        
        if not user_id:
            return {'error': 'User not found'}
        
        new_status = data.get('status')
        if new_status not in ['online', 'offline', 'on_break']:
            return {'error': 'Invalid status'}
        
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}
        
        status_mapping = {
            'online': 'Available',
            'offline': 'Offline',
            'on_break': 'On Break'
        }
        user.status = status_mapping.get(new_status, 'Available')
        db.session.commit()
        
        if new_status == 'offline':
            redis_service.remove_rider_location(user_id)
            emit('rider_offline', {'rider_id': user_id}, room='admin_room')
        else:
            location = redis_service.get_rider_location(user_id)
            if location:
                emit('rider_location_update', {
                    'rider_id': user_id,
                    'rider_name': user.full_name,
                    'latitude': location.get('latitude'),
                    'longitude': location.get('longitude'),
                    'status': 'online',
                    'last_updated': location.get('last_updated')
                }, room='admin_room')
        
        return {'success': True, 'status': new_status}
        
    except Exception as e:
        logger.error(f"Status update error: {str(e)}")
        logger.error(traceback.format_exc())
        return {'error': str(e)}


@socketio.on('get_all_riders')
def handle_get_all_riders(data=None):
    """Send all active riders to admin - with database fallback"""
    try:
        user_id = None
        for uid, conn in active_connections.items():
            if conn['sid'] == request.sid and conn['role'] == 'admin':
                user_id = uid
                break
        
        if not user_id:
            return {'error': 'Admin access required'}
        
        # Try Redis first
        locations = redis_service.get_all_rider_locations()
        
        # --- FIX: Use the module-level function ---
        if not locations or len(locations) == 0:
            logger.info("📍 Redis empty, fetching from database...")
            locations = _get_rider_locations_from_db()
        # --- END FIX ---
        
        for loc in locations:
            rider = User.query.get(loc.get('rider_id'))
            if rider:
                loc['rider_name'] = rider.full_name
                current_parcel = Parcel.query.filter(
                    Parcel.rider_id == rider.id,
                    Parcel.status.notin_(['Delivered', 'Cancelled'])
                ).first()
                if current_parcel:
                    loc['current_parcel'] = current_parcel.tracking_number
                    loc['parcel_status'] = current_parcel.status
                    loc['destination'] = current_parcel.destination.to_dict() if current_parcel.destination else None
        
        logger.info(f"📍 Sending {len(locations)} riders to admin")
        emit('all_rider_locations', locations, room=request.sid)
        return {'success': True, 'count': len(locations)}
        
    except Exception as e:
        logger.error(f"Get all riders error: {str(e)}")
        logger.error(traceback.format_exc())
        return {'error': str(e)}