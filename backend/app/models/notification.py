from datetime import datetime, timezone

from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        nullable=False,
        index=True,
    )

    parcel_id = db.Column(
        db.Integer,
        nullable=True,
        index=True,
    )

    message = db.Column(
        db.String(500),
        nullable=False,
    )

    notification_type = db.Column(
        db.String(50),
        nullable=False,
    )

    is_read = db.Column(
        db.Boolean,
        default=False,
        nullable=False,
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self):
        return f"<Notification {self.id}>"
