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
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const buttonBaseStyle = {
  padding: "8px 16px",
  fontSize: 16,
  cursor: "pointer",
  borderRadius: 8,
  border: "none",
  fontWeight: 600,
  transition: "background-color 0.3s ease",
  userSelect: "none",
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
};

const primaryButtonStyle = {
  ...buttonBaseStyle,
  backgroundColor: "#191919",
  color: "#fff",
};

const secondaryButtonStyle = {
  ...buttonBaseStyle,
  backgroundColor: "#f0f0f0",
  color: "#191919",
};

const selectStyle = {
  padding: "8px 12px",
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #ccc",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  cursor: "pointer",
  userSelect: "none",
  outline: "none",
  minWidth: 140,
};

export default function BusinessesMap() {
  const { isLoaded } = useGoogleMaps();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({ lat: 37.9838, lng: 23.7275 });
  const [userPosition, setUserPosition] = useState(null);

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

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

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
        <div style={{ textAlign: "center", marginTop: 80, fontSize: 18 }}>
          Loading map...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div
        style={{
          maxWidth: 1000,
          margin: "40px auto",
          padding: "0 16px",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: "#222",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 24,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: "0.05em",
          }}
        >
          Επιχειρήσεις στον Χάρτη
        </h2>

        {/* Filter controls */}
        <div
          style={{
            marginBottom: 20,
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <label
            htmlFor="categoryFilter"
            style={{
              fontSize: 16,
              fontWeight: 600,
              userSelect: "none",
            }}
          >
            Φιλτράρισμα κατά κατηγορία:
          </label>
          <select
            id="categoryFilter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={selectStyle}
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
          <button onClick={centerOnUser} style={primaryButtonStyle}>
            Η τοποθεσία μου
          </button>
        </div>

        {/* Map container */}
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

function MapComponent({ businesses, center, onLoad, map, userPosition, navigate }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    // Clear old markers & info windows
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    // Helper to generate star rating HTML (max 5 stars)
    const getStarRatingHTML = (rating) => {
      if (!rating) return "<div style='color:#999;font-size:14px;'>No rating</div>";
      const fullStars = Math.floor(rating);
      const halfStar = rating - fullStars >= 0.5;
      let html = "<div style='color:#fbc02d;font-size:16px;'>";
      for (let i = 0; i < fullStars; i++) {
        html += "&#9733;"; // solid star ★
      }
      if (halfStar) html += "&#9734;"; // hollow star ☆ for half star (simple approx)
      const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
      for (let i = 0; i < emptyStars; i++) {
        html += "&#9734;"; // hollow star ☆
      }
      html += "</div>";
      return html;
    };

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

          // Build custom info window content
          const logoUrl = biz.logoUrl || biz.profilePicture || ""; // adjust field names to your data
          const starRatingHTML = getStarRatingHTML(biz.googleRating); // biz.googleRating assumed

          const contentDiv = document.createElement("div");
          contentDiv.style.display = "flex";
          contentDiv.style.alignItems = "center";
          contentDiv.style.gap = "12px";
          contentDiv.style.minWidth = "220px";
          contentDiv.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

          if (logoUrl) {
            const img = document.createElement("img");
            img.src = logoUrl;
            img.alt = `${biz.businessName} logo`;
            img.style.width = "48px";
            img.style.height = "48px";
            img.style.objectFit = "contain";
            img.style.borderRadius = "8px";
            img.onerror = () => {
              img.style.display = "none"; // hide broken image
            };
            contentDiv.appendChild(img);
          }

          const textDiv = document.createElement("div");
          textDiv.style.flex = "1";

          const nameEl = document.createElement("div");
          nameEl.textContent = biz.businessName;
          nameEl.style.fontWeight = "700";
          nameEl.style.fontSize = "16px";
          nameEl.style.marginBottom = "4px";
          textDiv.appendChild(nameEl);

          const starsEl = document.createElement("div");
          starsEl.innerHTML = starRatingHTML;
          textDiv.appendChild(starsEl);

          contentDiv.appendChild(textDiv);

          const infoWindow = new window.google.maps.InfoWindow({
            content: contentDiv,
          });

          marker.addListener("click", () => {
            if (infoWindowRef.current) infoWindowRef.current.close();
            infoWindow.open(mapRef.current, marker);
            infoWindowRef.current = infoWindow;
          });

          // Optional: click on infoWindow content navigates to business page
          contentDiv.style.cursor = "pointer";
          contentDiv.title = "Προβολή της σελίδας της επιχείρησης";
          contentDiv.onclick = () => navigate(`/business/${biz.id}`);

          markersRef.current.push(marker);
        }
      });
    });

    // User location blue marker (same as before)
    if (userPosition) {
      const userMarker = new window.google.maps.Marker({
        position: userPosition,
        map: mapRef.current,
        title: "Η Τοποθεσία Μου",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4285F4",
          fillOpacity: 0.9,
          strokeWeight: 3,
          strokeColor: "#fff",
        },
      });
      markersRef.current.push(userMarker);
    }
  }, [businesses, userPosition, navigate]);

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
