"""
Each member's routes are a Flask Blueprint living in its own file here:

    routes/auth.py           -> Member 1 (register, login, JWT, profile)
    routes/parcel.py         -> Member 2 (parcel CRUD, destination, cancel)
    routes/admin.py          -> Member 3 (admin status/location updates)
    routes/notification.py   -> Member 3 (notification history)

Each blueprint gets registered in app/__init__.py's create_app(), e.g.:

    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")

Routes should stay thin: parse the request, call a function in
app/services/, use a schema in app/schemas/ to validate/serialize, and
return. Business logic belongs in services/, not here.
"""
