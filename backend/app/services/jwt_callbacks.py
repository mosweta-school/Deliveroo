"""
JWT lifecycle callbacks for Flask-JWT-Extended.

These are registered as soon as this module is imported (via routes/auth.py),
so they don't need any extra wiring in app/__init__.py. Two jobs:

1. token_in_blocklist_loader — makes /auth/logout actually revoke a token,
   instead of just being a no-op the client politely agrees to forget.
2. The four error callbacks — without these, an expired/invalid/missing/
   revoked token returns Flask-JWT-Extended's own default JSON shape, which
   doesn't match the { "success": false, "error": "..." } shape the rest of
   this API uses. Kept consistent here so the frontend only has to handle
   one error format everywhere.
"""

from flask import jsonify

from extensions import jwt
from services.auth_service import is_token_revoked


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    return is_token_revoked(jwt_payload["jti"])


@jwt.revoked_token_loader
def revoked_token_response(jwt_header, jwt_payload):
    return jsonify({"success": False, "error": "Token has been revoked"}), 401


@jwt.expired_token_loader
def expired_token_response(jwt_header, jwt_payload):
    return jsonify({"success": False, "error": "Token has expired"}), 401


@jwt.invalid_token_loader
def invalid_token_response(reason):
    return jsonify({"success": False, "error": "Invalid token"}), 401


@jwt.unauthorized_loader
def missing_token_response(reason):
    return jsonify({"success": False, "error": "Missing authorization token"}), 401
