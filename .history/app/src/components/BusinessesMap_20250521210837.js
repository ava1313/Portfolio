import React, { useEffect, useState, useRef, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "./Navbar";
import { useGoogleMaps } from "./GoogleMapsLoader";
import { useNavigate } from "react-router-dom";

const mapContainerStyle = {
  width: "100%",
  height: "80vh",
  marginTop: 20,
  borderRadius: 16,
  overflow: "hidden", // ensures rounded corners clipping
};

export default function BusinessesMap() {
  const { isLoaded } = useGoogleMaps();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({ lat: 37.9838, lng: 23.7275 }); // Athens default
  const [userPosition, setUserPosition] = useState(null);

  // Fetch businesses from Firestore
  useEffect(() => {
    async function fetchBusinesses() {
      const snapshot = await getDocs(collection(db, "users"));
      const bizs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === "business" && data.profile) {
          bizs.push({
            id: doc.id,
            ...data.profile,
          });
        }
      });
      setBusinesses(bizs);
      setFilteredBusinesses(bizs);
    }
    fetchBusinesses();
  }, []);

  // Filter businesses by category
  useEffect(() => {
    if (!filterCategory) {
      setFilteredBusinesses(businesses);
      return;
    }
    setFilteredBusinesses(
      businesses.filter(
        (b) =>
          b.businessCategory &&
          b.businessCategory.toLowerCase() === filterCategory.toLowerCase()
      )
    );
  }, [filterCategory, businesses]);

  // On map load
  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Center map on user location and show blue marker
  const centerOnUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(pos);
        setUserPosition(pos);
        if (map) {
          map.panTo(pos);
          map.setZoom(13);
        }
      },
      () => {
        alert("Unable to retrieve your location.");
      }
    );
  };

  if (!isLoaded) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: 80 }}>Loading map...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: "40px auto", padding: "0 16px" }}>
        <h2 style={{ textAlign: "center", marginBottom: 16 }}>
          Επιχειρήσεις στον Χάρτη
        </h2>

        {/* Filter */}
        <div style={{ marginBottom: 12, textAlign: "center" }}>
          <label htmlFor="categoryFilter" style={{ marginRight: 8 }}>
            Φιλτράρισμα κατά κατηγορία:
          </label>
          <select
            id="categoryFilter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: 6, fontSize: 16 }}
          >
            <option value="">Όλες</option>
            {[...new Set(businesses.map((b) => b.businessCategory))].map(
              (cat) =>
                cat && (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                )
            )}
          </select>
          <button
            onClick={centerOnUser}
            style={{
              marginLeft: 16,
              padding: "6px 12px",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Η τοποθεσία μου
          </button>
        </div>

        {/* Map */}
        <div style={mapContainerStyle} id="map">
          <MapComponent
            businesses={filteredBusinesses}
            center={center}
            onLoad={onLoad}
            map={map}
            userPosition={userPosition}
            navigate={navigate}
          />
        </div>
      </div>
    </>
  );
}

// MapComponent implementation with markers, clustering, user position marker, info windows and click confirmation

function MapComponent({ businesses, center, onLoad, map, userPosition, navigate }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    // Clear previous markers and info windows
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    // Create markers for businesses
    businesses.forEach((biz) => {
      if (!biz.businessLocation) return;
      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address: biz.businessLocation }, (results, status) => {
        if (status === "OK" && results[0]) {
          const position = results[0].geometry.location;

          const marker = new window.google.maps.Marker({
            position,
            map: mapRef.current,
            title: biz.businessName,
          });

          // InfoWindow for showing business name on hover
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div style="font-weight:bold;">${biz.businessName}</div>`,
          });

          marker.addListener("mouseover", () => {
            infoWindow.open(mapRef.current, marker);
          });

          marker.addListener("mouseout", () => {
            infoWindow.close();
          });

          marker.addListener("click", () => {
            const goToBiz = window.confirm(
              `Θέλετε να δείτε την επιχείρηση "${biz.businessName}";`
            );
            if (goToBiz) navigate(`/business/${biz.id}`);
          });

          markersRef.current.push(marker);
        }
      });
    });

    // Add user position blue marker if available
    if (userPosition) {
      const userMarker = new window.google.maps.Marker({
        position: userPosition,
        map: mapRef.current,
        title: "Η Τοποθεσία Μου",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#fff",
        },
      });
      markersRef.current.push(userMarker);
    }
  }, [businesses, userPosition]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(center);
    }
  }, [center]);

  useEffect(() => {
    if (!map && window.google) {
      mapRef.current = new window.google.maps.Map(document.getElementById("map"), {
        zoom: 11,
        center,
        mapTypeControl: false,
        streetViewControl: false,
      });
      onLoad(mapRef.current);
    }
  }, [map, onLoad, center]);

  return null;
}
