// frontend/src/services/riderService.js
import api from './api';

export const riderService = {
  // Get rider dashboard
  getDashboard: async () => {
    try {
      const response = await api.get('/rider/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching rider dashboard:', error);
      throw error;
    }
  },

  // Mark parcel as picked up
  pickupParcel: async (parcelId) => {
    try {
      const response = await api.put(`/rider/parcels/${parcelId}/pickup`);
      return response.data;
    } catch (error) {
      console.error('Error picking up parcel:', error);
      throw error;
    }
  },

  // Mark parcel as delivered
  deliverParcel: async (parcelId, data) => {
    try {
      const response = await api.put(`/rider/parcels/${parcelId}/deliver`, data);
      return response.data;
    } catch (error) {
      console.error('Error delivering parcel:', error);
      throw error;
    }
  },

  // Update parcel status (In Transit)
  updateStatus: async (parcelId, statusData) => {
    try {
      const response = await api.put(`/rider/parcels/${parcelId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  },

  // Get rider profile
  getProfile: async () => {
    try {
      const response = await api.get('/rider/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching rider profile:', error);
      throw error;
    }
  },

  // Update rider profile
  updateProfile: async (data) => {
    try {
      const response = await api.put('/rider/profile', data);
      return response.data;
    } catch (error) {
      console.error('Error updating rider profile:', error);
      throw error;
    }
  }
};