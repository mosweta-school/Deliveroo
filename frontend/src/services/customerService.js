// frontend/src/services/customerService.js
/**
 * Customer API service
 *
 * All customer-facing API calls live here. Components import this and
 * call methods — they never call axios directly.
 */

import api from './api';

export const customerService = {
  /**
   * Create a new delivery order.
   *
   * The backend gets the user from the JWT token — we never send user_id.
   * weight_category is NOT sent: the server derives it from weight.
   * payment_choice is 'cod' | 'full' for eligible customers, or null/undefined
   * for customers under the 40% deposit rule.
   */
  createOrder: async (orderData) => {
    const payload = {
      pickup_location: {
        address: orderData.pickup_address,
        street_address: orderData.pickup_street_address || '',
        city: orderData.pickup_city || '',
        county: orderData.pickup_county || '',
        latitude: orderData.pickup_latitude || null,
        longitude: orderData.pickup_longitude || null,
      },
      destination: {
        address: orderData.destination_address,
        street_address: orderData.destination_street_address || '',
        city: orderData.destination_city || '',
        county: orderData.destination_county || '',
        latitude: orderData.destination_latitude || null,
        longitude: orderData.destination_longitude || null,
      },
      sender_name: orderData.sender_name,
      sender_email: orderData.sender_email || '',
      sender_phone: orderData.sender_phone,
      receiver_name: orderData.receiver_name,
      receiver_email: orderData.receiver_email || '',
      receiver_phone: orderData.receiver_phone,
      weight: parseFloat(orderData.weight),
      distance: parseFloat(orderData.distance) || 100,
      is_fragile: orderData.is_fragile || false,
      item_description: orderData.item_description || '',
      notes: orderData.notes || '',
      // Only sent when the customer is on the eligible path.
      // The backend ignores it for non-eligible customers.
      payment_choice: orderData.payment_choice || null,
    };

    try {
      const response = await api.post('/customer/orders', payload);
      return response.data;
    } catch (error) {
      console.error('❌ [createOrder] Error:', error.response?.data || error.message);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create order';
      throw new Error(message);
    }
  },

  /**
   * Calculate price before placing the order.
   *
   * weight_category is no longer sent — the server derives it from weight.
   * If weight is 0/missing, the server falls back to a Medium default.
   */
  calculatePrice: async (priceData) => {
    try {
      const response = await api.post('/customer/orders/calculate-price', {
        weight: parseFloat(priceData.weight) || 0,
        distance: parseFloat(priceData.distance) || 100,
        is_fragile: priceData.is_fragile || false,
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating price:', error);
      throw error;
    }
  },

  /**
   * Dashboard summary for the logged-in customer.
   * Returns { user, stats, recent_orders }.
   * Cached server-side for 60s; safe to call on every mount.
   */
  getDashboard: async (recentLimit = 10) => {
    try {
      const response = await api.get('/customer/dashboard', {
        params: { recent_limit: recentLimit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to load dashboard';
      throw new Error(message);
    }
  },

  /**
   * Paginated list for My Orders.
   * Supports status filter and free-text search (server-side).
   */
  getOrders: async ({ page = 1, perPage = 10, status = null, q = '' } = {}) => {
    try {
      const params = { page, per_page: perPage };
      if (status && status !== 'all') params.status = status;
      if (q) params.q = q;

      const response = await api.get('/customer/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to load orders';
      throw new Error(message);
    }
  },

  /**
   * Single order with its full status timeline.
   * Used by the details modal so the dashboard list doesn't pay the cost
   * of serializing history for every row.
   */
  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/customer/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to load order';
      throw new Error(message);
    }
  },

  /**
   * Preview pricing + payment policy for a prospective order.
   * Called by Step 4 of the wizard to lay out the payment options.
   */
  previewPayment: async ({ weight, distance, is_fragile }) => {
    try {
      const response = await api.post('/customer/orders/preview-payment', {
        weight,
        distance,
        is_fragile,
      });
      return response.data;
    } catch (error) {
      console.error('Error previewing payment:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to preview payment';
      throw new Error(message);
    }
  },

  /**
   * Mock-pay the deposit (or full amount, if the customer chose 'full')
   * for an order. Returns the M-Pesa-shaped receipt and the updated parcel.
   */
  payOrderDeposit: async (orderId) => {
    try {
      const response = await api.post(`/payments/orders/${orderId}/pay`);
      return response.data;
    } catch (error) {
      console.error('Error paying order deposit:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to process payment';
      throw new Error(message);
    }
  },

  /**
   * List payments recorded against an order.
   */
  getOrderPayments: async (orderId) => {
    try {
      const response = await api.get(`/payments/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order payments:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to load payments';
      throw new Error(message);
    }
  },

  /**
   * Change the destination of an order.
   *
   * NOTE: the backend expects a NESTED body — { destination: {...} } —
   * not a bare string. Coordinates are optional but recommended; if
   * omitted, the backend falls back to haversine distance.
   */
  updateDestination: async (orderId, destination) => {
    try {
      const response = await api.patch(
        `/customer/orders/${orderId}/destination`,
        {
          destination: {
            address: destination.address,
            street_address: destination.street_address || '',
            city: destination.city || '',
            county: destination.county || '',
            latitude: destination.latitude ?? null,
            longitude: destination.longitude ?? null,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating destination:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update destination';
      throw new Error(message);
    }
  },

  /**
   * Cancel an order. Backend allows this only from
   * Pending / Picked Up / In Transit, and only for the owner.
   */
  cancelOrder: async (orderId) => {
    try {
      const response = await api.patch(`/customer/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to cancel order';
      throw new Error(message);
    }
  },
};