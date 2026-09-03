# backend/app/extensions.py
"""
Shared extension instances.

Created here (unbound) and wired to the app inside create_app() via
.init_app(). Every model, schema, and route imports from HERE, not
by creating a second SQLAlchemy()/JWTManager()/etc. instance somewhere else.

    from app.extensions import db          -> models inherit db.Model
    from app.extensions import ma          -> marshmallow schemas
    from app.extensions import bcrypt      -> password hashing
    from app.extensions import jwt         -> already configured; use
                                               @jwt_required() decorators from
                                               flask_jwt_extended directly in routes
    from app.extensions import mail        -> Flask-Mail, for notification emails
"""

from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flasgger import Swagger
from flask_socketio import SocketIO
swagger = Swagger()

db = SQLAlchemy()
migrate = Migrate()
ma = Marshmallow()
jwt = JWTManager()
bcrypt = Bcrypt()
mail = Mail()
cors = CORS()
socketio = SocketIO(cors_allowed_origins="*", async_mode='eventlet')