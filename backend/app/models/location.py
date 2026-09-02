import uuid
import datetime
from flask_sqlalchemy import SQLAlchemy

# Import db from app to use the same instance
from app import db


class Location(db.Model):
    __tablename__ = "locations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    address = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __init__(self, address=None, latitude=None, longitude=None):
        self.address = address
        self.latitude = latitude
        self.longitude = longitude