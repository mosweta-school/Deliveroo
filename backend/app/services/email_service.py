from flask_mail import Message

from app.extensions import mail


def send_notification_email(
    recipient_email: str,
    subject: str,
    message: str,
) -> None:
    """Send a notification email to a user."""
    msg = Message(
        subject=subject,
        recipients=[recipient_email],
        body=message,
    )

    mail.send(msg)
