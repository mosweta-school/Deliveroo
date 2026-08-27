import uuid
from datetime import datetime, timezone

from extensions import db


def _utcnow():
    """Timezone-aware UTC now. Plain datetime.utcnow() is deprecated in
    Python 3.12+ and, worse, produces naive datetimes that silently misbehave
    once compared against timezone-aware ones — so every timestamp in this
    module goes through here instead."""
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="customer")  # "customer" | "admin"
    created_at = db.Column(db.DateTime(timezone=True), default=_utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # Once Allan's Parcel model exists, uncomment this so a user can list
    # their own parcels via user.parcels. Left out for now so this file
    # imports cleanly before models/parcel.py exists.
    # parcels = db.relationship("Parcel", backref="user", lazy="dynamic")

    def __repr__(self):
        return f"<User {self.email}>"
