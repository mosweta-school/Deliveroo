// frontend/src/components/admin/RiderMap.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { socketService } from '../../services/socketService';
import { authService } from '../../services/authService';
import { Truck, Package, MapPin, RefreshCw, Navigation, Users, AlertCircle, Wifi, WifiOff } from 'lucide-react';

// Libraries for Google Maps
const LIBRARIES = ['geometry'];

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

// Default center (Nairobi, Kenya)
const defaultCenter = {
  lat: -1.2921,
  lng: 36.8219
};

// Map options
const mapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  gestureHandling: 'greedy',
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Status colors
const statusColors = {
  online: '#10B981',
  delivering: '#2563EB',
  on_break: '#F59E0B',
  offline: '#94A3B8'
};

// Status labels
const statusLabels = {
  online: '🟢 Online',
  delivering: '🔵 Delivering',
  on_break: '🟡 On Break',
  offline: '⚪ Offline'
};

// Create custom marker icon
const createMarkerIcon = (status, isActive = true) => {
  const color = statusColors[status] || statusColors.online;
  
  return {
    path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8z',
    fillColor: color,
    fillOpacity: isActive ? 1 : 0.7,
    strokeColor: '#FFFFFF',
    strokeWeight: isActive ? 3 : 2,
    scale: isActive ? 1.8 : 1.3,
    labelOrigin: new window.google.maps.Point(12, 12)
  };
};

// Status badge component
const StatusBadge = ({ status }) => {
  const colors = {
    online: 'bg-green-100 text-green-700 border-green-200',
    delivering: 'bg-blue-100 text-blue-700 border-blue-200',
    on_break: 'bg-amber-100 text-amber-700 border-amber-200',
    offline: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.offline}`}>
      {statusLabels[status] || status}
    </span>
  );
};

// Rider card component for the list
const RiderCard = ({ rider, isSelected, onClick }) => {
  const isActive = rider.status === 'online' || rider.status === 'delivering';
  
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all hover:shadow-md
        ${isSelected 
          ? 'border-blue-400 bg-blue-50 shadow-sm' 
          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
        }
        ${isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300'}
      `}
    >
      <div className="relative flex-shrink-0">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs
          ${isActive ? 'bg-blue-600' : 'bg-gray-400'}
        `}>
          {rider.rider_name?.split(' ').map(n => n[0]).join('') || 'R'}
        </div>
        {isActive && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 truncate">
            {rider.rider_name || 'Unknown Rider'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <StatusBadge status={rider.status || 'offline'} />
          {rider.current_parcel && (
            <span className="font-mono text-xs text-slate-400 truncate">
              {rider.current_parcel}
            </span>
          )}
        </div>
      </div>
      
      {isActive && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};

const RiderMap = () => {
  // State
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [map, setMap] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [zoomToRider, setZoomToRider] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Refs
  const animationFrameRef = useRef(null);
  const connectionCheckRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const socketInitialized = useRef(false);
  const mountedRef = useRef(true);
  const loadRetryCount = useRef(0);

  // Google Maps loading
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES
  });

  // Load riders function with retry
  const loadRiders = useCallback(() => {
    if (!mountedRef.current) return;
    
    if (!socketService.isConnected()) {
      console.warn('📍 Socket not connected, cannot load riders');
      setError('Socket not connected. Please refresh the page.');
      return;
    }
    
    console.log('📍 Loading riders...');
    setRefreshing(true);
    setError(null);
    
    try {
      socketService.getAllRiders();
    } catch (err) {
      console.error('Error loading riders:', err);
      setError('Failed to load riders. Please try again.');
    }
    
    // Retry after 1 second as backup
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && socketService.isConnected()) {
        console.log('📍 Retry loading riders...');
        socketService.getAllRiders();
        setTimeout(() => {
          if (mountedRef.current) {
            setRefreshing(false);
          }
        }, 1000);
      } else if (mountedRef.current) {
        setRefreshing(false);
      }
    }, 1000);
  }, []);

  // Handle rider location update
  const handleRiderUpdate = useCallback((data) => {
    if (!mountedRef.current) return;
    
    console.log('📍 Rider update received:', data);
    setLastUpdate(new Date());
    
    setRiders(prev => {
      const existingIndex = prev.findIndex(r => r.rider_id === data.rider_id);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { 
          ...updated[existingIndex], 
          ...data, 
          _lastUpdate: Date.now()
        };
        return updated;
      }
      
      return [...prev, { ...data, _lastUpdate: Date.now() }];
    });
  }, []);

  // Handle all riders response
  const handleAllRiders = useCallback((data) => {
    if (!mountedRef.current) return;
    
    console.log('📍 All riders received:', data);
    setLastUpdate(new Date());
    setRefreshing(false);
    setError(null);
    setLoading(false);
    loadRetryCount.current = 0;
    
    if (Array.isArray(data) && data.length > 0) {
      setRiders(data.map(r => ({ ...r, _lastUpdate: Date.now() })));
    } else {
      setRiders([]);
    }
  }, []);

  // Handle rider offline
  const handleRiderOffline = useCallback((data) => {
    if (!mountedRef.current) return;
    
    console.log('📍 Rider offline:', data);
    setRiders(prev => prev.filter(r => r.rider_id !== data.rider_id));
  }, []);

  // Handle connection status changes
  const checkConnection = useCallback(() => {
    if (!mountedRef.current) return;
    
    const connected = socketService.isConnected();
    setIsConnected(connected);
    
    if (connected && loading) {
      // If we just connected and still loading, load riders
      loadRiders();
    } else if (!connected && connectionAttempts < 3) {
      // Try to reconnect if disconnected
      setConnectionAttempts(prev => prev + 1);
      console.log(`📍 Connection attempt ${connectionAttempts + 1}...`);
      socketService.connect();
      
      // If still not connected after 3 attempts, show error
      if (connectionAttempts >= 2) {
        setError('Failed to connect to server. Please refresh the page.');
        setLoading(false);
      }
    }
  }, [loading, connectionAttempts, loadRiders]);

  // Initialize socket and event listeners
  useEffect(() => {
    mountedRef.current = true;
    
    if (!isLoaded || socketInitialized.current) return;
    
    socketInitialized.current = true;
    setLoading(true);

    // Connect socket with user info
    const user = authService.getCurrentUser();
    socketService.connect();

    // Register event listeners
    socketService.on('rider_location_update', handleRiderUpdate);
    socketService.on('all_rider_locations', handleAllRiders);
    socketService.on('rider_offline', handleRiderOffline);

    // Initial connection check
    checkConnection();

    // Check connection status periodically
    connectionCheckRef.current = setInterval(checkConnection, 3000);

    // Load riders after connection
    const initialLoad = () => {
      if (socketService.isConnected()) {
        loadRiders();
      } else {
        // Wait for connection
        let attempts = 0;
        const waitInterval = setInterval(() => {
          attempts++;
          if (socketService.isConnected()) {
            loadRiders();
            clearInterval(waitInterval);
          } else if (attempts >= 10) {
            clearInterval(waitInterval);
            setError('Failed to connect to server. Please refresh the page.');
            setLoading(false);
          }
        }, 1000);
        
        return () => clearInterval(waitInterval);
      }
    };
    
    initialLoad();

    // Cleanup
    return () => {
      mountedRef.current = false;
      socketService.off('rider_location_update');
      socketService.off('all_rider_locations');
      socketService.off('rider_offline');
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      socketInitialized.current = false;
    };
  }, [isLoaded, loadRiders, handleRiderUpdate, handleAllRiders, handleRiderOffline, checkConnection, connectionAttempts]);

  // Handle zoom to rider
  useEffect(() => {
    if (zoomToRider && map && mountedRef.current) {
      map.panTo({ 
        lat: parseFloat(zoomToRider.latitude), 
        lng: parseFloat(zoomToRider.longitude) 
      });
      map.setZoom(15);
      setZoomToRider(null);
    }
  }, [zoomToRider, map]);

  // Manual refresh
  const handleManualRefresh = useCallback(() => {
    if (refreshing || !mountedRef.current) return;
    
    setRefreshing(true);
    setError(null);
    
    // Try to connect if not connected
    if (!socketService.isConnected()) {
      socketService.connect();
      setTimeout(() => {
        if (mountedRef.current && socketService.isConnected()) {
          loadRiders();
        } else {
          setError('Failed to connect to server. Please refresh the page.');
          setRefreshing(false);
        }
      }, 1000);
    } else {
      loadRiders();
    }
  }, [refreshing, loadRiders]);

  // Get active riders count
  const activeCount = useMemo(() => {
    return riders.filter(r => r.status === 'online' || r.status === 'delivering').length;
  }, [riders]);

  // Get delivering riders count
  const deliveringCount = useMemo(() => {
    return riders.filter(r => r.status === 'delivering').length;
  }, [riders]);

  // Handle map load
  const onMapLoad = useCallback((mapInstance) => {
    if (mountedRef.current) {
      setMap(mapInstance);
    }
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((rider) => {
    setSelectedRider(rider);
  }, []);

  // Handle info window close
  const handleInfoClose = useCallback(() => {
    setSelectedRider(null);
  }, []);

  // Render loading state
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-xl border border-red-200">
        <div className="text-center p-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-semibold">Error loading map</p>
          <p className="text-sm text-red-500 mt-1">{loadError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Live Rider Tracking</h3>
            
            {/* Connection Status */}
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-600 font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-green-600">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {activeCount} Active
            </span>
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
              {deliveringCount} Delivering
            </span>
            <span className="text-slate-500">
              Total: {riders.length}
            </span>
            {lastUpdate && (
              <span className="text-slate-400 text-[10px]">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={12}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {riders.map((rider) => {
            const lat = parseFloat(rider.latitude);
            const lng = parseFloat(rider.longitude);
            
            if (isNaN(lat) || isNaN(lng)) {
              return null;
            }
            
            const status = rider.status || 'offline';
            const isActive = status === 'delivering' || status === 'online';
            const markerIcon = createMarkerIcon(status, isActive);
            
            return (
              <Marker
                key={rider.rider_id}
                position={{ lat, lng }}
                icon={markerIcon}
                label={{
                  text: '🚚',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                onClick={() => handleMarkerClick(rider)}
              />
            );
          })}

          {selectedRider && (
            <InfoWindow
              position={{ 
                lat: parseFloat(selectedRider.latitude), 
                lng: parseFloat(selectedRider.longitude) 
              }}
              onCloseClick={handleInfoClose}
            >
              <div className="p-2 min-w-[220px] max-w-[280px]">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  {selectedRider.rider_name || 'Unknown Rider'}
                </div>
                <div className="mt-2 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedRider.status || 'offline'} />
                  </div>
                  
                  {selectedRider.current_parcel && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Package className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-mono text-xs">{selectedRider.current_parcel}</span>
                      {selectedRider.parcel_status && (
                        <span className="text-xs text-slate-400">
                          ({selectedRider.parcel_status})
                        </span>
                      )}
                    </div>
                  )}
                  
                  {selectedRider.destination?.address && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs">{selectedRider.destination.address}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100">
                    📍 {parseFloat(selectedRider.latitude).toFixed(6)}, {parseFloat(selectedRider.longitude).toFixed(6)}
                  </div>
                  <div className="text-xs text-slate-400">
                    Updated: {selectedRider.last_updated ? new Date(selectedRider.last_updated).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Map Overlays */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-slate-200">
          <div className="text-xs text-slate-600">
            <span className="font-medium">{activeCount}</span> riders online
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-600">Loading riders...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center max-w-sm p-4">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={handleManualRefresh}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rider List */}
      <div className="border-t border-slate-200 bg-slate-50">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Riders ({riders.length})
            </span>
            {riders.length > 0 && (
              <span className="text-xs text-slate-400">
                Click a rider to focus on map
              </span>
            )}
          </div>
          
          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
            {riders.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-500">
                {isConnected ? 'No riders active' : 'Waiting for connection...'}
              </div>
            ) : (
              riders.map((rider) => (
                <RiderCard
                  key={rider.rider_id}
                  rider={rider}
                  isSelected={selectedRider?.rider_id === rider.rider_id}
                  onClick={() => {
                    setSelectedRider(rider);
                    setZoomToRider(rider);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderMap;