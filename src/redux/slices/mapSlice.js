import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pickup: null,
  destination: null,
  route: [],
  distance: null,
  duration: null,
  loading: false,
  error: null,
};

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setPickup: (state, action) => {
      state.pickup = action.payload;
    },

    setDestination: (state, action) => {
      state.destination = action.payload;
    },

    setRoute: (state, action) => {
      state.route = action.payload;
    },

    setDistance: (state, action) => {
      state.distance = action.payload;
    },

    setDuration: (state, action) => {
      state.duration = action.payload;
    },

    setMapLoading: (state, action) => {
      state.loading = action.payload;
    },

    setMapError: (state, action) => {
      state.error = action.payload;
    },

    clearMap: (state) => {
      state.pickup = null;
      state.destination = null;
      state.route = [];
      state.distance = null;
      state.duration = null;
      state.error = null;
    },
  },
});

export const {
  setPickup,
  setDestination,
  setRoute,
  setDistance,
  setDuration,
  setMapLoading,
  setMapError,
  clearMap,
} = mapSlice.actions;

export default mapSlice.reducer;
