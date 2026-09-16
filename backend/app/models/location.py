# backend/app/models/location.py
import uuid
from datetime import datetime
from app.extensions import db


class Location(db.Model):
    __tablename__ = "locations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    address = db.Column(db.String(255), nullable=True)
    street_address = db.Column(db.String(255), nullable=True)   # NEW
    city = db.Column(db.String(100), nullable=True)
    county = db.Column(db.String(100), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    pickup_parcels = db.relationship(
        'Parcel',
        foreign_keys='Parcel.pickup_location_id',
        backref='pickup_location_ref',
        lazy=True,
        overlaps="pickup_location,pickup_location_ref"
    )
    destination_parcels = db.relationship(
        'Parcel',
        foreign_keys='Parcel.destination_id',
        backref='destination_ref',
        lazy=True,
        overlaps="destination,destination_ref"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "address": self.address,
            "street_address": self.street_address,   # NEW
            "city": self.city,
            "county": self.county,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __init__(self, address=None, street_address=None, city=None, county=None,
                 latitude=None, longitude=None):
        self.address = address
        self.street_address = street_address
        self.city = city
        self.county = county
        self.latitude = latitude
        self.longitude = longitude