# Deliveroo Backend

Flask + PostgreSQL (Supabase) backend for the SendIT courier/parcel delivery platform.

## Stack

- **Flask** — REST API framework
- **PostgreSQL** via **Supabase** — hosted database
- **Flask-SQLAlchemy** — ORM
- **Flask-Migrate** — database migrations (Alembic under the hood)
- **Flask-Marshmallow** + **marshmallow-sqlalchemy** — request/response schemas & validation
- **Flask-JWT-Extended** — authentication
- **Flask-Bcrypt** — password hashing
- **Flask-Mail** — status/location update email notifications
- **Flask-Cors** — CORS for the React frontend
- **Gunicorn** — production WSGI server

## Project structure

```
app/
  __init__.py           # application factory — create_app()          [Member 4]
  config.py               # env-driven config classes                   [Member 4]
  extensions.py             # shared db, migrate, jwt, bcrypt, mail, ma, cors [Member 4]
  errors.py                   # global error handlers                     [Member 4]
  logging_config.py            # logging setup                            [Member 4]
  models/
    __init__.py                 # import every model here — required for migrations
    user.py                       # User model                            [Member 1]
    parcel.py                      # Parcel model                          [Member 2]
    location.py                     # Location model                       [Member 2]
    notification.py                  # Notification model                   [Member 3]
    status_history.py                 # StatusHistory model                  [Member 3]
  schemas/
    __init__.py                        # marshmallow schema conventions
    user_schema.py                       # [Member 1]
    parcel_schema.py                      # [Member 2]
  services/
    __init__.py                            # business-logic layer conventions
    auth_service.py                          # hashing, JWT issuing          [Member 1]
    parcel_service.py                         # tracking numbers, ownership rules [Member 2]
    email_service.py                           # Flask-Mail sending           [Member 3]
  routes/
    __init__.py                                  # blueprint conventions
    auth.py                                        # register/login/profile   [Member 1]
    parcel.py                                        # parcel CRUD              [Member 2]
    admin.py                                          # status/location updates  [Member 3]
    notification.py                                    # notification history    [Member 3]
migrations/               # Flask-Migrate/Alembic scaffold + generated migration files [Member 4]
tests/
  conftest.py               # pytest-flask `app` fixture (in-memory DB per test)
  test_health.py             # example test — copy this pattern
wsgi.py                       # gunicorn entry point / FLASK_APP target        [Member 4]
run.py                        # local dev entry point                          [Member 4]
requirements.txt
.env.example
```

## Division of work

| Member | Owns | Responsible for |
|---|---|---|
| **1** | `routes/auth.py`, `models/user.py`, `schemas/user_schema.py`, `services/auth_service.py` | Register, login, JWT, user profile, password hashing |
| **2** | `routes/parcel.py`, `models/parcel.py`, `models/location.py`, `schemas/parcel_schema.py`, `services/parcel_service.py` | Parcel CRUD, change destination, cancel parcel, tracking number generation, business rules |
| **3** | `routes/admin.py`, `routes/notification.py`, `models/notification.py`, `models/status_history.py`, `services/email_service.py` | Admin APIs, update status, update location, email notifications, notification history |
| **4** | `app/__init__.py`, `extensions.py`, `config.py`, `errors.py`, `migrations/`, `run.py` | App factory, DB init, SQLAlchemy config, Flask-Migrate, JWT/Marshmallow/Bcrypt/Flask-Mail init, env vars, global error handlers, project architecture |

Members 1–3 only ever add new files inside their own `routes/`, `models/`, `schemas/`, and `services/` folders, plus one import line each in `app/models/__init__.py` and the blueprint-registration block in `app/__init__.py`. That's the entire shared surface area — small and easy to review in a PR.

## First-time setup (everyone does this once)

1. **Clone the repo and enter the backend folder.**

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate      # Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up your `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Fill in the real values (get these from Member 4 / the team's Supabase project → Project Settings → Database):
   - `DATABASE_URL` — the **Direct connection** string (port 5432)
   - `SECRET_KEY` / `JWT_SECRET_KEY` — any long random strings
   - `EMAIL` / `EMAIL_PASSWORD` — for Flask-Mail (Member 3 will use this)

   **Never commit your `.env` file.** It's already in `.gitignore`.

5. **Tell Flask where the app is (needed for `flask db ...` commands):**
   ```bash
   export FLASK_APP=wsgi.py        # Windows (PowerShell): $env:FLASK_APP = "wsgi.py"
   ```

