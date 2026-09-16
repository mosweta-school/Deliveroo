# backend/app/models/parcel.py
import uuid
from datetime import datetime

from app.extensions import db

WEIGHT_CATEGORIES = ["Light", "Medium", "Heavy"]


class Parcel(db.Model):
    __tablename__ = "parcels"

    __table_args__ = (
        db.Index('ix_parcels_user_created', 'user_id', db.desc('created_at')),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    rider_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    pickup_location_id = db.Column(db.String(36), db.ForeignKey("locations.id"), nullable=False)
    destination_id = db.Column(db.String(36), db.ForeignKey("locations.id"), nullable=False)

    # Package
    weight = db.Column(db.Float, nullable=False)
    distance = db.Column(db.Float, nullable=True)
    weight_category = db.Column(db.String(20), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_fragile = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text, nullable=True)

    # Sender
    sender_name = db.Column(db.String(100), nullable=True)
    sender_email = db.Column(db.String(255), nullable=True)
    sender_phone = db.Column(db.String(20), nullable=True)

    # Receiver
    receiver_name = db.Column(db.String(100), nullable=True)
    receiver_email = db.Column(db.String(255), nullable=True)
    receiver_phone = db.Column(db.String(20), nullable=True)

    # Pricing and status
    price = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="Pending")
    tracking_number = db.Column(db.String(20), unique=True, nullable=False)

    # Payment policy — computed at order creation, immutable after.
    # Actual payment events live in the payments table.
    deposit_percent = db.Column(db.Integer, nullable=False, default=0)     # 0, 40, or 60
    deposit_amount = db.Column(db.Float, nullable=True)
    amount_due = db.Column(db.Float, nullable=True)                        # price - deposit
    payment_method = db.Column(db.String(20), nullable=True)               # 'deposit' | 'cod'

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], back_populates='parcels')
    rider = db.relationship('User', foreign_keys=[rider_id], back_populates='assigned_parcels')
    pickup_location = db.relationship(
        "Location",
        foreign_keys=[pickup_location_id],
        overlaps="pickup_location_ref,pickup_parcels",
    )
    destination = db.relationship(
        "Location",
        foreign_keys=[destination_id],
        overlaps="destination_ref,destination_parcels",
    )
    status_history = db.relationship(
        "ParcelStatusHistory",
        back_populates="parcel",
        lazy=True,
        order_by="ParcelStatusHistory.created_at.desc()",
    )
    notifications = db.relationship("Notification", back_populates="parcel", lazy=True)
    payments = db.relationship("Payment", back_populates="parcel", lazy=True)

    # ---- Computed payment state ----
    @property
    def paid_amount(self):
        """Sum of completed non-refund payments."""
        return round(
            sum(
                p.amount
                for p in self.payments
                if p.status == 'completed' and p.type in ('deposit', 'balance')
            ),
            2,
        )

    @property
    def is_deposit_paid(self):
        return any(
            p.type == 'deposit' and p.status == 'completed'
            for p in self.payments
        )

    @property
    def is_fully_paid(self):
        return (self.paid_amount or 0) >= (self.price or 0) and (self.price or 0) > 0

    def to_dict(self, include_history=False, include_payments=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "rider_id": self.rider_id,
            "tracking_number": self.tracking_number,
            "pickup_location": self.pickup_location.to_dict() if self.pickup_location else None,
            "destination": self.destination.to_dict() if self.destination else None,
            "weight": self.weight,
            "distance": self.distance,
            "weight_category": self.weight_category,
            "description": self.description,
            "is_fragile": self.is_fragile,
            "notes": self.notes,
            "sender_name": self.sender_name,
            "sender_email": self.sender_email,
            "sender_phone": self.sender_phone,
            "receiver_name": self.receiver_name,
            "receiver_email": self.receiver_email,
            "receiver_phone": self.receiver_phone,
            "price": self.price,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "user": self.user.to_dict() if self.user else None,
            "rider": self.rider.to_dict() if self.rider else None,

            # Payment policy + derived state
            "deposit_percent": self.deposit_percent,
            "deposit_amount": self.deposit_amount,
            "amount_due": self.amount_due,
            "payment_method": self.payment_method,
            "paid_amount": self.paid_amount,
            "is_deposit_paid": self.is_deposit_paid,
            "is_fully_paid": self.is_fully_paid,
        }
        if include_history:
            data["status_history"] = [h.to_dict() for h in self.status_history]
        if include_payments:
            data["payments"] = [p.to_dict() for p in self.payments]
        return data

    def is_delivered(self):
        return self.status == "Delivered"

    def is_cancelable(self):
        return self.status in ("Pending", "In Transit", "Picked Up")