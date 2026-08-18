#  Deliveroo Frontend

A modern courier delivery web application built with **React** and **Redux Toolkit** that enables customers to create and manage parcel deliveries while allowing administrators to monitor and update delivery progress.

This repository contains the **frontend implementation** of the Deliveroo project. It provides an intuitive, responsive, and mobile-friendly user interface that communicates with a Python backend (Flask/FastAPI) through REST APIs.

---

##  Project Overview

Deliveroo is a courier service platform that allows users to send parcels from one location to another.

Customers can:

- Create an account
- Log in securely
- Create parcel delivery orders
- View parcel details
- Change parcel destination (before delivery)
- Cancel parcel deliveries (before delivery)

Administrators can:

- View all parcel orders
- Update parcel status
- Update parcel current location
- Manage delivery progress

The application also integrates Google Maps to visualize delivery routes and calculate travel distance and estimated duration.

---

#  Project Objectives

- Build a clean and responsive user interface
- Implement modern React architecture
- Practice team collaboration using Git and GitHub
- Prepare a scalable frontend for backend integration
- Follow industry-standard development practices

---

#  Team Workflow

The project follows the **GitHub Flow** workflow.

## Main Branches

```
main
development
```

### Branch Purpose

| Branch | Purpose |
|---------|----------|
| main | Production-ready code |
| development | Active development branch |

---

## Feature Branch Naming

Each new task should have its own feature branch.

Example

```
feature/login-page
feature/register-page
feature/create-order
feature/dashboard
feature/admin-dashboard
feature/google-maps
feature/navbar
feature/order-details
```

Bug fixes

```
bugfix/login-validation
bugfix/mobile-navbar
```

Hot fixes

```
hotfix/map-rendering
```

---

## Git Workflow

### 1. Pull the latest changes

```bash
git checkout development
git pull origin development
```

---

### 2. Create a feature branch

```bash
git checkout -b feature/login-page
```

---

### 3. Make your changes

Commit frequently using meaningful commit messages.

Example

```bash
git add .
git commit -m "Add login page layout"
```

---

### 4. Push your branch

```bash
git push origin feature/login-page
```

---

### 5. Create a Pull Request

Open a Pull Request from

```
feature/*
        ↓
development
```

---

### 6. Code Review

At least one team member should review the Pull Request before merging.

---

### 7. Merge

After approval

```
feature/*
      ↓
development
```

Only merge **development → main** when a project milestone is complete.

---

#  Frontend Folder Structure

```
src/
│
├── assets/
│
├── components/
│   ├── common/
│   ├── forms/
│   ├── layout/
│   └── maps/
│
├── features/
│   ├── auth/
│   ├── orders/
│   ├── admin/
│   ├── notifications/
│   └── maps/
│
├── hooks/
│
├── layouts/
│
├── pages/
│   ├── Auth/
│   ├── Customer/
│   ├── Admin/
│   └── Errors/
│
├── redux/
│   ├── store.js
│   └── slices/
│
├── routes/
│
├── services/
│
├── utils/
│
├── styles/
│
├── App.jsx
│
└── main.jsx
```

---

#  Application Pages

## Public

- Landing Page
- Login
- Register
- 404 Page

---

## Customer

- Dashboard
- Create Delivery Order
- My Orders
- Order Details
- Update Destination
- Profile

---

## Admin

- Dashboard
- All Orders
- Order Details
- Update Parcel Status
- Update Parcel Location
- Users

---



#  User Stories

## Customer

As a customer, I want to:

- Register an account
- Log in securely
- View my dashboard
- Create a parcel delivery order
- View all my deliveries
- View details of a delivery
- Change the destination of a parcel before delivery
- Cancel a delivery before it is delivered
- View delivery status
- Track parcel location on a map
- View estimated travel distance and duration

---

## Administrator

As an administrator, I want to:

- Log into the admin dashboard
- View all parcel orders
- View customer information
- Update parcel delivery status
- Update parcel current location
- Monitor all deliveries

---

#  Technology Stack

## Frontend

- React
- React Router DOM
- Redux Toolkit
- Axios
- Vite

---

## Styling

- Tailwind CSS
- CSS Modules (where appropriate)

---

## Maps

- Google Maps JavaScript API
- Directions Service
- Places API

---

## Form Validation

- React Hook Form
- Zod

---

## Notifications

- React Toastify

---

## Icons

- Lucide React

---

## Backend (Next Phase)

- Python
- Flask or FastAPI
- PostgreSQL
- SQLAlchemy
- JWT Authentication

---

## Testing

Frontend

- Jest
- React Testing Library

Backend

- Pytest (recommended)

---

#  Responsive Design

The application follows a **mobile-first** approach and is optimized for:

- Mobile Devices
- Tablets
- Desktop Screens

---

#  Design

Wireframes and UI mockups will be designed using **Figma** before implementation.

Design goals include:

- Clean interface
- Accessibility
- Consistent spacing
- Responsive layouts
- Reusable components

---


#  Contribution Guidelines

1. Pull the latest changes from `development`.
2. Create a new feature branch.
3. Implement your assigned task.
4. Test your changes locally.
5. Push your branch to GitHub.
6. Open a Pull Request targeting `development`.
7. Request at least one review before merging.

---

#  Development Phases

## Phase 1

- Wireframes
- User Stories
- React Setup
- UI Components
- Frontend Development
- State Management
- Maps Integration

---

## Phase 2

- Backend Development
- Authentication APIs
- CRUD Operations
- PostgreSQL Database
- Email Notifications

---

## Phase 3

- Testing
- Bug Fixes
- Deployment
- Documentation
- Final Presentation

---

#  Contributors
- Allan Kimani
- Deogracious Moriasi
- Victor Mwangi
- Wayne Kiptoo
