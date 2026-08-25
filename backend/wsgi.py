"""
Production entry point.

    gunicorn wsgi:app

Flask-Migrate's CLI also needs this: it's what FLASK_APP should point to.
"""

from app import create_app

app = create_app()
