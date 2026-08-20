import { configureStore } from '@reduxjs/toolkit';
import parcelReducer from './slices/parcelSlice';

export const store = configureStore({
  reducer: {
    parcels: parcelReducer,
  },
});