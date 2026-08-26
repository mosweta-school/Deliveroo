"""
Global error handlers, registered once in create_app() via register_error_handlers(app).

Nobody else needs to write their own try/except-for-500 boilerplate — raise
abort(404, description="...") (or any werkzeug HTTPException) as usual and
this guarantees a consistent JSON shape:

    {
      "error": true,
      "status_code": 404,
      "message": "Parcel not found",
      "details": null
    }

Marshmallow ValidationErrors are caught automatically too, so schema.load(data)
failures come back as clean 422s instead of raw tracebacks.
"""

import logging

from flask import jsonify
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


def _error_body(status_code: int, message: str, details=None) -> dict:
    return {"error": True, "status_code": status_code, "message": message, "details": details}


def register_error_handlers(app) -> None:
    @app.errorhandler(HTTPException)
    def handle_http_exception(e: HTTPException):
        logger.warning(f"HTTPException: {e.code} — {e.description}")
        return jsonify(_error_body(e.code, e.description)), e.code

    @app.errorhandler(ValidationError)
    def handle_validation_error(e: ValidationError):
        logger.warning(f"Validation error: {e.messages}")
        return jsonify(_error_body(422, "Validation failed", details=e.messages)), 422

    @app.errorhandler(Exception)
    def handle_unexpected_error(e: Exception):
        logger.error(f"Unhandled exception: {e}", exc_info=True)
        return jsonify(_error_body(500, "Internal server error")), 500
