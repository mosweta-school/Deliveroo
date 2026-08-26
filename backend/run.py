"""
Local development entry point.

    python run.py

For everyday dev, `flask --app wsgi run --debug` also works and is what the
`flask db ...` migration commands expect FLASK_APP to point to — but this
file is a convenient one-command alternative during development.
"""

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
