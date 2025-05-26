// src/components/GoogleMapsLoader.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const GoogleMapsContext = createContext();

const loaderOptions = {
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,  // put your key in .env file
  version: "weekly",
  libraries: ["places"],
};

export function GoogleMapsProvider({ children }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const loader = new Loader(loaderOptions);
    loader.load()
      .then(() => setIsLoaded(true))
      .catch(err => setLoadError(err));
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}
