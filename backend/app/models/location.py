# app/models/location.py
import uuid  # Add this import
from datetime import datetime
from app.extensions import db

class Location(db.Model):
    __tablename__ = "locations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    county = db.Column(db.String(100), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships - add overlaps parameter to fix warnings
    pickup_parcels = db.relationship(
        'Parcel', 
        foreign_keys='Parcel.pickup_location_id',
        backref='pickup_location_ref',
        lazy=True,
        overlaps="pickup_location,pickup_location_ref"  # Add this
    )
    destination_parcels = db.relationship(
        'Parcel', 
        foreign_keys='Parcel.destination_id',
        backref='destination_ref',
        lazy=True,
        overlaps="destination,destination_ref"  # Add this
    )

    def to_dict(self):
        return {
            "id": self.id,
            "address": self.address,
            "city": self.city,
            "county": self.county,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __init__(self, address=None, city=None, county=None, latitude=None, longitude=None):
        self.address = address
        self.city = city
        self.county = county
        self.latitude = latitude
        self.longitude = longitude