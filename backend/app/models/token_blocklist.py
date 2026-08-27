from datetime import datetime, timezone

from extensions import db


class TokenBlocklist(db.Model):
    """Every revoked JWT's unique id (jti) lives here. Checked on every
    protected request via the token_in_blocklist_loader callback in
    services/jwt_callbacks.py — this is what makes /auth/logout actually work,
    since JWTs are stateless and can't otherwise be un-issued before they
    expire."""

    __tablename__ = "token_blocklist"

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<TokenBlocklist jti={self.jti}>"
