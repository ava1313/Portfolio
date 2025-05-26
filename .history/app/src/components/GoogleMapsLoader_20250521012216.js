// src/components/GoogleMapsLoader.js
import React, { createContext, useContext } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];
const GOOGLE_API_KEY = "AIzaSyCRtwSDjGfyulFxOGi4cKR3IQf3i-MTHU";

const GoogleMapsContext = createContext(null);

export function GoogleMapsProvider({ children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    libraries,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}
