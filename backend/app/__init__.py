# app/__init__.py - For Flasgger >= 0.9.7.1
import os

from flask import Flask, jsonify, send_from_directory
from flasgger import Swagger, swag_from

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
    
    # Swagger configuration
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec',
                "route": '/apispec.json',
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/"
    }
    
    # Initialize Swagger
    swagger = Swagger(app, config=swagger_config)
    
    # Set security definitions
    swagger.template = {
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'"
            }
        },
        "security": [
            {
                "Bearer": []
            }
        ]
    }

    # CORS
    cors.init_app(app, resources={r"/*": {"origins": app.config["CORS_ORIGINS"]}}, supports_credentials=True)

    register_error_handlers(app)

    # Ensures every model is registered with db.metadata before Flask-Migrate runs
    from app import models  # noqa: F401

    # --- Blueprints ---
    from app.routes.auth import auth_bp
    from app.routes.parcel import parcel_bp
    from app.routes.admin import admin_bp
    from app.routes.notification import notification_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(parcel_bp, url_prefix="/parcels")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(notification_bp, url_prefix="/notifications")

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