"""
pytest-flask looks for a fixture named `app` and automatically gives you a
`client` fixture built from it — no need to redefine `client` yourself.

Each test gets a fresh in-memory SQLite database via the "testing" config,
so tests never touch the real Supabase database.
"""

import pytest

from app import create_app
from app.extensions import db as _db


@pytest.fixture
def app():
    flask_app = create_app("testing")

    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.session.remove()
        _db.drop_all()
