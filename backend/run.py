# backend/run.py
from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == "__main__":
    # Use socketio.run instead of app.run
    socketio.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        debug=True,
        allow_unsafe_werkzeug=True  # Add this for development
    )