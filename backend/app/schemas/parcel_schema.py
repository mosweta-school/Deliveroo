"""Marshmallow schemas for parcel model."""


class ParcelSchema:
    """Serialize/deserialize parcel model instances."""

    def __init__(self, many=False):
        self.many = many

    def dump(self, obj):
        if self.many:
            return [self._serialize(item) for item in obj]
        return self._serialize(obj)

    def load(self, data, partial=False):
        return self._deserialize(data, partial=partial)

    @staticmethod
    def _serialize(parcel):
        return {
            "id": getattr(parcel, "id", None),
            "user_id": getattr(parcel, "user_id", None),
            "tracking_number": getattr(parcel, "tracking_number", None),
            "pickup_location": {
                "id": getattr(parcel, "pickup_location_id", None),
                "address": getattr(parcel, "pickup_address", None),
                "latitude": getattr(parcel, "pickup_latitude", None),
                "longitude": getattr(parcel, "pickup_longitude", None),
            }
            if getattr(parcel, "pickup_location_id", None)
            else None,
            "destination": {
                "id": getattr(parcel, "destination_id", None),
                "address": getattr(parcel, "destination_address", None),
                "latitude": getattr(parcel, "destination_latitude", None),
                "longitude": getattr(parcel, "destination_longitude", None),
            }
            if getattr(parcel, "destination_id", None)
            else None,
            "weight": getattr(parcel, "weight", None),
            "weight_category": getattr(parcel, "weight_category", None),
            "status": getattr(parcel, "status", None),
            "created_at": getattr(parcel, "created_at", None),
            "updated_at": getattr(parcel, "updated_at", None),
        }

    @staticmethod
    def _deserialize(data, partial=False):
        return {
            "user_id": data.get("user_id"),
            "pickup_location": {
                "address": data.get("pickup_location", {}).get("address"),
                "latitude": data.get("pickup_location", {}).get("latitude"),
                "longitude": data.get("pickup_location", {}).get("longitude"),
            }
            if data.get("pickup_location")
            else None,
            "destination": {
                "address": data.get("destination", {}).get("address"),
                "latitude": data.get("destination", {}).get("latitude"),
                "longitude": data.get("destination", {}).get("longitude"),
            }
            if data.get("destination")
            else None,
            "weight": data.get("weight"),
            "weight_category": data.get("weight_category"),
            "status": data.get("status", "pending"),
        }


parcel_schema = ParcelSchema()
parcel_list_schema = ParcelSchema(many=True)


class ParcelCreateSchema:
    """Validate parcel creation payload."""

    def load(self, data, partial=False):
        errors = {}

        if not data.get("user_id"):
            errors["user_id"] = ["User ID is required."]
        if not data.get("pickup_location") or not data["pickup_location"].get("address"):
            errors.setdefault("pickup_location", {})["address"] = ["Pickup location address is required."]
        if not data.get("destination") or not data["destination"].get("address"):
            errors.setdefault("destination", {})["address"] = ["Destination address is required."]
        if data.get("weight") is None:
            errors["weight"] = ["Weight is required."]
        if not data.get("weight_category") or data["weight_category"] not in ("Light", "Medium", "Heavy"):
            errors.setdefault("weight_category", {})["enum"] = [
                "Weight category must be one of: Light, Medium, Heavy."
            ]

        if errors:
            from marshmallow import ValidationError
            raise ValidationError(errors)

        return data


parcel_create_schema = ParcelCreateSchema()