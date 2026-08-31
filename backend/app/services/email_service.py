# app/services/email_service.py
from flask import current_app
from app.extensions import mail
from flask_mail import Message
import logging

logger = logging.getLogger(__name__)


def send_email_notification(to_email, subject, body):
    """Send email notification using Flask-Mail"""
    try:
        msg = Message(
            subject=subject,
            sender=current_app.config["MAIL_DEFAULT_SENDER"],
            recipients=[to_email]
        )
        msg.body = body
        mail.send(msg)
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False


def send_welcome_email(to_email, user_name):
    """Send welcome email to new user"""
    subject = "Welcome to Deliveroo!"
    body = f"""Hi {user_name},

Welcome to Deliveroo! We're excited to have you on board.

With Deliveroo, you can:
- Send parcels across Kenya with ease
- Track your deliveries in real-time
- Get instant quotes based on weight and distance
- Receive email notifications for status updates

Get started by creating your first delivery order today!

Best regards,
The Deliveroo Team
"""
    return send_email_notification(to_email, subject, body)