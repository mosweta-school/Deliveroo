// frontend/src/services/socketService.js
import { io } from 'socket.io-client';
import { authService } from './authService';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.userId = null;
    this.role = null;
    this.connectionTimeout = null;
    this.isConnecting = false;
  }

  connect() {
    // Prevent multiple connection attempts
    if (this.isConnecting) {
      console.log('🔌 Connection already in progress');
      return;
    }

    if (this.socket && this.socket.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('🔌 No token found, cannot connect socket');
      return;
    }

    const user = authService.getCurrentUser();
    if (user) {
      this.userId = user.id;
      this.role = user.role;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    console.log('🔌 Connecting to socket...');
    this.isConnecting = true;

    // Close existing socket if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(API_URL, {
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true
    });

    // --- FIX: Use separate handler methods to avoid 'this' binding issues ---
    this.socket.on('connect', () => {
      this._handleConnect();
    });

    this.socket.on('disconnect', () => {
      this._handleDisconnect();
    });

    this.socket.on('connect_error', (error) => {
      this._handleConnectError(error);
    });

    this.socket.on('reconnect', () => {
      this._handleReconnect();
    });

    // --- FIX: Set up event forwarding correctly ---
    this.socket.on('rider_location_update', (data) => {
      this._emitEvent('rider_location_update', data);
    });

    this.socket.on('all_rider_locations', (data) => {
      this._emitEvent('all_rider_locations', data);
    });

    this.socket.on('rider_offline', (data) => {
      this._emitEvent('rider_offline', data);
    });

    this.socket.on('authenticate_response', (data) => {
      this._emitEvent('authenticate_response', data);
    });

    // Forward any other registered listeners
    Object.keys(this.listeners).forEach(event => {
      if (this.socket && !['rider_location_update', 'all_rider_locations', 'rider_offline', 'authenticate_response'].includes(event)) {
        this.socket.on(event, this.listeners[event]);
      }
    });
  }

  // --- FIX: Separate handler methods ---
  _handleConnect() {
    console.log('🔌 Socket connected successfully');
    this.connected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Authenticate with server
    if (this.userId && this.role) {
      this.socket.emit('authenticate', { user_id: this.userId, role: this.role });
    }
  }

  _handleDisconnect() {
    console.log('🔌 Socket disconnected');
    this.connected = false;
    this.isConnecting = false;
  }

  _handleConnectError(error) {
    console.error('🔌 Socket connection error:', error.message);
    this.connected = false;
    this.isConnecting = false;
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🔌 Max reconnect attempts reached, trying polling only...');
      if (this.socket) {
        this.socket.io.opts.transports = ['polling'];
        this.socket.connect();
      }
    }
  }

  _handleReconnect() {
    console.log('🔌 Socket reconnected');
    this.connected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Re-authenticate on reconnect
    if (this.userId && this.role) {
      this.socket.emit('authenticate', { user_id: this.userId, role: this.role });
    }
  }

  _emitEvent(event, data) {
    const listeners = this.listeners[event] || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.isConnecting = false;
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Also register on socket if already connected
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    delete this.listeners[event];
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
      return true;
    } else {
      console.warn('🔌 Socket not connected, unable to emit:', event);
      return false;
    }
  }

  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  // Rider methods
  updateLocation(latitude, longitude, status = 'online', speed = 0) {
    return this.emit('update_location', { 
      user_id: this.userId,
      latitude, 
      longitude, 
      status, 
      speed 
    });
  }

  updateRiderStatus(status) {
    return this.emit('rider_status_update', { status });
  }

  // Admin methods
  getAllRiders() {
    if (this.role !== 'admin') {
      console.warn('Only admins can get all riders');
      return false;
    }
    return this.emit('get_all_riders', {});
  }
}

// Create singleton instance
export const socketService = new SocketService();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.socketService = socketService;
}