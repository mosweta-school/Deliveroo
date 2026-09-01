"""
M-Pesa STK Push payment routes.

Endpoints:
    POST /mpesa/stk-push          -> Trigger STK push to customer's phone
    POST /mpesa/callback          -> Receive M-Pesa callback (handle separately via
                                    ngrok/tunnel in dev, or webhook route)
"""

from flask import Blueprint, current_app, request, jsonify
from app.services.mpesa import MpesaService

mpesa_bp = Blueprint("mpesa", __name__)
mpesa_service = MpesaService()


@mpesa_bp.route("/stk-push", methods=["POST"])
def trigger_stk_push():
    """
    Trigger STK Push to customer's phone for payment on delivery.

    Expected JSON payload:
    {
        "phone_number": "254712345678",
        "amount": 50000,
        "order_id": "ORDER-12345"
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    phone_number = data.get("phone_number")
    amount = data.get("amount")
    order_id = data.get("order_id")

    if not phone_number or not amount or not order_id:
        return jsonify({"error": "phone_number, amount, and order_id are required"}), 400

    try:
        amount_int = int(amount)
    except (ValueError, TypeError):
        return jsonify({"error": "amount must be an integer"}), 400

    try:
        result = mpesa_service.push_stk(phone_number, amount_int, order_id)
        return jsonify({
            "message": "STK push initiated successfully",
            "response": result,
        }), 200
    except Exception as e:
        current_app.logger.error(f"STK push failed: {str(e)}")
        return jsonify({"error": str(e)}), 500


@mpesa_bp.route("/callback", methods=["POST"])
def receive_callback():
    """
    Receive M-Pesa STK Push callback.

    M-Pesa will POST to this URL with the callback payload. You should:
    1. Validate the callback
    2. Update your order status in the database
    3. Send notification emails/SMS

    For security, verify the callback origin and validate the payload.
    """
    callback_data = request.get_json()
    if not callback_data:
        return jsonify({"error": "No payload received"}), 400

    try:
        parsed = mpesa_service.parse_stk_callback(callback_data)
    except Exception as e:
        current_app.logger.error(f"Failed to parse callback: {str(e)}")
        return jsonify({"error": f"Failed to parse callback: {str(e)}"}), 400

    result_code = parsed.get("result_code")
    checkout_request_id = parsed.get("checkout_request_id")

    # Here you would typically:
    # - Look up the order by checkout_request_id or merchant_request_id
    # - Update order status (paid/failed)
    # - Send confirmation email/SMS
    # - Update inventory, etc.

    current_app.logger.info(f"M-Pesa callback received: result_code={result_code}, "
                    f"checkout_request_id={checkout_request_id}")

    if result_code == 0:
        # Payment successful
        status = "paid"
    else:
        # Payment failed or pending
        status = "failed"

    return jsonify({
        "message": "Callback received successfully",
        "status": status,
        "result_code": result_code,
    }), 200