// frontend/src/services/adminService.js
import api from './api';

export const adminService = {
  // Dashboard Stats
  getStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  },

  // Get all parcels with pagination
  getParcels: async (page = 1, perPage = 20, status = null) => {
    try {
      const params = { page, per_page: perPage };
      if (status && status !== 'all') {
        params.status = status;
      }
      const response = await api.get('/admin/parcels', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching parcels:', error);
      throw error;
    }
  },

  // Get all users
  getUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get all couriers/drivers
  getCouriers: async () => {
    try {
      const response = await api.get('/admin/couriers');
      return response.data;
    } catch (error) {
      console.error('Error fetching couriers:', error);
      throw error;
    }
  },

  // Update parcel status
  updateParcelStatus: async (parcelId, statusData) => {
    try {
      const response = await api.put(`/admin/parcels/${parcelId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating parcel status:', error);
      throw error;
    }
  },

  // Update parcel destination (for admin)
  updateDestination: async (parcelId, destinationData) => {
    try {
      const response = await api.patch(`/parcels/${parcelId}/destination`, destinationData);
      return response.data;
    } catch (error) {
      console.error('Error updating destination:', error);
      throw error;
    }
  },

  // Update parcel location (for admin)
  updateParcelLocation: async (parcelId, locationData) => {
    try {
      const response = await api.put(`/admin/parcels/${parcelId}/location`, locationData);
      return response.data;
    } catch (error) {
      console.error('Error updating parcel location:', error);
      throw error;
    }
  },

  // Get activities
  getActivities: async (limit = 10) => {
    try {
      const response = await api.get('/admin/activities', { params: { limit } });
      return response.data;
    } catch (error) {
      console.warn('Activities endpoint not available:', error);
      return { activities: [] };
    }
  },
    createParcel: async (parcelData) => {
    try {
      const response = await api.post('/parcels/', parcelData);
      return response.data;
    } catch (error) {
      console.error('Error creating parcel:', error);
      throw error;
    }
  },
    // Get all couriers/drivers
  getCouriers: async () => {
    try {
      const response = await api.get('/admin/drivers');
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },

  // Update driver status
  updateDriverStatus: async (driverId, statusData) => {
    try {
      const response = await api.put(`/admin/drivers/${driverId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  },
  // Assign rider to parcel
  assignRider: async (parcelId, riderId) => {
    try {
      const response = await api.put(`/admin/parcels/${parcelId}/assign-rider`, { rider_id: riderId });
      return response.data;
    } catch (error) {
      console.error('Error assigning rider:', error);
      throw error;
    }
  },
  // Search parcels
  searchParcels: async (searchTerm) => {
    try {
      const response = await api.get('/admin/parcels/search', { 
        params: { q: searchTerm } 
      });
      return response.data;
    } catch (error) {
      console.error('Error searching parcels:', error);
      throw error;
    }
  }
};



