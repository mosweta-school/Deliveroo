import axios from "axios";

// Vite exposes env vars prefixed with VITE_ via import.meta.env.
// Create a .env file in your frontend/ root with:
//   VITE_API_BASE_URL=http://localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT access token to every outgoing request automatically,
// so individual pages never have to remember to do it themselves.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the backend ever rejects the token (expired/invalid/revoked), clear
// local auth state and bounce to login instead of leaving the app stuck
// in a "logged in but every request 401s" state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
