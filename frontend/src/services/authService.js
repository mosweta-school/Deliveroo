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
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Invalid email or password. Please try again.';
      throw new Error(errorMessage);
    }
  },

  // Register user - sends first_name, last_name, email, phone_number
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email.toLowerCase(), // Ensure lowercase
        phone_number: userData.phoneNumber,
        password: userData.password,
        confirm_password: userData.password
      });
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Registration failed. Please try again.';
      throw new Error(errorMessage);
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

// Redux thunk wrappers
export const loginRequest = (email, password) =>
  api.post("/auth/login", { email, password }).then((res) => res.data);

export const registerRequest = (firstName, lastName, email, phoneNumber, password) =>
  api
    .post("/auth/register", { 
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      phone_number: phoneNumber,
      password,
      confirm_password: password
    })
    .then((res) => res.data);

export const fetchCurrentUserRequest = () =>
  api.get("/auth/me").then((res) => res.data);

export const logoutRequest = () =>
  api.post("/auth/logout").then((res) => res.data);