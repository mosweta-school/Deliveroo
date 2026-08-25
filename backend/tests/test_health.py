"""
Example test — copy this pattern for your own module's tests.
Run all tests with: pytest
"""


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "running" in response.get_json()["message"]


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.get_json()
    assert body["status"] == "healthy"
