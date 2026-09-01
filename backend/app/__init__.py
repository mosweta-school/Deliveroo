import os

from flask import Flask, jsonify, send_from_directory

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
    # Each member registers their own blueprint here once it exists. Example:
    #
    #   from app.routes.auth import auth_bp                  # Member 1
    #   from app.routes.parcel import parcel_bp               # Member 2
    #   from app.routes.admin import admin_bp                  # Member 3
    #   from app.routes.notification import notification_bp     # Member 3
    #
    #   app.register_blueprint(auth_bp, url_prefix="/auth")
    #   app.register_blueprint(parcel_bp, url_prefix="/parcels")
    #   app.register_blueprint(admin_bp, url_prefix="/admin")
    #   app.register_blueprint(notification_bp, url_prefix="/notifications")

    # --- M-Pesa STK Push ---
    from app.routes.mpesa import mpesa_bp
    app.register_blueprint(mpesa_bp, url_prefix="/mpesa")

    # --- Parcel CRUD ---
    from app.routes.parcel import parcel_bp
    app.register_blueprint(parcel_bp, url_prefix="/parcels")

    @app.route("/swagger.yaml")
    def swagger_yaml():
        return send_from_directory('/home/allan-kimani/Deliveroo/backend', 'swagger.yaml', mimetype='text/yaml')

    @app.route("/")
    def root():
        return jsonify({"message": f"{app.config['APP_NAME']} is running"})

    @app.route("/health")
    def health_check():
        return jsonify({"status": "healthy", "environment": config_name})

    app.logger.info(f"{app.config['APP_NAME']} created ({config_name})")

    return app