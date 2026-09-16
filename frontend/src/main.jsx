// frontend/src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { LoadScript } from "@react-google-maps/api";
import App from "./App";

import { store } from "./redux/store";
import "./index.css";

// Libraries needed across the whole app
const GOOGLE_MAPS_LIBRARIES = ['places', 'routes'];

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      {/* Load Google Maps ONCE here, at the top of the tree */}
      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={GOOGLE_MAPS_LIBRARIES}
        loadingElement={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        }
      >
        <App />
      </LoadScript>
    </Provider>
  </StrictMode>
);