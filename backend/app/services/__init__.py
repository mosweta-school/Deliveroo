"""
Business logic lives here — one file per concern, owned alongside its routes:

    services/auth_service.py     -> Member 1 (hashing, JWT issuing, credential checks)
    services/parcel_service.py   -> Member 2 (tracking number generation, ownership
                                    checks, "can't cancel a delivered parcel" rules)
    services/email_service.py    -> Member 3 (Flask-Mail sending, templates)

Why this layer exists: routes/ should only parse requests and format
responses. Anything with a business rule in it — "only the parcel's
creator can cancel it", "a delivered parcel can't have its destination
changed" — belongs in a service function, not inline in a route. This
keeps routes testable and keeps rules in one findable place instead of
scattered across every endpoint that touches a given model.

Example shape:

    # services/parcel_service.py
    from app.extensions import db
    from app.models.parcel import Parcel

    def cancel_parcel(parcel_id: int, user_id: int) -> Parcel:
        parcel = Parcel.query.get_or_404(parcel_id)
        if parcel.user_id != user_id:
            abort(403, description="Not your parcel")
        if parcel.status == "Delivered":
            abort(400, description="Cannot cancel a delivered parcel")
        parcel.status = "Cancelled"
        db.session.commit()
        return parcel

    # routes/parcel.py
    from app.services.parcel_service import cancel_parcel

    @parcel_bp.route("/<int:parcel_id>/cancel", methods=["PATCH"])
    @jwt_required()
    def cancel(parcel_id):
        parcel = cancel_parcel(parcel_id, get_jwt_identity())
        return parcel_schema.dump(parcel), 200
"""
