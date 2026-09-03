// frontend/src/components/maps/DeliveryMap.jsx
import {
  APIProvider,
  Map,
  Marker,
  Polyline,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setPickup,
  setDestination,
  setRoute,
  setDistance,
  setDuration,
  setMapLoading,
  setMapError,
} from "../../redux/slices/mapSlice";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const DEFAULT_PICKUP = {
  lat: -1.286389,
  lng: 36.817223,
};

const DEFAULT_DESTINATION = {
  lat: -1.2921,
  lng: 36.8219,
};

function RouteCalculator({ pickup, destination, onRouteCalculated }) {
  const dispatch = useDispatch();
  const routesLibrary = useMapsLibrary("routes");

  useEffect(() => {
    if (!routesLibrary || !pickup || !destination) {
      return;
    }

    let cancelled = false;

    async function calculateRoute() {
      try {
        dispatch(setMapLoading(true));
        dispatch(setMapError(null));

        const { Route } = routesLibrary;

        const request = {
          origin: pickup,
          destination: destination,
          travelMode: "DRIVING",
          fields: [
            "path",
            "distanceMeters",
            "durationMillis",
          ],
          polylineQuality: "HIGH_QUALITY",
        };

        const result = await Route.computeRoutes(request);

        if (cancelled) {
          return;
        }

        const routes = result.routes;

        if (!routes || routes.length === 0) {
          throw new Error("No driving route found.");
        }

        const route = routes[0];

        const path = route.path.map((point) => ({
          lat: point.lat,
          lng: point.lng,
        }));

        const distanceKm = (
          route.distanceMeters / 1000
        ).toFixed(1);

        const durationMinutes = Math.ceil(
          route.durationMillis / 60000
        );

        dispatch(setRoute(path));
        dispatch(setDistance(`${distanceKm} km`));
        dispatch(
          setDuration(`${durationMinutes} mins`)
        );

        if (onRouteCalculated) {
          onRouteCalculated({ 
            distance: `${distanceKm} km`, 
            duration: `${durationMinutes} mins` 
          });
        }
      } catch (error) {
        console.error("Route calculation failed:", error);

        dispatch(
          setMapError(
            error.message || "Unable to calculate route."
          )
        );
      } finally {
        if (!cancelled) {
          dispatch(setMapLoading(false));
        }
      }
    }

    calculateRoute();

    return () => {
      cancelled = true;
    };
  }, [
    routesLibrary,
    pickup,
    destination,
    dispatch,
    onRouteCalculated,
  ]);

  return null;
}

function DeliveryMap({ 
  pickupLocation, 
  destinationLocation, 
  onRouteCalculated,
  showLabels = true,
  height = "500px"
}) {
  const dispatch = useDispatch();
  const [pickup, setPickupState] = useState(null);
  const [destination, setDestinationState] = useState(null);

  const {
    route,
    distance,
    duration,
    loading,
    error,
  } = useSelector((state) => state.map);

  // Set pickup and destination from props
  useEffect(() => {
    if (pickupLocation) {
      // Handle both possible field names (latitude/lat, longitude/lng)
      const lat = pickupLocation.latitude || pickupLocation.lat;
      const lng = pickupLocation.longitude || pickupLocation.lng;
      
      if (lat && lng) {
        const pickupCoords = {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        };
        setPickupState(pickupCoords);
        dispatch(setPickup(pickupCoords));
      } else {
        // Fallback to default if no coordinates
        setPickupState(DEFAULT_PICKUP);
        dispatch(setPickup(DEFAULT_PICKUP));
      }
    } else {
      setPickupState(DEFAULT_PICKUP);
      dispatch(setPickup(DEFAULT_PICKUP));
    }

    if (destinationLocation) {
      const lat = destinationLocation.latitude || destinationLocation.lat;
      const lng = destinationLocation.longitude || destinationLocation.lng;
      
      if (lat && lng) {
        const destCoords = {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        };
        setDestinationState(destCoords);
        dispatch(setDestination(destCoords));
      } else {
        setDestinationState(DEFAULT_DESTINATION);
        dispatch(setDestination(DEFAULT_DESTINATION));
      }
    } else {
      setDestinationState(DEFAULT_DESTINATION);
      dispatch(setDestination(DEFAULT_DESTINATION));
    }

    // Cleanup on unmount
    return () => {
      // Optionally clear map state
    };
  }, [pickupLocation, destinationLocation, dispatch]);

  if (!pickup || !destination) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-slate-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={API_KEY}
      libraries={["routes"]}
    >
      <RouteCalculator 
        pickup={pickup} 
        destination={destination}
        onRouteCalculated={onRouteCalculated}
      />

      <div>
        <Map
          defaultCenter={pickup}
          defaultZoom={14}
          style={{
            width: "100%",
            height: height,
          }}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {/* Pickup Marker with P label */}
          <Marker
            position={pickup}
            title="Pickup Location"
            label={showLabels ? {
              text: "P",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: "bold"
            } : undefined}
          />

          {/* Destination Marker with D label */}
          <Marker
            position={destination}
            title="Destination"
            label={showLabels ? {
              text: "D",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: "bold"
            } : undefined}
          />

          {route && route.length > 1 && (
            <Polyline
              path={route}
              strokeColor="#2563EB"
              strokeOpacity={0.9}
              strokeWeight={4}
              options={{
                strokeColor: "#2563EB",
                strokeOpacity: 0.9,
                strokeWeight: 4,
              }}
            />
          )}
        </Map>

        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          {loading && (
            <div className="flex items-center gap-2 text-slate-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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
                  {distance || "Calculating..."}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Estimated Duration</p>
                <p className="text-lg font-semibold text-slate-900">
                  {duration || "Calculating..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </APIProvider>
  );
}

export default DeliveryMap;