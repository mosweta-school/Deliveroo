import logging

from extensions import db, bcrypt
from models.user import User
from models.token_blocklist import TokenBlocklist

logger = logging.getLogger(__name__)


class AuthError(Exception):
    """Raised for any auth-related failure the route should turn into an
    error response. Keeps routes/auth.py thin — no HTTP concerns in here."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def register_user(data: dict) -> User:
    """Create a new customer account. Raises AuthError(409) on duplicate email.
    Role is always 'customer' here — self-registration can never grant admin."""
    email = data["email"].lower().strip()

    if db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none():
        raise AuthError("Email already registered", 409)

    password_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = User(
        full_name=data["full_name"].strip(),
        email=email,
        password_hash=password_hash,
        role="customer",
    )
    db.session.add(user)
    db.session.commit()
    logger.info("New user registered: %s", user.email)
    return user


def authenticate_user(email: str, password: str) -> User:
    """Verify credentials. Raises AuthError(401) on any mismatch — deliberately
    the SAME message for 'no such user' and 'wrong password', so a caller
    can't use the error to enumerate which emails are registered."""
    user = db.session.execute(db.select(User).filter_by(email=email.lower().strip())).scalar_one_or_none()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        logger.warning("Failed login attempt for email: %s", email)
        raise AuthError("Invalid email or password", 401)

    return user


def get_user_by_id(user_id: str) -> User:
    user = db.session.get(User, user_id)
    if not user:
        raise AuthError("User not found", 404)
    return user


def is_admin(user_id: str) -> bool:
    """Reusable role check other members' modules can import too, e.g.
    Allan/Wayne guarding admin-only parcel/status endpoints."""
    user = db.session.get(User, user_id)
    return bool(user and user.role == "admin")


def revoke_token(jti: str) -> None:
    """Blacklist a token's jti so it's rejected on every future request even
    though it hasn't expired yet — this is what /auth/logout calls."""
    db.session.add(TokenBlocklist(jti=jti))
    db.session.commit()


def is_token_revoked(jti: str) -> bool:
    return db.session.execute(
        db.select(TokenBlocklist.id).filter_by(jti=jti)
    ).scalar_one_or_none() is not None
