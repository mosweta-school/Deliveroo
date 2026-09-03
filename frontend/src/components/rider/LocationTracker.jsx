// frontend/src/components/rider/LocationTracker.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { socketService } from '../../services/socketService';
import { Navigation, Wifi, WifiOff, AlertCircle, CheckCircle, MapPin, RefreshCw } from 'lucide-react';

const LocationTracker = ({ riderId, enabled = true, onLocationUpdate }) => {
  // State
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [sendCount, setSendCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const lastLocationRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Send location to server
  const sendLocation = useCallback((latitude, longitude, speed = 0) => {
    if (!socketService.isConnected()) {
      console.warn('📍 Socket not connected, cannot send location');
      return false;
    }
    
    try {
      const sent = socketService.updateLocation(latitude, longitude, 'online', speed);
      if (sent) {
        setLastSent(new Date());
        setSendCount(prev => prev + 1);
        setRetryCount(0);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to send location:', err);
      return false;
    }
  }, []);

  // Get current position and send
  const getAndSendLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mountedRef.current) return;
        
        const { latitude, longitude, accuracy: acc, speed } = pos.coords;
        
        // Update state
        setLocation({ latitude, longitude, speed: speed || 0 });
        setAccuracy(acc);
        setError(null);
        
        // Store for comparison
        lastLocationRef.current = { latitude, longitude };
        
        // Send to server
        const sent = sendLocation(latitude, longitude, speed || 0);
        
        // Callback for parent component
        if (onLocationUpdate && sent) {
          onLocationUpdate({ latitude, longitude, speed: speed || 0 });
        }
      },
      (err) => {
        if (!mountedRef.current) return;
        
        console.error('Geolocation error:', err);
        setError(`Location error: ${err.message}`);
        
        // Attempt retry with exponential backoff
        const backoff = Math.min(1000 * Math.pow(2, retryCount), 10000);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setRetryCount(prev => prev + 1);
            getAndSendLocation();
          }
        }, backoff);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 5000 
      }
    );
  }, [sendLocation, onLocationUpdate, retryCount]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!enabled || !riderId) {
      console.log('📍 Tracking disabled or no rider ID');
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    // Clean up existing tracking
    cleanup();

    setIsTracking(true);
    setError(null);

    // Get initial location
    getAndSendLocation();

    // Watch position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!mountedRef.current) return;
        
        const { latitude, longitude, accuracy: acc, speed } = pos.coords;
        
        // Update state
        setLocation({ latitude, longitude, speed: speed || 0 });
        setAccuracy(acc);
        setError(null);
        
        // Store for comparison
        lastLocationRef.current = { latitude, longitude };
        
        // Send to server
        sendLocation(latitude, longitude, speed || 0);
        
        // Callback for parent
        if (onLocationUpdate) {
          onLocationUpdate({ latitude, longitude, speed: speed || 0 });
        }
      },
      (err) => {
        if (!mountedRef.current) return;
        console.error('Watch error:', err);
        setError(`Watch error: ${err.message}`);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 5000 
      }
    );

    // Fallback: send location every 3 seconds
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mountedRef.current) return;
          
          const { latitude, longitude, speed } = pos.coords;
          
          // Only send if location changed significantly or it's been a while
          const last = lastLocationRef.current;
          if (last) {
            const latDiff = Math.abs(last.latitude - latitude);
            const lngDiff = Math.abs(last.longitude - longitude);
            if (latDiff < 0.00001 && lngDiff < 0.00001) {
              // Location hasn't changed significantly, skip
              return;
            }
          }
          
          // Update state
          setLocation({ latitude, longitude, speed: speed || 0 });
          setError(null);
          lastLocationRef.current = { latitude, longitude };
          
          // Send to server
          sendLocation(latitude, longitude, speed || 0);
          
          // Callback for parent
          if (onLocationUpdate) {
            onLocationUpdate({ latitude, longitude, speed: speed || 0 });
          }
        },
        () => {}, // Silent fail for fallback
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 5000 }
      );
    }, 3000);
  }, [enabled, riderId, getAndSendLocation, sendLocation, cleanup, onLocationUpdate]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    cleanup();
    setIsTracking(false);
    setError(null);
  }, [cleanup]);

  // Initialize tracking
  useEffect(() => {
    mountedRef.current = true;
    
    // Connect socket
    socketService.connect();
    
    // Check connection status
    const connectionInterval = setInterval(() => {
      setIsConnected(socketService.isConnected());
    }, 2000);

    // Start tracking if enabled
    if (enabled && riderId) {
      startTracking();
    }

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      stopTracking();
      clearInterval(connectionInterval);
    };
  }, [enabled, riderId, startTracking, stopTracking]);

  // Restart tracking if enabled changes
  useEffect(() => {
    if (enabled && riderId) {
      startTracking();
    } else {
      stopTracking();
    }
  }, [enabled, riderId, startTracking, stopTracking]);

  // Format coordinates for display
  const formatCoords = useCallback((lat, lng) => {
    return `${lat?.toFixed(6)}, ${lng?.toFixed(6)}`;
  }, []);

  // Calculate accuracy indicator
  const getAccuracyColor = useCallback((acc) => {
    if (!acc) return 'text-slate-400';
    if (acc < 10) return 'text-green-500';
    if (acc < 50) return 'text-amber-500';
    return 'text-red-500';
  }, []);

  // If tracking is disabled, return null
  if (!enabled) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-700">Location</span>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-red-500" />
          )}
          
          {/* Tracking Status */}
          {isTracking ? (
            <div className="flex items-center gap-1">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
              </div>
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <span className="text-xs text-gray-400">Stopped</span>
            </div>
          )}
        </div>
      </div>

      {/* Location Display */}
      {location ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
            <span className="font-mono text-xs">
              {formatCoords(location.latitude, location.longitude)}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {/* Accuracy */}
            {accuracy !== null && (
              <div className="flex items-center gap-1">
                <span className={`font-medium ${getAccuracyColor(accuracy)}`}>
                  ±{Math.round(accuracy)}m
                </span>
              </div>
            )}
            
            {/* Speed */}
            {location.speed > 0 && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-blue-600">
                  {(location.speed * 3.6).toFixed(1)} km/h
                </span>
              </div>
            )}
            
            {/* Last Sent */}
            {lastSent && (
              <div className="flex items-center gap-1">
                <span className="text-slate-400">
                  sent {Math.floor((Date.now() - lastSent.getTime()) / 1000)}s ago
                </span>
              </div>
            )}
          </div>
          
          {/* Send Count */}
          {sendCount > 0 && (
            <div className="text-[10px] text-slate-400">
              Updates sent: {sendCount}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-slate-400 py-1">
          {isTracking ? 'Acquiring location...' : 'Location tracking stopped'}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-700">{error}</p>
            {retryCount > 0 && (
              <p className="text-[10px] text-red-500 mt-0.5">
                Retry {retryCount}...
              </p>
            )}
          </div>
          <button
            onClick={getAndSendLocation}
            className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>
      )}

      {/* Control Buttons */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            {isTracking ? (
              <span className="text-green-600">✓ Tracking</span>
            ) : (
              <span className="text-slate-400">Paused</span>
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={getAndSendLocation}
            disabled={!isTracking || !isConnected}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send location now"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              isTracking 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {isTracking ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationTracker;