# backend/app/models/notification.py
import uuid
from datetime import datetime
from app.extensions import db

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    parcel_id = db.Column(db.String(36), db.ForeignKey("parcels.id"), nullable=True)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)  # Now NOT NULL
    message = db.Column(db.Text, nullable=False)
    data = db.Column(db.JSON, nullable=True, default={})
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='notifications', lazy=True)
    parcel = db.relationship('Parcel', back_populates='notifications', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "parcel_id": self.parcel_id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "data": self.data,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }