import {
  APIProvider,
  Map,
  Marker,
  Polyline,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

import { useEffect } from "react";
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

function RouteCalculator() {
  const dispatch = useDispatch();

  const { pickup, destination } = useSelector(
    (state) => state.map
  );

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
  ]);

  return null;
}

function DeliveryMap() {
  const dispatch = useDispatch();

  const {
    pickup,
    destination,
    route,
    distance,
    duration,
    loading,
    error,
  } = useSelector((state) => state.map);

  useEffect(() => {
    if (!pickup) {
      dispatch(setPickup(DEFAULT_PICKUP));
    }

    if (!destination) {
      dispatch(
        setDestination(DEFAULT_DESTINATION)
      );
    }
  }, [
    dispatch,
    pickup,
    destination,
  ]);

  if (!pickup || !destination) {
    return <p>Loading map...</p>;
  }

  return (
    <APIProvider
      apiKey={API_KEY}
      libraries={["routes"]}
    >
      <RouteCalculator />

      <div>
        <Map
          defaultCenter={pickup}
          defaultZoom={14}
          style={{
            width: "100%",
            height: "500px",
          }}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <Marker
            position={pickup}
            title="Pickup Location"
          />

          <Marker
            position={destination}
            title="Destination"
          />

          {route.length > 1 && (
            <Polyline
              path={route}
              strokeColor="#00CCBC"
              strokeOpacity={0.9}
              strokeWeight={5}
            />
          )}
        </Map>

        <div>
          {loading && (
            <p>Calculating route...</p>
          )}

          {error && (
            <p>
              Route error: {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <p>
                <strong>Distance:</strong>{" "}
                {distance || "Calculating..."}
              </p>

              <p>
                <strong>Duration:</strong>{" "}
                {duration || "Calculating..."}
              </p>
            </>
          )}
        </div>
      </div>
    </APIProvider>
  );
}

export default DeliveryMap;
