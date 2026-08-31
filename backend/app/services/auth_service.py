# app/services/auth_service.py
from flask import abort
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models.user import User


def register_user(user_data):
    """Register a new user"""
    # Handle both dictionary and object cases
    if hasattr(user_data, '__dict__'):
        # It's a User object from Marshmallow
        email = user_data.email
        first_name = user_data.first_name
        last_name = user_data.last_name
        phone_number = user_data.phone_number
        role = getattr(user_data, 'role', 'customer')
        
        # Get password from the object (Marshmallow stores it in _password)
        password = getattr(user_data, '_password', None)
        if not password:
            # Try to get password directly
            password = getattr(user_data, 'password', None)
    else:
        # It's a dictionary
        email = user_data.get('email')
        first_name = user_data.get('first_name')
        last_name = user_data.get('last_name')
        phone_number = user_data.get('phone_number')
        password = user_data.get('password')
        role = user_data.get('role', 'customer')
    
    # Validate password
    if not password:
        abort(400, description="Password is required")
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        abort(400, description="User already exists with this email")
    
    # Create new user
    new_user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        role=role
    )
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    
    return new_user


def login_user(email, password):
    """Authenticate user and generate access token"""
    user = User.query.filter_by(email=email).first()
    if not user:
        abort(401, description="Invalid email or password")
    
    if not user.check_password(password):
        abort(401, description="Invalid email or password")
    
    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            'email': user.email,
            'role': user.role,
            'full_name': user.full_name
        }
    )
    
    return access_token, user


def get_user_by_id(user_id):
    """Get user by ID"""
    user = User.query.get(user_id)
    if not user:
        abort(404, description="User not found")
    return user
