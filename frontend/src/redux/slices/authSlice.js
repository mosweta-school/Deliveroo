import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginRequest,
  registerRequest,
  fetchCurrentUserRequest,
  logoutRequest,
} from "../../services/authService";

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await loginRequest(email, password); // { access_token, refresh_token, user }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Invalid email or password");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ fullName, email, password }, { rejectWithValue }) => {
    try {
      return await registerRequest(fullName, email, password); // { user }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Registration failed");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchCurrentUserRequest();
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Not authenticated");
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  try {
    await logoutRequest(); // best-effort server-side revocation
  } catch {
    // Even if this fails (e.g. token already expired), still clear local state below.
  }
});

const storedUser = localStorage.getItem("user");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { access_token, refresh_token, user } = action.payload;
        state.loading = false;
        state.isAuthenticated = true;
        state.user = user;
        state.token = access_token;
        localStorage.setItem("token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        localStorage.setItem("user", JSON.stringify(user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        // No token comes back from /auth/register — user still logs in separately.
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
