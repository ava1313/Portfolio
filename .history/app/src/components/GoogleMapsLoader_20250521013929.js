// src/components/GoogleMapsLoader.js
import React, { createContext, useContext } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];

const GoogleMapsContext = createContext();

export function GoogleMapsProvider({ children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // Use .env
    libraries,
    version: "weekly",
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
