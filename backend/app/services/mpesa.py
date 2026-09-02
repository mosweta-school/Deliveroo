"""M-Pesa STK Push payment service."""
import base64
import datetime
import requests
from flask import current_app


class MpesaService:
    """Service class for handling M-Pesa STK Push operations."""

    def __init__(self):
        # Config will be read from current_app at method call time
        self._access_token = None
        self._token_expiry = None

    def _get_config(self, key, default=""):
        """Get M-Pesa config from Flask app config."""
        return current_app.config.get(key, default)

    def _get_base_url(self):
        """Return the appropriate base URL based on environment."""
        environment = self._get_config("MPESA_ENVIRONMENT", "sandbox")
        if environment == "production":
            return "https://api.safaricom.co.ke"
        return "https://sandbox.safaricom.co.ke"

    def get_access_token(self):
        """Fetch OAuth access token from M-Pesa API."""
        consumer_key = self._get_config("MPESA_CONSUMER_KEY")
        consumer_secret = self._get_config("MPESA_CONSUMER_SECRET")

        if not consumer_key or not consumer_secret:
            raise ValueError("MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET must be set")

        url = f"{self._get_base_url()}/oauth/v1/generate?grant_type=client_credentials"
        auth = (consumer_key, consumer_secret)
        response = requests.get(url, auth=auth, timeout=10)
        if response.status_code != 200:
            raise Exception(f"Failed to get access token: {response.text}")
        data = response.json()
        self._access_token = data.get("access_token")
        # M-Pesa tokens expire in 3600 seconds (1 hour); refresh 5 minutes early
        self._token_expiry = datetime.datetime.utcnow() + datetime.timedelta(
            seconds=int(data.get("expires_in", 3600)) - 300
        )
        return self._access_token

    def _ensure_token(self):
        """Ensure we have a valid access token, refresh if needed."""
        if (
            self._access_token is None
            or self._token_expiry is None
            or datetime.datetime.utcnow() >= self._token_expiry
        ):
            self.get_access_token()

    def push_stk(self, phone_number: str, amount: int, order_id: str):
        """
        Send STK Push request to M-Pesa.

        Args:
            phone_number: Customer's phone number (e.g., 254712345678)
            amount: Payment amount in cents/minor units
            order_id: Order reference/account identifier

        Returns:
            dict: M-Pesa response
        """
        self._ensure_token()
        url = f"{self._get_base_url()}/mpesa/stkpush/v1/processrequest"

        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
        password_base = f"{self._get_config('MPESA_SHORTCODE')}{self._get_config('MPESA_PASSKEY', '')}{timestamp}"
        password = base64.b64encode(password_base.encode()).decode()

        payload = {
            "BusinessShortCode": self._get_config("MPESA_SHORTCODE"),
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": self._get_config("MPESA_SHORTCODE"),
            "PhoneNumber": phone_number,
            "CallBackURL": self._get_config("MPESA_CALLBACK_URL"),
            "AccountName": "Deliveroo Customer",
            "AccountReference": order_id,
            "TransactionDesc": "Payment for delivery",
        }

        headers = {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
        }

        response = requests.post(url, json=payload, headers=headers, timeout=15)
        return response.json()

    def parse_stk_callback(self, callback_data: dict):
        """
        Parse the STK Push callback from M-Pesa.

        Args:
            callback_data: The JSON payload M-Pesa sends to your callback URL

        Returns:
            dict: Parsed result with status, amount, etc.
        """
        result = {
            "result_code": callback_data.get("Body", {})
            .get("StkPushResponse", {})
            .get("ResultCode"),
            "result_description": callback_data.get("Body", {})
            .get("StkPushResponse", {})
            .get("ResultDesc"),
            "merchant_request_id": callback_data.get("Body", {})
            .get("StkPushResponse", {})
            .get("MerchantRequestID"),
            "checkout_request_id": callback_data.get("Body", {})
            .get("StkPushResponse", {})
            .get("CheckoutRequestID"),
            "callback_timestamp": callback_data.get("Header", {}).get("interfaceVersion"),
        }
        return result