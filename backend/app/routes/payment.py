# backend/app/routes/payment.py
import random
import string
import uuid
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.parcel import Parcel
from app.models.payment import Payment
from app.services.redis_service import redis_service

payment_bp = Blueprint("payment", __name__)


def _generate_mock_mpesa():
    """Return a dict shaped like an M-Pesa STK callback, prefixed with MOCK-.

    Every field name mirrors what Safaricom actually sends, so swapping to
    real STK later is a drop-in replacement for this function only.
    """
    receipt = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    return {
        'receipt': receipt,
        'reference': f"MOCK-{receipt}",
        'checkout_request_id': f"ws_CO_{uuid.uuid4().hex[:18]}",
        'merchant_request_id': (
            f"{random.randint(10000, 99999)}-"
            f"{random.randint(10000000, 99999999)}-1"
        ),
        'transaction_time': datetime.utcnow().strftime('%Y%m%d%H%M%S'),
    }


@payment_bp.route("/orders/<order_id>/pay", methods=["POST"])
@jwt_required()
def pay_order_deposit(order_id):
    """Mock-pay the deposit for an order. Generates a fake transaction id,
    records a Payment row, and returns the M-Pesa-shaped receipt."""
    user_id = get_jwt_identity()
    parcel = Parcel.query.get(order_id)

    if not parcel:
        return jsonify({"error": "Order not found"}), 404
    if parcel.user_id != user_id:
        return jsonify({"error": "Unauthorized: Not your order"}), 403
    if parcel.payment_method != 'deposit':
        return jsonify({
            "error": "This order is not a deposit order",
            "payment_method": parcel.payment_method,
        }), 400
    if parcel.is_deposit_paid:
        return jsonify({"error": "Deposit already paid"}), 409

    amount = float(parcel.deposit_amount or 0)
    if amount <= 0:
        return jsonify({"error": "No deposit amount due"}), 400

    mock = _generate_mock_mpesa()

    payment = Payment(
        parcel_id=parcel.id,
        user_id=user_id,
        type='deposit',
        amount=amount,
        currency='KES',
        method='mpesa',
        status='completed',
        reference=mock['reference'],
        phone=parcel.sender_phone,
        paid_at=datetime.utcnow(),
        mpesa_receipt=mock['receipt'],
        checkout_request_id=mock['checkout_request_id'],
        merchant_request_id=mock['merchant_request_id'],
        raw_callback={
            "mock": True,
            "generated_at": datetime.utcnow().isoformat(),
            "transaction_time": mock['transaction_time'],
            "amount": amount,
            "phone": parcel.sender_phone,
        },
    )
    db.session.add(payment)

    # Add a status history note so the timeline reflects the payment.
    try:
        from app.models.parcel_status_history import ParcelStatusHistory
        db.session.add(ParcelStatusHistory(
            parcel_id=parcel.id,
            status=parcel.status,
            updated_by=user_id,
            remarks=f"Deposit paid: KES {amount:,.0f} (mock, ref {mock['reference']})",
        ))
    except Exception:
        pass

    db.session.commit()

    # Bust the customer's dashboard cache so the paid state shows immediately.
    try:
        redis_service.invalidate_customer_dashboard(user_id)
    except Exception:
        pass

    return jsonify({
        "success": True,
        "mock": True,
        "message": "Payment received (mock)",
        "payment": payment.to_dict(),
        "parcel": parcel.to_dict(include_payments=True),
    }), 200


@payment_bp.route("/orders/<order_id>", methods=["GET"])
@jwt_required()
def get_order_payments(order_id):
    """List all payments recorded against an order."""
    user_id = get_jwt_identity()
    parcel = Parcel.query.get(order_id)

    if not parcel:
        return jsonify({"error": "Order not found"}), 404
    if parcel.user_id != user_id:
        return jsonify({"error": "Unauthorized: Not your order"}), 403

    return jsonify({
        "success": True,
        "payments": [p.to_dict() for p in parcel.payments],
        "paid_amount": parcel.paid_amount,
        "is_deposit_paid": parcel.is_deposit_paid,
        "is_fully_paid": parcel.is_fully_paid,
        "deposit_amount": parcel.deposit_amount,
        "amount_due": parcel.amount_due,
        "price": parcel.price,
    }), 200