// src/index.js or wherever your root is
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleMapsProvider } from "./components/GoogleMapsLoader";
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <GoogleMapsProvider>
      <App />
    </GoogleMapsProvider>
  </BrowserRouter>
);
