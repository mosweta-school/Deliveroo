# Deliveroo — Courier Management System

A full-stack courier management platform for creating, managing, and tracking parcel delivery orders.

- Frontend 
- Backend 
- Database 
- State Management 
## Deployment 

Live Application

- Frontend: deliveroo-beta.vercel.app

- Backend API: https://deliveroo-29ye.onrender.com

- GitHub Repository: https://github.com/mosweta-school/Deliveroo

## Table of Contents

- Overview

- Problem Statement

- Solution

- Features

- User Roles

- System Architecture

- Technology Stack

- Project Structure

- Getting Started

- Environment Variables

- Running the Application

- Database Setup

- API Overview

- Authentication

- Business Rules

- Testing

- Deployment

- Future Improvements

- Contributing

## Overview

Deliveroo is a full-stack courier management system that enables customers to create and manage parcel delivery orders while allowing administrators to oversee delivery operations.

The application was developed in two phases:

Phase 1: Responsive React frontend, UI/UX design, navigation, state management, and delivery visualization.

Phase 2: Flask REST API, PostgreSQL persistence, SQLAlchemy data models, authentication, authorization, validation, and backend services.

The system is designed to provide a centralized experience for managing parcel deliveries, viewing delivery information, and communicating important parcel updates to customers.

## Problem Statement

- Parcel delivery management can become inefficient when customers have limited visibility into their delivery progress and administrators rely on fragmented or manual processes to manage parcel information.

- Customers need a convenient way to create orders, view delivery details, and receive updates. Administrators need a centralized system for managing parcel statuses and current locations.

- Deliveroo addresses these challenges by providing a digital platform that centralizes parcel management and improves delivery transparency.

## Solution

Deliveroo provides a web-based platform where:

- Customers create accounts and log in securely.

- Customers create parcel delivery orders.

- Customers view their delivery history and parcel details.

- Customers can update eligible delivery destinations or cancel orders.

- Administrators manage parcel statuses and current locations.

- Customers receive email notifications when important parcel information changes.

- Google Maps helps visualize pickup locations, destinations, and delivery routes.

## Features
### Customer Features

- User registration and login

- Secure authentication

- Create parcel delivery orders

- View personal delivery orders

- View parcel details

- View delivery status

- View pickup and destination locations

- View route, travel distance, and estimated journey duration

- Change parcel destination before delivery

- Cancel eligible parcel delivery orders

- Receive email notifications for parcel updates

### Administrator Features

- Secure administrator authentication

- View parcel delivery orders

- View customer delivery information

- Update parcel delivery status

- Update current parcel location

- Manage delivery operations

- Trigger customer notifications after parcel updates

### Mapping Features

- Google Maps integration

- Pickup location marker

- Destination marker

- Route visualization

- Computed travel distance

- Estimated journey duration

## User Roles
1. Customer

	

Creates and manages personal parcel delivery orders, views delivery information, and receives notifications.




2. Administrator

	

Oversees parcel deliveries and updates parcel status and current location.

Note: The current MVP does not include a separate rider account or automated GPS tracking module. Those are planned as future improvements.

## System Architecture
```
┌──────────────────────────────────────┐
│          React Frontend              │
│                                      │
│  Customer Dashboard                  │
│  Admin Dashboard                     │
│  Parcel Forms                        │
│  Order Details                       │
│  Google Maps                         │
│                                      │
│  Redux Toolkit                       │
└──────────────────┬───────────────────┘
                   │
                   │ HTTP / REST API
                   │ JSON
                   ▼
┌──────────────────────────────────────┐
│          Flask Backend               │
│                                      │
│  Authentication & Authorization      │
│  Parcel Management                   │
│  Business Logic                      │
│  Validation & Serialization          │
│  Error Handling                      │
│  Email Notifications                 │
└──────────────────┬───────────────────┘
                   │
                   │ SQLAlchemy ORM
                   ▼
┌──────────────────────────────────────┐
│          PostgreSQL Database         │
│                                      │
│  Users                               │
│  Parcels                             │
│  Related Application Data            │
└──────────────────────────────────────┘
```
## External Services:
- Google Maps API
- Email / SMTP Service
  
## Technology Stack
### Frontend
1. React.js for user interface development
2. React Router for Client-side navigation
3. Redux Toolkit for global state management
4. Axios to send HTTP requests to the backend
5. Tailwind CSS for responsive styling
6. Google Maps API to show maps, markers, routes, distance, and duration

### Backend
1. Python the backend programming language
2. Flask REST API framework
3. Flask-SQLAlchemy for SQLAlchemy integration with Flask
4. SQLAlchemy for ORM and database interaction
5. Marshmallow for serialization and input validation
6. Flask-JWT-Extended for JWT authentication
7. Flask-Mail for email notification support

### Database and Tools
1. PostgreSQL a relational database
2. Alembic / Flask-Migrate for database migrations
3. Postman for API testing
4. Git & GitHub for version control and collaboration
5. Figma for UI/UX design and prototyping
6. Vercel for frontend deployment
7. Render for backend deployment
8. Supabase for PostgreSQL database hosting

## Project Structure

The project is organized into separate frontend and backend applications.
```

deliveroo/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── customer/
│   │   │   └── admin/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── store/
│   │   │   ├── slices/
│   │   │   └── store.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routes/
│   │   ├── services/
│   │   └── extensions.py
│   ├── migrations/
│   ├── tests/
│   ├── config.py
│   ├── run.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── .gitignore
├── README.md
└── CONTRIBUTING.md
```

