import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
    },

    addOrder: (state, action) => {
      state.orders.push(action.payload);
    },

    updateOrder: (state, action) => {
      const index = state.orders.findIndex(
        (order) => order.id === action.payload.id
      );

      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },

    removeOrder: (state, action) => {
      state.orders = state.orders.filter(
        (order) => order.id !== action.payload
      );
    },

    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },

    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },

    setOrdersLoading: (state, action) => {
      state.loading = action.payload;
    },

    setOrdersError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setOrders,
  addOrder,
  updateOrder,
  removeOrder,
  setSelectedOrder,
  clearSelectedOrder,
  setOrdersLoading,
  setOrdersError,
} = ordersSlice.actions;

export default ordersSlice.reducer;
