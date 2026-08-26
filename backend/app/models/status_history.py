from datetime import datetime, timezone

from app.extensions import db


class StatusHistory(db.Model):
    __tablename__ = "status_history"

    id = db.Column(db.Integer, primary_key=True)

    parcel_id = db.Column(
        db.Integer,
        nullable=False,
        index=True,
    )

    status = db.Column(
        db.String(50),
        nullable=False,
    )

    changed_by = db.Column(
        db.Integer,
        nullable=False,
        index=True,
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self):
        return f"<StatusHistory {self.id}>"
