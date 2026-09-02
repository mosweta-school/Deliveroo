"""
Centralized application configuration.

Everyone reads config through `app.config[...]` inside Flask (that's the
standard Flask pattern) rather than calling os.getenv() directly in their
own modules — one source of truth for every env-derived value.
"""

import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    APP_NAME = os.getenv("APP_NAME", "SendIT API")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-fallback-do-not-use-in-prod")

    # --- Database ---
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Auth (Flask-JWT-Extended) ---
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)))

    # --- Email (Flask-Mail) ---
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"
    MAIL_USERNAME = os.getenv("EMAIL")
    MAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("EMAIL")

    # --- CORS ---
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

    # --- M-Pesa STK Push ---
    MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY", "")
    MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET", "")
    MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE", "")
    MPESA_CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL", "")
    MPESA_ENVIRONMENT = os.getenv("MPESA_ENVIRONMENT", "sandbox")  # sandbox or production
    MPESA_PASSKEY = os.getenv("MPESA_PASSKEY", "")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    # Tests never touch the real Supabase database — isolated in-memory sqlite instead.
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
