# app/routes/auth.py - Updated version
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flasgger import swag_from
from app.schemas.user_schema import user_schema
from app.services.auth_service import register_user, login_user, get_user_by_id

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
@swag_from({
    'tags': ['Authentication'],
    'summary': 'Register a new user',
    'description': 'Create a new user account with the provided details',
    'parameters': [{
        'name': 'body',
        'in': 'body',
        'required': True,
        'schema': {
            'type': 'object',
            'properties': {
                'first_name': {'type': 'string', 'example': 'John'},
                'last_name': {'type': 'string', 'example': 'Mwangi'},
                'email': {'type': 'string', 'example': 'john@example.com'},
                'phone_number': {'type': 'string', 'example': '+254 712 345 678'},
                'password': {'type': 'string', 'example': 'password123'},
                'confirm_password': {'type': 'string', 'example': 'password123'}
            },
            'required': ['first_name', 'last_name', 'email', 'phone_number', 'password', 'confirm_password']
        }
    }],
    'responses': {
        201: {
            'description': 'User registered successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'user': {'type': 'object'}
                }
            }
        },
        400: {
            'description': 'Validation error or user already exists'
        }
    }
})
def register():
    """Register a new user"""
    data = request.json
    
    # Validate data using schema
    try:
        validated_data = user_schema.load(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
    # Register user
    user = register_user(validated_data)
    
    return jsonify({
        'success': True,
        'message': 'User registered successfully',
        'user': user_schema.dump(user)
    }), 201

@auth_bp.route("/login", methods=["POST"])
@swag_from({
    'tags': ['Authentication'],
    'summary': 'Login user',
    'description': 'Authenticate user and get JWT access token',
    'parameters': [{
        'name': 'body',
        'in': 'body',
        'required': True,
        'schema': {
            'type': 'object',
            'properties': {
                'email': {'type': 'string', 'example': 'john@example.com'},
                'password': {'type': 'string', 'example': 'password123'}
            },
            'required': ['email', 'password']
        }
    }],
    'responses': {
        200: {
            'description': 'Login successful',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'access_token': {'type': 'string'},
                    'user': {'type': 'object'}
                }
            }
        },
        401: {
            'description': 'Invalid credentials'
        }
    }
})
def login():
    """Login user and get access token"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    access_token, user = login_user(email, password)
    
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'access_token': access_token,
        'user': user_schema.dump(user)
    }), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Authentication'],
    'summary': 'Get current user profile',
    'description': 'Get the profile of the currently authenticated user',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'User profile retrieved',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'user': {'type': 'object'}
                }
            }
        },
        401: {
            'description': 'Unauthorized'
        }
    }
})
def get_profile():
    """Get current user profile"""
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id)
    return jsonify({
        'success': True,
        'user': user_schema.dump(user)
    }), 200
