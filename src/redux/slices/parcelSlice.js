import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  parcels: [
    { id: 'SND-8942-019', route: 'NBI to KAM', status: 'In Transit', date: 'Sep 28, 2024', weight: '2.4 kg', amount: 'Kes 1000', pickup: 'Quickmart Moi Avenue', destination: 'Nyayo Estate Gate D', courier: 'Samson Morara' },
    { id: 'SND-4029-108', route: 'NBI to KAM', status: 'Delivered', date: 'Sep 24, 2024', weight: '4.8 kg', amount: 'Kes 2000', pickup: 'Nairobi CBD', destination: 'Narok Town', courier: 'Sarah Jenkins' },
    { id: 'SND-7821-492', route: 'NBI to KAM', status: 'Pending', date: 'Sep 30, 2024', weight: '5.1 kg', amount: 'Kes 2000', pickup: 'Kisumu Hub', destination: 'Kakamega Center', courier: 'Unassigned' }
  ],
  selectedParcel: null,
  loading: false,
  error: null,
};

const parcelSlice = createSlice({
  name: 'parcels',
  initialState,
  reducers: {
    addParcel: (state, action) => {
      state.parcels.unshift(action.payload);
    },
    updateParcelDestination: (state, action) => {
      const { id, newDestination } = action.payload;
      const parcel = state.parcels.find((p) => p.id === id);
      // Business logic: only allow updates if not delivered
      if (parcel && parcel.status !== 'Delivered') {
        parcel.destination = newDestination;
      }
    },
    cancelParcelOrder: (state, action) => {
      const id = action.payload;
      const parcel = state.parcels.find((p) => p.id === id);
      // Business logic: only allow cancellation if not delivered
      if (parcel && parcel.status !== 'Delivered') {
        parcel.status = 'Cancelled';
      }
    },
    setSelectedParcel: (state, action) => {
      state.selectedParcel = action.payload;
    },
  },
});

export const { 
  addParcel, 
  updateParcelDestination, 
  cancelParcelOrder, 
  setSelectedParcel 
} = parcelSlice.actions;

export default parcelSlice.reducer;