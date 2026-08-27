from datetime import datetime, timezone

from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models.notification import Notification


def test_get_notifications_requires_auth(client):
    response = client.get("/notifications/")

    assert response.status_code == 401
    assert response.get_json()["msg"] == "Missing Authorization Header"


def test_get_notifications_returns_user_notifications(app, client):
    with app.app_context():
        Notification.query.delete()

        db.session.add_all(
            [
                Notification(
                    user_id=1,
                    parcel_id=101,
                    message="Your parcel has been dispatched.",
                    notification_type="status",
                    is_read=False,
                ),
                Notification(
                    user_id=2,
                    parcel_id=102,
                    message="Your parcel has arrived.",
                    notification_type="status",
                    is_read=True,
                ),
                Notification(
                    user_id=1,
                    parcel_id=103,
                    message="Your parcel is out for delivery.",
                    notification_type="status",
                    is_read=False,
                ),
            ]
        )
        db.session.commit()

        token = create_access_token(identity="1")

    response = client.get(
        "/notifications/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    notifications = response.get_json()

    assert len(notifications) == 2
    assert all(notification["parcel_id"] != 102 for notification in notifications)


def test_get_notifications_returns_newest_first(app, client):
    with app.app_context():
        Notification.query.delete()

        older = Notification(
            user_id=1,
            parcel_id=101,
            message="Older notification",
            notification_type="status",
            created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        )

        newer = Notification(
            user_id=1,
            parcel_id=102,
            message="Newer notification",
            notification_type="status",
            created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
        )

        db.session.add_all([older, newer])
        db.session.commit()

        token = create_access_token(identity="1")

    response = client.get(
        "/notifications/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    notifications = response.get_json()

    assert notifications[0]["message"] == "Newer notification"
    assert notifications[1]["message"] == "Older notification"


def test_get_notifications_returns_empty_list(app, client):
    with app.app_context():
        Notification.query.delete()
        db.session.commit()

        token = create_access_token(identity="1")

    response = client.get(
        "/notifications/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.get_json() == []
