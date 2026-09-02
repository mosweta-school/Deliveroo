import api from "./api";

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
