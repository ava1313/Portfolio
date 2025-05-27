import React, { useEffect, useState, useRef, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import categories from "../data/categories";

const flattenCategories = () =>
  categories.flatMap((cat) => [cat.name, ...(cat.subcategories || [])]);

const businessTypes = [
  "Απλή Επιχείρηση",
  "Κυριλέ Επιχείρηση",
  "Εμπορική Επιχείρηση",
  "Νεοφυής Επιχείρηση",
  "Άλλη",
];

const libraries = ["places"];
const mapContainerStyle = {
  width: "100%",
  height: "80vh",
  marginTop: 20,
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

export default function BusinessesMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const navigate = useNavigate();

  // Main search bar states
  const [businesses, setBusinesses] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [businessType, setBusinessType] = useState("");
  const autocompleteRef = useRef(null);

  // Map state
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({ lat: 37.9838, lng: 23.7275 }); // Default: Athens
  const [userPosition, setUserPosition] = useState(null);

  // Category dropdown logic
  const allCategories = flattenCategories();
  const filteredCategories =
    categoryInput.trim() === ""
      ? []
      : allCategories.filter((cat) =>
          cat.toLowerCase().includes(categoryInput.toLowerCase())
        );

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
    }
    fetchBusinesses();
  }, []);

  // Filtering logic
  const filteredBusinesses = businesses.filter((b) => {
    let match = true;
    if (selectedCategory && b.businessCategory) {
      match =
        match &&
        b.businessCategory.toLowerCase().includes(selectedCategory.toLowerCase());
    }
    if (locationInput && b.businessLocation) {
      match =
        match &&
        b.businessLocation.toLowerCase().includes(locationInput.toLowerCase());
    }
    if (businessType && b.businessType) {
      match =
        match &&
        b.businessType.toLowerCase().includes(businessType.toLowerCase());
    }
    return match;
  });

  // Google Maps autocomplete
  const onLoad = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      const address = place.formatted_address || place.name || "";
      setLocationInput(address);
    }
  };

  // Center map to user location
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

        {/* Mainpage-style Search Bar */}
        <div
          className="actions"
          style={{
            marginBottom: 18,
            gap: 16,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {/* Category input */}
          <div className="input-group" style={{ minWidth: 160 }}>
            <input
              type="text"
              aria-label="Αναζήτηση κατηγορίας"
              placeholder="Κατηγορία"
              value={categoryInput}
              onChange={(e) => {
                setCategoryInput(e.target.value);
                setSelectedCategory(""); // clear selection on typing
              }}
              autoComplete="off"
            />
            {categoryInput && filteredCategories.length > 0 && (
              <ul className="category-dropdown">
                {filteredCategories.map((cat, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCategoryInput(cat);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {cat}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Location input */}
          <div className="input-group" style={{ minWidth: 160 }}>
            {isLoaded ? (
              <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                <input
                  type="text"
                  placeholder="Τοποθεσία"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  aria-label="Τοποθεσία"
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                placeholder="Τοποθεσία"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                aria-label="Τοποθεσία"
              />
            )}
          </div>
          {/* Business type dropdown */}
          <div className="input-group" style={{ minWidth: 160 }}>
            <select
              aria-label="Φίλτρο τύπου επιχείρησης"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            >
              <option value="">Επιλέξτε τύπο επιχείρησης</option>
              {businessTypes.map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          {/* Center on user */}
          <button
            onClick={centerOnUser}
            style={{
              padding: "8px 16px",
              fontSize: 16,
              cursor: "pointer",
              borderRadius: 8,
              border: "none",
              fontWeight: 600,
              transition: "background-color 0.3s ease",
              userSelect: "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              backgroundColor: "#191919",
              color: "#fff",
            }}
          >
            Η τοποθεσία μου
          </button>
        </div>

        {/* Map container */}
        <div style={mapContainerStyle} id="map">
          <MapComponent
            businesses={filteredBusinesses}
            center={center}
            onLoad={setMap}
            map={map}
            userPosition={userPosition}
            navigate={navigate}
          />
        </div>
      </div>
    </>
  );
}

// === MapComponent: All logic as you had it (unchanged) ===
function MapComponent({ businesses, center, onLoad, map, userPosition, navigate }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // Throttle requests to avoid hitting Google API limits
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    // Clear existing markers and info windows
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    const geocoder = new window.google.maps.Geocoder();
    const placesService = new window.google.maps.places.PlacesService(mapRef.current);

    // Helper for star rating HTML
    const getStarsHTML = (rating) => {
      if (!rating)
        return "<div style='color:#999;font-size:14px;'>No rating</div>";
      const fullStars = Math.floor(rating);
      const halfStar = rating - fullStars >= 0.5;
      let html = '<div style="display:flex;gap:2px;">';
      const fullStarSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#FFC107"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
      const emptyStarSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFC107" stroke-width="2" stroke-linejoin="round"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
      for (let i = 0; i < fullStars; i++) html += fullStarSVG;
      if (halfStar) html += emptyStarSVG;
      for (let i = fullStars + (halfStar ? 1 : 0); i < 5; i++) html += emptyStarSVG;
      html += "</div>";
      return html;
    };

    const createMarker = (biz, position, rating) => {
      const marker = new window.google.maps.Marker({
        position,
        map: mapRef.current,
        title: biz.businessName,
      });

      const contentDiv = document.createElement("div");
      contentDiv.style.display = "flex";
      contentDiv.style.alignItems = "center";
      contentDiv.style.gap = "12px";
      contentDiv.style.minWidth = "220px";
      contentDiv.style.fontFamily =
        "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

      if (biz.businessLogo) {
        const img = document.createElement("img");
        img.src = biz.businessLogo;
        img.alt = `${biz.businessName} logo`;
        img.style.width = "48px";
        img.style.height = "48px";
        img.style.objectFit = "contain";
        img.style.borderRadius = "8px";
        img.onerror = () => (img.style.display = "none");
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
      starsEl.style.marginTop = "4px";
      starsEl.innerHTML = getStarsHTML(rating);
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

      contentDiv.style.cursor = "pointer";
      contentDiv.title = "Προβολή της σελίδας της επιχείρησης";
      contentDiv.onclick = () => navigate(`/business/${biz.id}`);

      markersRef.current.push(marker);
    };

    async function processBusiness(biz) {
      try {
        // Geocode the address
        const geocodeResult = await new Promise((resolve, reject) =>
          geocoder.geocode(
            { address: biz.businessLocation },
            (results, status) => {
              if (status === "OK" && results[0])
                resolve(results[0].geometry.location);
              else reject(status);
            }
          )
        );

        // Get rating by placeId if available or by findPlaceFromQuery
        let rating = null;

        if (biz.placeId) {
          rating = await new Promise((resolve) =>
            placesService.getDetails(
              { placeId: biz.placeId, fields: ["rating"] },
              (place, status) => {
                if (
                  status === window.google.maps.places.PlacesServiceStatus.OK
                ) {
                  resolve(place.rating);
                } else {
                  resolve(null);
                }
              }
            )
          );
        } else {
          const queryStr = `${biz.businessName} ${biz.businessLocation}`;
          rating = await new Promise((resolve) =>
            placesService.findPlaceFromQuery(
              { query: queryStr, fields: ["rating"] },
              (results, status) => {
                if (
                  status === window.google.maps.places.PlacesServiceStatus.OK &&
                  results &&
                  results.length > 0
                ) {
                  resolve(results[0].rating);
                } else {
                  resolve(null);
                }
              }
            )
          );
        }

        createMarker(biz, geocodeResult, rating);

        // Small delay between calls to avoid quota issues
        await delay(300);
      } catch (e) {
        console.warn("Failed to process business:", biz.businessName, e);
      }
    }

    async function loadMarkers() {
      for (const biz of businesses) {
        await processBusiness(biz);
      }

      // Add user location marker if available
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
    }

    loadMarkers();

    // Cleanup markers on unmount or businesses change
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
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
