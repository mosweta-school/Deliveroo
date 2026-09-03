// frontend/src/services/authService.js
import api from './api';

export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login
    window.location.href = '/login';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return !!(token && user);
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user') || 'null');
  },

  // Check if user is admin
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'admin';
  }
};


// Thin wrappers around each backend auth endpoint. Keeping these separate
// from Redux means any component can call them directly if it ever needs to,
// without going through a thunk.

export const loginRequest = (email, password) =>
  api.post("/auth/login", { email, password }).then((res) => res.data);

export const registerRequest = (fullName, email, password) =>
  api
    .post("/auth/register", { full_name: fullName, email, password })
    .then((res) => res.data);

export const fetchCurrentUserRequest = () =>
  api.get("/auth/me").then((res) => res.data);

export const logoutRequest = () =>
  api.post("/auth/logout").then((res) => res.data);
