import pytest

from app import create_app
from extensions import db


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def register(client, email="test@example.com", password="password123", full_name="Test User"):
    return client.post("/auth/register", json={
        "full_name": full_name,
        "email": email,
        "password": password,
    })


def login(client, email="test@example.com", password="password123"):
    return client.post("/auth/login", json={"email": email, "password": password})


# ---- register ---------------------------------------------------------

def test_register_success(client):
    resp = register(client)
    assert resp.status_code == 201
    assert resp.json["success"] is True
    assert resp.json["user"]["email"] == "test@example.com"
    assert resp.json["user"]["role"] == "customer"
    assert "password_hash" not in resp.json["user"]


def test_register_missing_fields(client):
    resp = client.post("/auth/register", json={"email": "bad@example.com"})
    assert resp.status_code == 422


def test_register_duplicate_email(client):
    register(client)
    resp = register(client)
    assert resp.status_code == 409


def test_register_cannot_set_own_role(client):
    """RegisterSchema has no 'role' field, and marshmallow's default is to
    reject unknown fields rather than silently drop them — so this request
    is refused outright, not quietly downgraded. Either way, nobody becomes
    an admin through this endpoint."""
    resp = client.post("/auth/register", json={
        "full_name": "Sneaky",
        "email": "sneaky@example.com",
        "password": "password123",
        "role": "admin",
    })
    assert resp.status_code == 422


# ---- login --------------------------------------------------------------

def test_login_success(client):
    register(client)
    resp = login(client)
    assert resp.status_code == 200
    assert "access_token" in resp.json
    assert "refresh_token" in resp.json


def test_login_wrong_password(client):
    register(client)
    resp = login(client, password="wrongpassword")
    assert resp.status_code == 401


def test_login_unknown_email(client):
    resp = login(client, email="nouser@example.com", password="whatever123")
    assert resp.status_code == 401


# ---- /me ------------------------------------------------------------------

def test_me_requires_token(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_me_with_valid_token(client):
    register(client)
    token = login(client).json["access_token"]

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json["user"]["email"] == "test@example.com"


# ---- refresh ----------------------------------------------------------

def test_refresh_issues_new_access_token(client):
    register(client)
    refresh_token = login(client).json["refresh_token"]

    resp = client.post("/auth/refresh", headers={"Authorization": f"Bearer {refresh_token}"})
    assert resp.status_code == 200
    assert "access_token" in resp.json


def test_refresh_rejects_access_token(client):
    """An access token must NOT work on /refresh — only a real refresh token should."""
    register(client)
    access_token = login(client).json["access_token"]

    resp = client.post("/auth/refresh", headers={"Authorization": f"Bearer {access_token}"})
    # 401, not 200 — our invalid_token_loader (services/jwt_callbacks.py) normalizes
    # this to match the rest of the API's error shape instead of the library's default.
    assert resp.status_code == 401


# ---- logout / revocation -----------------------------------------------

def test_logout_revokes_access_token(client):
    register(client)
    access_token = login(client).json["access_token"]

    logout_resp = client.post("/auth/logout", headers={"Authorization": f"Bearer {access_token}"})
    assert logout_resp.status_code == 200

    # The same token must now be rejected everywhere.
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_resp.status_code == 401


def test_logout_revokes_refresh_token(client):
    register(client)
    refresh_token = login(client).json["refresh_token"]

    logout_resp = client.post("/auth/logout", headers={"Authorization": f"Bearer {refresh_token}"})
    assert logout_resp.status_code == 200

    refresh_resp = client.post("/auth/refresh", headers={"Authorization": f"Bearer {refresh_token}"})
    assert refresh_resp.status_code == 401
