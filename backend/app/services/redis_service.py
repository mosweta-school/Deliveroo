# backend/app/services/redis_service.py
import json
from flask import current_app
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.client = None
        self._connect()

    def _connect(self):
        if self.client is not None:
            try:
                self.client.ping()
                return True
            except:
                self.client = None
        
        try:
            import redis
            redis_url = 'redis://localhost:6379/0 || rediss://default:gQAAAAAAAcWJAAIgcDI3ZjliMTc2YTdjNTE0NzdiYWY3NDczNTcwY2Y5ZmNhZA@gentle-jaguar-116105.upstash.io:6379'
            try:
                redis_url = current_app.config.get('REDIS_URL', 'redis://localhost:6379/0','rediss://default:gQAAAAAAAcWJAAIgcDI3ZjliMTc2YTdjNTE0NzdiYWY3NDczNTcwY2Y5ZmNhZA@gentle-jaguar-116105.upstash.io:6379')
            except RuntimeError:
                pass
            
            self.client = redis.from_url(redis_url, decode_responses=True)
            self.client.ping()
            logger.info("✅ Redis connected successfully")
            return True
        except ImportError:
            logger.warning("⚠️ Redis package not installed")
            self.client = None
            return False
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {str(e)}")
            self.client = None
            return False

    def is_connected(self):
        if self.client is None:
            return self._connect()
        try:
            self.client.ping()
            return True
        except:
            self.client = None
            return self._connect()

    def set_rider_location(self, rider_id, latitude, longitude, status='online', speed=0):
        """Store rider location in Redis with expiry - 5 minutes for testing"""
        if not self.is_connected():
            return None
            
        key = f"rider:location:{rider_id}"
        data = {
            'rider_id': rider_id,
            'latitude': latitude,
            'longitude': longitude,
            'status': status,
            'speed': speed,
            'last_updated': datetime.utcnow().isoformat()
        }
        try:
            # --- CHANGE: 300 seconds (5 minutes) instead of 60 ---
            expiry = 300  # Increased from 60 to 300
            try:
                expiry = current_app.config.get('REDIS_LOCATION_EXPIRY', 300)
            except:
                pass
            # --- END CHANGE ---
            
            self.client.setex(key, expiry, json.dumps(data))
            self.client.sadd('rider:locations:active', rider_id)
            logger.info(f"✅ Stored rider {rider_id} location in Redis (expires in {expiry}s)")
            return data
        except Exception as e:
            logger.error(f"❌ Failed to set rider location: {str(e)}")
            return None

    def get_rider_location(self, rider_id):
        if not self.is_connected():
            return None
            
        key = f"rider:location:{rider_id}"
        try:
            data = self.client.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.error(f"❌ Failed to get rider location: {str(e)}")
        return None

    def get_all_rider_locations(self):
        """Get all active rider locations from Redis"""
        if not self.is_connected():
            return []
            
        try:
            rider_ids = self.client.smembers('rider:locations:active')
            locations = []
            for rider_id in rider_ids:
                rider_id = rider_id.decode() if isinstance(rider_id, bytes) else rider_id
                location = self.get_rider_location(rider_id)
                if location:
                    locations.append(location)
                else:
                    # Clean up stale entries
                    self.client.srem('rider:locations:active', rider_id)
            return locations
        except Exception as e:
            logger.error(f"❌ Failed to get all rider locations: {str(e)}")
            return []

    def remove_rider_location(self, rider_id):
        if not self.is_connected():
            return
            
        try:
            key = f"rider:location:{rider_id}"
            self.client.delete(key)
            self.client.srem('rider:locations:active', rider_id)
        except Exception as e:
            logger.error(f"❌ Failed to remove rider location: {str(e)}")

    def add_rider_path_point(self, rider_id, latitude, longitude):
        if not self.is_connected():
            return
            
        try:
            key = f"rider:path:{rider_id}"
            point = f"{latitude},{longitude}"
            self.client.lpush(key, point)
            self.client.ltrim(key, 0, 49)
            self.client.expire(key, 300)
        except Exception as e:
            logger.error(f"❌ Failed to add path point: {str(e)}")

    def get_rider_path(self, rider_id):
        if not self.is_connected():
            return []
            
        try:
            key = f"rider:path:{rider_id}"
            points = self.client.lrange(key, 0, -1)
            return [{'lat': float(p.split(',')[0]), 'lng': float(p.split(',')[1])} for p in points]
        except Exception as e:
            logger.error(f"❌ Failed to get rider path: {str(e)}")
            return []

# Create singleton instance
redis_service = RedisService()