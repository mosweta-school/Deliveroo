import os

from flask import Flask, jsonify

from app.config import config_map
from app.errors import register_error_handlers
from app.extensions import bcrypt, cors, db, jwt, mail, ma, migrate
from app.logging_config import setup_logging


def create_app(config_name: str | None = None) -> Flask:
    config_name = config_name or os.getenv("ENVIRONMENT", "development")

    app = Flask(__name__)
    app.config.from_object(config_map[config_name])

    setup_logging(app)

    # --- Extensions ---
    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)

    # Wide open now since there's no frontend integration yet; CORS_ORIGINS in .env
    # controls this — tighten it once the React app's real dev/prod URLs are known.
    cors.init_app(app, resources={r"/*": {"origins": app.config["CORS_ORIGINS"]}}, supports_credentials=True)

    register_error_handlers(app)

    # Ensures every model is registered with db.metadata before Flask-Migrate runs
    from app import models  # noqa: F401

      # --- Blueprints ---
    from app.routes.notification import notification_bp

    app.register_blueprint(notification_bp, url_prefix="/notifications")

    @app.route("/")
    def root():
        return jsonify({"message": f"{app.config['APP_NAME']} is running"})

    @app.route("/health")
    def health_check():
        return jsonify({"status": "healthy", "environment": config_name})

    app.logger.info(f"{app.config['APP_NAME']} created ({config_name})")

    return app