## Getting Started
### Prerequisites

Before running the project locally, ensure you have the following installed:

- Node.js (LTS recommended)

- npm

- Python 3.12+

- PostgreSQL or access to a hosted PostgreSQL database

- Git

- Google Maps API key (for map functionality)

### Verify your installations:
```
node --version
npm --version
python --version
git --version
```
1. Clone the Repository
```
git clone https://github.com/mosweta-school/Deliveroo.git
cd Deliveroo
```

2. Backend Setup

Navigate to the backend directory:
```
cd backend
```
Create a Virtual Environment
- Windows
```
python -m venv venv
venv\Scripts\activate
```
- macOS / Linux
```
python3 -m venv venv
source venv/bin/activate
```
Install Dependencies
```
pip install -r requirements.txt
```


3. Configure Backend Environment Variables

- Create a .env file inside the backend directory:
```
touch .env
```
- fill it in with your actual details but below is how it generally looks like. Replace with your values
```
# --- App ---
APP_NAME=Deliveroo API
ENVIRONMENT=development
SECRET_KEY=your-secret-key-here-should-be-more-than-19-characters

# --- Database (Supabase) ---
# Use the "Direct connection" string (port 5432) for local dev / Flask-Migrate.
# If you later split read traffic through the pooler, add DATABASE_URL_POOLED separately.
DATABASE_URL=postgresql://postgres.bnmlzoqsstvgluyemwqa:your-password@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# --- Auth (Flask-JWT-Extended) ---
JWT_SECRET_KEY=your-JWT-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_TOKEN_LOCATION=headers
JWT_HEADER_NAME=Authorization
JWT_AUTH_USERNAME_KEY=username

# --- Email (Flask-Mail) — used for status/location update notifications ---
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
EMAIL=your-email
EMAIL_PASSWORD=your-email-app-password

# --- CORS ---
# Comma-separated list of allowed frontend origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://deliveroo-beta.vercel.app,https://deliveroo.vercel.app
REDIS_URL=redis://localhost:6379/0,

# Flask
FLASK_APP=run.py
FLASK_DEBUG=1

# Application
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/deliveroo_db

# JWT
JWT_SECRET_KEY=your-jwt-secret-key

# CORS
FRONTEND_URL=http://localhost:5173

# Email
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-email-app-password
MAIL_DEFAULT_SENDER=your-email@example.com

```
please note that you should not do the following:
- Never commit .env to GitHub.
- Do not use your normal Gmail password for SMTP but use an email app password.


4. Set Up the PostgreSQL Database
- Option A: Local PostgreSQL
```

CREATE DATABASE deliveroo_db;
```
Then configure the connection string:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/deliveroo_db
```
- Option B: Supabase PostgreSQL
- Create or open your Supabase project.
-  Navigate to the database connection settings.
- Copy the PostgreSQL connection string the shared pooler one.
- Add it to your backend .env file.
```
DATABASE_URL=postgresql://postgres.bnmlzoqsstvgluyemwqa:your-password@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```
Note that you should use the connection string provided by Supabase not specifically the one above.

5. Run Database Migrations
```
flask db upgrade
```

6. Run the Backend
```
python run.py
```

7. Frontend Setup

Open a new terminal and navigate to the frontend directory:
```
cd frontend
```
Install dependencies:
```
npm install
```
8. Configure Frontend Environment Variables

Create a .env file in the frontend directory.
and add the urls as below
```
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

VITE_API_URL=http://localhost:8000/
```


9. Google Maps API Configuration

Ensure the following APIs are enabled in your Google Cloud project, depending on your implementation:

- Maps JavaScript API

- Directions API


10. Run the Frontend
```
npm run dev
```
The frontend will typically be available at:
```
http://localhost:5173
```
11. Running the Full Application

You will generally need two terminals:

- Terminal 1 — Backend
```
cd backend
source venv/bin/activate
python run.py
```
- Terminal 2 — Frontend
```
cd frontend
npm run dev
```
Then open the frontend URL in your browser.

## API Overview

The backend exposes RESTful endpoints for authentication and parcel management.
navigate to the url below to play around with the API endpoints
```
https://deliveroo-29ye.onrender.com/apidocs
```
## Authentication

Deliveroo uses JWT-based authentication to protect user accounts and restricted resources.

### Authentication Flow
```
User Registers
      │
      ▼
User Logs In
      │
      ▼
Backend Validates Credentials
      │
      ▼
JWT Access Token Issued
      │
      ▼
Frontend Stores Token
      │
      ▼
Token Sent with Protected Requests
      │
      ▼
Backend Verifies Token
      │
      ▼
Request Authorized

Protected requests typically include:

Authorization: Bearer <access_token>
```
### Business Rules

The following rules are enforced by the application:

- Only authenticated users can create parcel delivery orders.

- Only the user who created a parcel can cancel it.

- A parcel destination can only be changed before the parcel is marked as delivered.

- Only administrators can update parcel status and current location.

- Unauthorized users cannot access restricted resources.

- Invalid input must be rejected with an appropriate error response.

## Future Improvements

- Automated rider assignment

- Live delivery tracking

- Push notifications

- SMS notifications

- Online payment integration

- Delivery proof through signatures or photos

- Advanced delivery analytics

- Multi-hub and inter-county delivery support

- Improved delivery pricing and quote calculation



## Contributors
- Allan Kimani
- Deogracious Moriasi
- Victor Mwangi
- Wayne Kiptoo
