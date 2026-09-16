# backend/app/models/payment.py
import uuid
from datetime import datetime

from app.extensions import db


class Payment(db.Model):
    """A payment event against a parcel.

    Kept as its own entity rather than columns on Parcel because payments
    have their own lifecycle: a deposit and a balance are two payments on
    one parcel; a failed attempt and a successful retry are two rows; a
    refund is a third row. Parcel stores the *policy* (deposit_percent,
    deposit_amount, amount_due), Payment stores the *events*.
    """

    __tablename__ = "payments"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    parcel_id = db.Column(db.String(36), db.ForeignKey("parcels.id"), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)

    # What this payment is for
    type = db.Column(db.String(20), nullable=False)          # 'deposit' | 'balance' | 'refund'
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), nullable=False, default="KES")

    # How it was paid
    method = db.Column(db.String(20), nullable=False)         # 'mpesa' | 'card' | 'cash'
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    # status: 'pending' | 'completed' | 'failed' | 'refunded'

    # External / transaction references
    reference = db.Column(db.String(64), nullable=True, unique=True, index=True)
    phone = db.Column(db.String(20), nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)
    failure_reason = db.Column(db.String(255), nullable=True)

    # M-Pesa-shaped metadata so receipts render correctly
    checkout_request_id = db.Column(db.String(64), nullable=True)
    merchant_request_id = db.Column(db.String(64), nullable=True)
    mpesa_receipt = db.Column(db.String(64), nullable=True)
    raw_callback = db.Column(db.JSON, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parcel = db.relationship("Parcel", back_populates="payments", lazy=True)
    user = db.relationship("User", back_populates="payments", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "parcel_id": self.parcel_id,
            "user_id": self.user_id,
            "type": self.type,
            "amount": self.amount,
            "currency": self.currency,
            "method": self.method,
            "status": self.status,
            "reference": self.reference,
            "phone": self.phone,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "failure_reason": self.failure_reason,
            "mpesa_receipt": self.mpesa_receipt,
            "checkout_request_id": self.checkout_request_id,
            "merchant_request_id": self.merchant_request_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Payment {self.id} {self.type} {self.amount} {self.status}>"