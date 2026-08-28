from unittest.mock import patch

from app.services.email_service import send_notification_email


def test_send_notification_email(app):
    with app.app_context():
        with patch("app.services.email_service.mail.send") as mock_send:
            send_notification_email(
                recipient_email="user@example.com",
                subject="Parcel Update",
                message="Your parcel has been dispatched.",
            )

            mock_send.assert_called_once()

            sent_message = mock_send.call_args[0][0]

            assert sent_message.subject == "Parcel Update"
            assert sent_message.recipients == ["user@example.com"]
            assert sent_message.body == "Your parcel has been dispatched."
