# backend/app/models/user.py
import uuid
from datetime import datetime
from app.extensions import db
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = "users"
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    role = db.Column(db.String(20), default='customer')
    
    # Driver-specific fields
    vehicle = db.Column(db.String(100), nullable=True)
    plate = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(20), default='Offline')
    deliveries = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, nullable=True)
    
    # Location fields
    current_latitude = db.Column(db.Float, nullable=True)
    current_longitude = db.Column(db.Float, nullable=True)
    last_location_update = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # --- FIX: Use consistent back_populates for all relationships ---
    parcels = db.relationship('Parcel', foreign_keys='Parcel.user_id', back_populates='user', lazy=True)
    assigned_parcels = db.relationship('Parcel', foreign_keys='Parcel.rider_id', back_populates='rider', lazy=True)
    notifications = db.relationship('Notification', back_populates='user', lazy=True)
    status_updates = db.relationship('ParcelStatusHistory', back_populates='updated_by_user', lazy=True)
    # --- END FIX ---
    
    def set_password(self, password):
        if not password:
            raise ValueError('Password cannot be empty')
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        if not password:
            return False
        return bcrypt.check_password_hash(self.password_hash, password)
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone_number': self.phone_number,
            'role': self.role,
            'full_name': self.full_name,
            'vehicle': self.vehicle,
            'plate': self.plate,
            'status': self.status,
            'deliveries': self.deliveries,
            'rating': self.rating,
            'current_latitude': self.current_latitude,
            'current_longitude': self.current_longitude,
            'last_location_update': self.last_location_update.isoformat() if self.last_location_update else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }