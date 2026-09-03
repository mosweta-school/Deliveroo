# backend/app/models/parcel_status_history.py
import uuid
from datetime import datetime
from app.extensions import db

class ParcelStatusHistory(db.Model):
    __tablename__ = "parcel_status_history"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    parcel_id = db.Column(db.String(36), db.ForeignKey("parcels.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    updated_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # --- FIX: Add proper relationship with back_populates ---
    parcel = db.relationship('Parcel', back_populates='status_history', lazy=True)
    updated_by_user = db.relationship('User', back_populates='status_updates', lazy=True)
    # --- END FIX ---

    def to_dict(self):
        return {
            "id": self.id,
            "parcel_id": self.parcel_id,
            "status": self.status,
            "updated_by": self.updated_by,
            "remarks": self.remarks,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }