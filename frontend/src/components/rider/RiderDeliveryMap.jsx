// frontend/src/components/rider/RiderDeliveryMap.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { Navigation, MapPin, Truck, Package, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

// Libraries for Google Maps
const LIBRARIES = ['geometry', 'routes'];

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
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ lightness: 100 }]
    }
  ]
};

// Custom marker icons
const createMarkerIcon = (color, label, isPulsing = false) => {
  return {
    path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 1.5,
    labelOrigin: new window.google.maps.Point(12, 12)
  };
};

// Create custom marker with label
const createLabeledMarker = (color, label, isPulsing = false) => {
  return {
    path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 1.8,
    labelOrigin: new window.google.maps.Point(12, 8)
  };
};

// Route info panel component
const RouteInfoPanel = ({ distance, duration, status, parcel }) => {
  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Picked Up': 'bg-blue-100 text-blue-700 border-blue-200',
    'In Transit': 'bg-purple-100 text-purple-700 border-purple-200',
    'Delivered': 'bg-green-100 text-green-700 border-green-200',
    'Cancelled': 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
          <Navigation className="h-4 w-4 text-blue-600" />
          Route Information
        </h4>
        {parcel && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[parcel.status] || statusColors.Pending}`}>
            {parcel.status || 'Pending'}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500 text-xs">Total Distance</p>
          <p className="font-medium text-slate-900">{distance || 'Calculating...'}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs">Estimated Duration</p>
          <p className="font-medium text-slate-900">{duration || 'Calculating...'}</p>
        </div>
        {parcel && (
          <>
            <div>
              <p className="text-slate-500 text-xs">Tracking Number</p>
              <p className="font-mono text-xs font-medium text-slate-900">{parcel.tracking_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Weight</p>
              <p className="font-medium text-slate-900">{parcel.weight ? `${parcel.weight}kg` : 'N/A'}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Legend component
const MapLegend = () => {
  return (
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-3">
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
          <span className="text-slate-600">Your Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
          <span className="text-slate-600">Pickup Point</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
          <span className="text-slate-600">Destination</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-blue-400 border-t-2 border-dashed border-blue-400" />
          <span className="text-slate-600">Your Route</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-green-500 border-t-2 border-green-500" />
          <span className="text-slate-600">Delivery Route</span>
        </div>
      </div>
    </div>
  );
};

const RiderDeliveryMap = ({ 
  riderLocation, 
  pickupLocation, 
  destinationLocation, 
  parcel,
  onRouteCalculated 
}) => {
  const [map, setMap] = useState(null);
  const [routeToPickup, setRouteToPickup] = useState([]);
  const [routeToDestination, setRouteToDestination] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [bounds, setBounds] = useState(null);
  
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const mountedRef = useRef(true);

  // Google Maps loading
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES
  });

  // Calculate routes
  const calculateRoutes = useCallback(() => {
    if (!isLoaded || !riderLocation || !pickupLocation || !destinationLocation) {
      return;
    }

    setLoading(true);
    setError(null);

    const directionsService = new window.google.maps.DirectionsService();
    directionsServiceRef.current = directionsService;

    // Calculate route from rider to pickup
    const route1Request = {
      origin: { lat: riderLocation.lat, lng: riderLocation.lng },
      destination: { lat: pickupLocation.lat, lng: pickupLocation.lng },
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true
    };

    // Calculate route from pickup to destination
    const route2Request = {
      origin: { lat: pickupLocation.lat, lng: pickupLocation.lng },
      destination: { lat: destinationLocation.lat, lng: destinationLocation.lng },
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true
    };

    // Get both routes
    Promise.all([
      new Promise((resolve, reject) => {
        directionsService.route(route1Request, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            reject(new Error(`Route to pickup failed: ${status}`));
          }
        });
      }),
      new Promise((resolve, reject) => {
        directionsService.route(route2Request, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            reject(new Error(`Route to destination failed: ${status}`));
          }
        });
      })
    ])
    .then(([route1, route2]) => {
      if (!mountedRef.current) return;

      // Extract paths
      const path1 = route1.routes[0]?.overview_path?.map(point => ({
        lat: point.lat(),
        lng: point.lng()
      })) || [];

      const path2 = route2.routes[0]?.overview_path?.map(point => ({
        lat: point.lat(),
        lng: point.lng()
      })) || [];

      // Calculate total distance and duration
      const totalDistance = 
        (route1.routes[0]?.legs[0]?.distance?.value || 0) +
        (route2.routes[0]?.legs[0]?.distance?.value || 0);
      
      const totalDuration = 
        (route1.routes[0]?.legs[0]?.duration?.value || 0) +
        (route2.routes[0]?.legs[0]?.duration?.value || 0);

      setRouteToPickup(path1);
      setRouteToDestination(path2);
      
      // Format distance and duration
      const distanceKm = (totalDistance / 1000).toFixed(1);
      const durationMinutes = Math.ceil(totalDuration / 60);
      const durationHours = Math.floor(durationMinutes / 60);
      const durationRemainingMinutes = durationMinutes % 60;
      
      let durationStr = '';
      if (durationHours > 0) {
        durationStr = `${durationHours}h ${durationRemainingMinutes}m`;
      } else {
        durationStr = `${durationMinutes}m`;
      }
      
      setDistance(`${distanceKm} km`);
      setDuration(durationStr);

      if (onRouteCalculated) {
        onRouteCalculated({
          distance: distanceKm,
          duration: durationStr,
          routeToPickup: path1,
          routeToDestination: path2
        });
      }

      // Calculate bounds to fit all points
      const allPoints = [
        { lat: riderLocation.lat, lng: riderLocation.lng },
        { lat: pickupLocation.lat, lng: pickupLocation.lng },
        { lat: destinationLocation.lat, lng: destinationLocation.lng },
        ...path1,
        ...path2
      ];

      const newBounds = new window.google.maps.LatLngBounds();
      allPoints.forEach(point => {
        newBounds.extend(point);
      });
      setBounds(newBounds);

      setLoading(false);
    })
    .catch((err) => {
      if (!mountedRef.current) return;
      console.error('Route calculation error:', err);
      setError(err.message || 'Failed to calculate route');
      setLoading(false);
    });
  }, [isLoaded, riderLocation, pickupLocation, destinationLocation, onRouteCalculated]);

  // Fit map to bounds when routes are calculated
  useEffect(() => {
    if (map && bounds) {
      map.fitBounds(bounds);
      // Add a small padding
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        map.setZoom(Math.min(map.getZoom(), 15));
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [map, bounds]);

  // Calculate routes when locations change
  useEffect(() => {
    if (isLoaded && riderLocation && pickupLocation && destinationLocation) {
      calculateRoutes();
    }
  }, [isLoaded, riderLocation, pickupLocation, destinationLocation, calculateRoutes]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle map load
  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Create marker icons
  const riderMarkerIcon = useMemo(() => {
    return {
      path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8z',
      fillColor: '#2563EB',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 3,
      scale: 2,
      labelOrigin: new window.google.maps.Point(12, 12)
    };
  }, []);

  const pickupMarkerIcon = useMemo(() => {
    return {
      path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8z',
      fillColor: '#22C55E',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 1.5,
      labelOrigin: new window.google.maps.Point(12, 12)
    };
  }, []);

  const destinationMarkerIcon = useMemo(() => {
    return {
      path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8z',
      fillColor: '#EF4444',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 1.5,
      labelOrigin: new window.google.maps.Point(12, 12)
    };
  }, []);

  // Render loading state
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-xl border border-red-200">
        <div className="text-center p-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-semibold">Error loading map</p>
          <p className="text-sm text-red-500 mt-1">{loadError.message}</p>
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

  if (!riderLocation || !pickupLocation || !destinationLocation) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-center">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No active delivery</p>
          <p className="text-sm text-slate-400">You don't have any assigned deliveries</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={riderLocation}
          zoom={13}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {/* Route from Rider to Pickup (Blue Dashed) */}
          {routeToPickup.length > 1 && (
            <Polyline
              path={routeToPickup}
              strokeColor="#3B82F6"
              strokeOpacity={0.8}
              strokeWeight={4}
              options={{
                strokeColor: '#3B82F6',
                strokeOpacity: 0.8,
                strokeWeight: 4,
                icons: [{
                  icon: {
                    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 3,
                    strokeColor: '#3B82F6',
                    fillColor: '#3B82F6',
                    fillOpacity: 1
                  },
                  offset: '100%',
                  repeat: '20px'
                }]
              }}
            />
          )}

          {/* Route from Pickup to Destination (Green Solid) */}
          {routeToDestination.length > 1 && (
            <Polyline
              path={routeToDestination}
              strokeColor="#22C55E"
              strokeOpacity={0.9}
              strokeWeight={5}
              options={{
                strokeColor: '#22C55E',
                strokeOpacity: 0.9,
                strokeWeight: 5,
                icons: [{
                  icon: {
                    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 4,
                    strokeColor: '#22C55E',
                    fillColor: '#22C55E',
                    fillOpacity: 1
                  },
                  offset: '100%',
                  repeat: '25px'
                }]
              }}
            />
          )}

          {/* Rider Location Marker with Pulse */}
          <Marker
            position={riderLocation}
            icon={riderMarkerIcon}
            label={{
              text: '📍',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
            onClick={() => setSelectedPoint('rider')}
          />

          {/* Pickup Point Marker */}
          <Marker
            position={pickupLocation}
            icon={pickupMarkerIcon}
            label={{
              text: '📦',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
            onClick={() => setSelectedPoint('pickup')}
          />

          {/* Destination Marker */}
          <Marker
            position={destinationLocation}
            icon={destinationMarkerIcon}
            label={{
              text: '🎯',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
            onClick={() => setSelectedPoint('destination')}
          />

          {/* Info Windows */}
          {selectedPoint === 'rider' && (
            <InfoWindow
              position={riderLocation}
              onCloseClick={() => setSelectedPoint(null)}
            >
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  <span className="font-medium text-slate-900">Your Location</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {riderLocation.lat.toFixed(6)}, {riderLocation.lng.toFixed(6)}
                </p>
              </div>
            </InfoWindow>
          )}

          {selectedPoint === 'pickup' && (
            <InfoWindow
              position={pickupLocation}
              onCloseClick={() => setSelectedPoint(null)}
            >
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-slate-900">Pickup Point</span>
                </div>
                {parcel?.pickup_location?.address && (
                  <p className="text-xs text-slate-600 mt-1">{parcel.pickup_location.address}</p>
                )}
              </div>
            </InfoWindow>
          )}

          {selectedPoint === 'destination' && (
            <InfoWindow
              position={destinationLocation}
              onCloseClick={() => setSelectedPoint(null)}
            >
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-slate-900">Destination</span>
                </div>
                {parcel?.destination?.address && (
                  <p className="text-xs text-slate-600 mt-1">{parcel.destination.address}</p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Map Legend */}
        <MapLegend />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-600">Calculating route...</span>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center max-w-sm p-4">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={calculateRoutes}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Route Info Panel */}
      <RouteInfoPanel 
        distance={distance} 
        duration={duration} 
        parcel={parcel}
      />

      {/* Delivery Progress */}
      {parcel && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
            <Truck className="h-4 w-4 text-blue-600" />
            Delivery Progress
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-green-500" />
                  Pickup
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-red-500" />
                  Destination
                </span>
              </div>
              <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 via-blue-500 to-red-500 rounded-full transition-all duration-1000"
                  style={{ 
                    width: parcel.status === 'Delivered' ? '100%' :
                           parcel.status === 'In Transit' ? '65%' :
                           parcel.status === 'Picked Up' ? '35%' :
                           '10%'
                  }}
                />
                {/* Animated dot */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md transition-all duration-1000 animate-pulse"
                  style={{ 
                    left: parcel.status === 'Delivered' ? 'calc(100% - 8px)' :
                           parcel.status === 'In Transit' ? 'calc(65% - 8px)' :
                           parcel.status === 'Picked Up' ? 'calc(35% - 8px)' :
                           'calc(10% - 8px)'
                  }}
                />
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                parcel.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                parcel.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                parcel.status === 'Picked Up' ? 'bg-purple-100 text-purple-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {parcel.status || 'Pending'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderDeliveryMap;