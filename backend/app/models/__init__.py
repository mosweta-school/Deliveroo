"""
Import every model here once it's created, so that:
  1. Flask-Migrate's `flask db migrate --autogenerate` can see all tables
  2. Foreign keys between models (User <-> Parcel <-> Notification etc.) resolve correctly

Models inherit from `db.Model` (imported from app.extensions), NOT a
separately-declared Base — that's the Flask-SQLAlchemy convention.

Each member adds their own model file and one import line here. Example:

    from app.models.user import User                    # Member 1
    from app.models.parcel import Parcel                 # Member 2
    from app.models.location import Location             # Member 2/3
    from app.models.notification import Notification     # Member 3
    from app.models.status_history import StatusHistory  # Member 3

Do NOT skip this step — a model that isn't imported here will not show up
in `flask db migrate --autogenerate`, even though it inherits from db.Model.
"""

# Member model imports go below this line:
# app/models/__init__.py
from app.models.user import User
from app.models.location import Location
from app.models.parcel import Parcel
from app.models.parcel_status_history import ParcelStatusHistory
from app.models.notification import Notification