import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  orders: [],
  statistics: {
    totalOrders: 0,
    pendingOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
  },
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setAdminOrders: (state, action) => {
      state.orders = action.payload;
    },

    updateAdminOrder: (state, action) => {
      const index = state.orders.findIndex(
        (order) => order.id === action.payload.id
      );

      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },

    setStatistics: (state, action) => {
      state.statistics = action.payload;
    },

    setAdminLoading: (state, action) => {
      state.loading = action.payload;
    },

    setAdminError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminOrders,
  updateAdminOrder,
  setStatistics,
  setAdminLoading,
  setAdminError,
} = adminSlice.actions;

export default adminSlice.reducer;
