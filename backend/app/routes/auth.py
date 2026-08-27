from functools import wraps

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from marshmallow import ValidationError

from extensions import limiter
from schemas.user_schema import register_schema, login_schema, user_schema
from services.auth_service import (
    register_user,
    authenticate_user,
    get_user_by_id,
    is_admin,
    revoke_token,
    AuthError,
)
# Registers the JWT blocklist check + error-response callbacks on import.
# Must be imported somewhere before the app serves requests — here is fine
# since this module is always loaded when the blueprint is registered.
from services import jwt_callbacks  # noqa: F401

auth_bp = Blueprint("auth", __name__)


def admin_required(fn):
    """Reusable 'require admin' decorator (Card 4).
    Import this in Wayne's routes/admin.py to protect admin-only endpoints:

        from routes.auth import admin_required

        @admin_bp.route("/parcels", methods=["GET"])
        @admin_required
        def list_all_parcels():
            ...
    """

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        if not is_admin(current_user_id):
            return jsonify({"success": False, "error": "Admin access required"}), 403
        return fn(*args, **kwargs)

    return wrapper


def _issue_tokens(user):
    """Access token is short-lived and sent on every request; refresh token
    is long-lived and only used to get a new access token, so it should be
    stored more carefully on the client (e.g. httpOnly cookie, not localStorage)."""
    access_token = create_access_token(identity=user.id, additional_claims={"role": user.role})
    refresh_token = create_refresh_token(identity=user.id)
    return access_token, refresh_token


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("10 per minute")
def register():
    """POST /auth/register
    Body: { "full_name": str, "email": str, "password": str }
    -> 201 { user } | 422 validation error | 409 duplicate email
    """
    try:
        data = register_schema.load(request.get_json(silent=True) or {})
    except ValidationError as err:
        return jsonify({"success": False, "error": "Validation error", "details": err.messages}), 422

    try:
        user = register_user(data)
    except AuthError as err:
        return jsonify({"success": False, "error": err.message}), err.status_code

    return jsonify({"success": True, "user": user_schema.dump(user)}), 201


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")  # tighter than register — this is the brute-force target
def login():
    """POST /auth/login
    Body: { "email": str, "password": str }
    -> 200 { access_token, refresh_token, user } | 422 validation error | 401 invalid credentials
    """
    try:
        data = login_schema.load(request.get_json(silent=True) or {})
    except ValidationError as err:
        return jsonify({"success": False, "error": "Validation error", "details": err.messages}), 422

    try:
        user = authenticate_user(data["email"], data["password"])
    except AuthError as err:
        return jsonify({"success": False, "error": err.message}), err.status_code

    access_token, refresh_token = _issue_tokens(user)

    return jsonify({
        "success": True,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user_schema.dump(user),
    }), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """POST /auth/refresh — send the refresh token (not the access token) as
    the Bearer token. Returns a new short-lived access token without making
    the user log in again."""
    user_id = get_jwt_identity()

    try:
        user = get_user_by_id(user_id)  # re-check the user still exists / role hasn't changed
    except AuthError as err:
        return jsonify({"success": False, "error": err.message}), err.status_code

    new_access_token = create_access_token(identity=user.id, additional_claims={"role": user.role})
    return jsonify({"success": True, "access_token": new_access_token}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required(verify_type=False)  # accepts EITHER an access or a refresh token
def logout():
    """POST /auth/logout — revokes whichever token (access or refresh) was
    sent. To fully log a user out client-side, call this once with the
    access token and once with the refresh token."""
    jti = get_jwt()["jti"]
    revoke_token(jti)
    return jsonify({"success": True, "message": "Token revoked"}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """GET /auth/me — protected. Returns the current authenticated user's profile."""
    current_user_id = get_jwt_identity()

    try:
        user = get_user_by_id(current_user_id)
    except AuthError as err:
        return jsonify({"success": False, "error": err.message}), err.status_code

    return jsonify({"success": True, "user": user_schema.dump(user)}), 200