6. **Run migrations to create/update tables:**
   ```bash
   flask db upgrade
   ```
   (The `migrations/` folder is already initialized — you don't need `flask db init` again.)

7. **Run the API:**
   ```bash
   python run.py
   ```
   or
   ```bash
   flask --app wsgi run --debug
   ```

8. **Check it's alive:**
   - http://localhost:8000/health → `{"status": "healthy", ...}`
   - http://localhost:8000/ → confirms the app name

   Note: this project doesn't use FastAPI, so there's no auto-generated `/docs`. Document your endpoints with docstrings/comments in each blueprint, and build out your Postman collection as you go — that's your primary demo tool per the presentation plan.

## Adding your own module (Members 1–3)

Follow the layers in order — model → schema → service → route. Using Member 2's parcel module as the example:

1. **Model** — `app/models/parcel.py`, inheriting from `db.Model`:
   ```python
   from app.extensions import db

   class Parcel(db.Model):
       __tablename__ = "parcels"
       id = db.Column(db.Integer, primary_key=True)
       ...
   ```

2. **Import it in `app/models/__init__.py`** — easy to forget, but skipping it means Flask-Migrate won't see your table:
   ```python
   from app.models.parcel import Parcel  # noqa: F401
   ```

3. Generate and apply a migration:
   ```bash
   flask db migrate -m "add parcel table"
   flask db upgrade
   ```
   **Always open the generated file in `migrations/versions/` and read it before running upgrade** — autogenerate isn't perfect, especially with renamed columns or dropped constraints.

4. **Schema** — `app/schemas/parcel_schema.py`, for validation + serialization:
   ```python
   from app.extensions import ma
   from app.models.parcel import Parcel

   class ParcelSchema(ma.SQLAlchemyAutoSchema):
       class Meta:
           model = Parcel
           load_instance = True

   parcel_schema = ParcelSchema()
   parcels_schema = ParcelSchema(many=True)
   ```

5. **Service** — `app/services/parcel_service.py`, for the business rules (ownership checks, "can't cancel a delivered parcel," tracking number generation). See `app/services/__init__.py` for a full worked example.

6. **Route** — `app/routes/parcel.py`, kept thin: parse request → call service → return via schema:
   ```python
   from flask import Blueprint, request
   from flask_jwt_extended import jwt_required, get_jwt_identity
   from app.schemas.parcel_schema import parcel_schema, parcels_schema
   from app.services.parcel_service import create_parcel, cancel_parcel

   parcel_bp = Blueprint("parcel", __name__)

   @parcel_bp.route("/", methods=["POST"])
   @jwt_required()
   def create():
       parcel = create_parcel(request.json, get_jwt_identity())
       return parcel_schema.dump(parcel), 201

   @parcel_bp.route("/<int:parcel_id>/cancel", methods=["PATCH"])
   @jwt_required()
   def cancel(parcel_id):
       parcel = cancel_parcel(parcel_id, get_jwt_identity())
       return parcel_schema.dump(parcel), 200
   ```

7. **Register the blueprint** in `app/__init__.py` inside `create_app()`:
   ```python
   from app.routes.parcel import parcel_bp
   app.register_blueprint(parcel_bp, url_prefix="/parcels")
   ```

8. Use `abort(404, description="Parcel not found")` (from `flask`) for errors — the global handler in `app/errors.py` already formats the response consistently. Marshmallow `ValidationError`s from `schema.load(...)` are also caught automatically. You don't need your own try/except-for-500 blocks anywhere.

## Testing

```bash
pytest
```

Copy the pattern in `tests/test_health.py` — the `client` fixture is provided automatically by `pytest-flask` from the `app` fixture in `conftest.py`. Every test runs against an isolated in-memory SQLite database, never the real Supabase one.

## Conventions

- Don't hardcode secrets — everything env-derived comes from `app.config[...]`, sourced from `app/config.py`.
- Don't create a second `SQLAlchemy()`/`JWTManager()`/etc. instance anywhere — import from `app.extensions`.
- Models inherit from `db.Model` (not a separately declared Base — that's the FastAPI/plain-SQLAlchemy pattern, not the Flask-SQLAlchemy one).
- Migrations: always `flask db migrate` then **read the generated file** before running `flask db upgrade`.

## Team workflow

1. Member 4 sets this repo up, gets Supabase provisioned, shares the `.env` values.
2. Members 1–3 build their modules in parallel following the pattern above.
3. Pull requests reviewed before merging into `development`.
4. `development` → `main` once a milestone is stable.
