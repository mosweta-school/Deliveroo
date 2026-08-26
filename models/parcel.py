import datetime
import uuid
from flask_sqlalchemy import SQLAlchemy

from app import db


WEIGHT_CATEGORIES = ["Light", "Medium", "Heavy"]


def generate_tracking_number():
    return "TRK-" + uuid.uuid4().hex[:8].upper()


class Parcel(db.Model):
    __tablename__ = "parcels"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    pickup_location_id = db.Column(
        db.String(36), db.ForeignKey("locations.id"), nullable=False
    )
    destination_id = db.Column(
        db.String(36), db.ForeignKey("locations.id"), nullable=False
    )
    weight = db.Column(db.Float, nullable=False)
    weight_category = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Pending")
    tracking_number = db.Column(db.String(20), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    # Relationships - using string references to avoid circular dependency issues
    pickup_location = db.relationship("Location", foreign_keys=[pickup_location_id])
    destination = db.relationship("Location", foreign_keys=[destination_id])

    def to_dict(self):
        pickup = (
            self.pickup_location.to_dict() if self.pickup_location else None
        )
        dest = self.destination.to_dict() if self.destination else None
        return {
            "id": self.id,
            "user_id": self.user_id,
            "tracking_number": self.tracking_number,
            "pickup_location": pickup,
            "destination": dest,
            "weight": self.weight,
            "weight_category": self.weight_category,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @property
    def weight_category(self):
        return self._weight_category

    @weight_category.setter
    def weight_category(self, value):
        if value not in WEIGHT_CATEGORIES:
            raise ValueError(f"Invalid weight category. Must be one of: {WEIGHT_CATEGORIES}")
        self._weight_category = value

    def is_delivered(self):
        return self.status == "Delivered"

    def is_cancelable(self):
        return self.status in ("Pending", "In Transit")