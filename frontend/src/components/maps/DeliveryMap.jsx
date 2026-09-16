// frontend/src/components/maps/DeliveryMap.jsx
import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useDispatch, useSelector } from 'react-redux';
import {
  setPickup,
  setDestination,
  setRoute,
  setDistance,
  setDuration,
  setMapLoading,
  setMapError,
} from '../../redux/slices/mapSlice';

const DEFAULT_PICKUP = { lat: -1.286389, lng: 36.817223 };
const DEFAULT_DESTINATION = { lat: -1.2921, lng: 36.8219 };

const DeliveryMap = ({
  pickupLocation,
  destinationLocation,
  onRouteCalculated,
  showLabels = true,
  height = '500px',
}) => {
  const dispatch = useDispatch();
  const mapRef = useRef(null);

  const [pickup, setPickupState] = useState(null);
  const [destination, setDestinationState] = useState(null);

  const { route, distance, duration, loading, error } = useSelector(
    (state) => state.map
  );

  // ---- Normalize coordinates from various shapes ----
  const extractCoords = (loc, fallback) => {
    if (!loc) return fallback;
    const lat = loc.latitude ?? loc.lat;
    const lng = loc.longitude ?? loc.lng;
    if (lat == null || lng == null) return fallback;
    return { lat: parseFloat(lat), lng: parseFloat(lng) };
  };

  // ---- Set pickup/destination from props ----
  useEffect(() => {
    const p = extractCoords(pickupLocation, DEFAULT_PICKUP);
    const d = extractCoords(destinationLocation, DEFAULT_DESTINATION);

    setPickupState(p);
    setDestinationState(d);
    dispatch(setPickup(p));
    dispatch(setDestination(d));
  }, [pickupLocation, destinationLocation, dispatch]);

  // ---- Compute route using legacy DirectionsService ----
  // We're still using legacy API here since it's simpler and still supported.
  // Later we can migrate to Route.computeRoutes.
  useEffect(() => {
    if (!window.google?.maps || !pickup || !destination) return;

    let cancelled = false;

    const computeRoute = () => {
      dispatch(setMapLoading(true));
      dispatch(setMapError(null));

      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: pickup,
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (cancelled) return;

          if (status === 'OK' && result.routes?.length > 0) {
            const r = result.routes[0];
            const path = r.overview_path.map((pt) => ({
              lat: pt.lat(),
              lng: pt.lng(),
            }));
            const distKm = (r.legs[0].distance.value / 1000).toFixed(1);
            const durMin = Math.ceil(r.legs[0].duration.value / 60);

            dispatch(setRoute(path));
            dispatch(setDistance(`${distKm} km`));
            dispatch(setDuration(`${durMin} mins`));

            if (onRouteCalculated) {
              onRouteCalculated({
                distance: `${distKm} km`,
                duration: `${durMin} mins`,
              });
            }
          } else {
            dispatch(setMapError(`Unable to calculate route: ${status}`));
          }
          dispatch(setMapLoading(false));
        }
      );
    };

    computeRoute();

    return () => {
      cancelled = true;
    };
  }, [pickup, destination, dispatch, onRouteCalculated]);

  // ---- Fit map bounds when both markers exist ----
  useEffect(() => {
    if (!mapRef.current || !pickup || !destination || !window.google?.maps) return;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(pickup);
    bounds.extend(destination);
    mapRef.current.fitBounds(bounds, { padding: 60 });
  }, [pickup, destination]);

  if (!pickup || !destination) {
    return (
      <div
        className="flex items-center justify-center bg-slate-50 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height }}
        center={pickup}
        zoom={14}
        onLoad={(map) => (mapRef.current = map)}
        options={{
          gestureHandling: 'greedy',
          disableDefaultUI: false,
        }}
      >
        {/* Pickup marker */}
        <Marker
          position={pickup}
          title="Pickup Location"
          label={
            showLabels
              ? {
                  text: 'P',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }
              : undefined
          }
        />

        {/* Destination marker */}
        <Marker
          position={destination}
          title="Destination"
          label={
            showLabels
              ? {
                  text: 'D',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }
              : undefined
          }
        />

        {/* Route polyline */}
        {route && route.length > 1 && (
          <Polyline
            path={route}
            strokeColor="#2563EB"
            strokeOpacity={0.9}
            strokeWeight={4}
          />
        )}
      </GoogleMap>

      {/* Info panel */}
      <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        {loading && (
          <div className="flex items-center gap-2 text-slate-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            <span>Calculating route...</span>
          </div>
        )}

        {error && (
          <div className="text-red-600">
            <p className="font-medium">Route error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Distance</p>
              <p className="text-lg font-semibold text-slate-900">
                {distance || 'Calculating...'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Estimated Duration</p>
              <p className="text-lg font-semibold text-slate-900">
                {duration || 'Calculating...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryMap;