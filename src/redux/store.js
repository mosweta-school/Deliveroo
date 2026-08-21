import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import ordersReducer from "./slices/ordersSlice";
import adminReducer from "./slices/adminSlice";
import mapReducer from "./slices/mapSlice";
import notificationReducer from "./slices/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    admin: adminReducer,
    map: mapReducer,
    notifications: notificationReducer,
  },
});
