// src/components/MainPage.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleMaps } from "./GoogleMapsLoader"; // shared loader hook
import { Autocomplete } from "@react-google-maps/api";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import categoriesData from "../data/categories";
import "./style.css";

const flattenCategories = () =>
  categoriesData.flatMap((cat) => [cat.name, ...cat.subcategories]);

export default function MainPage() {
  const navigate = useNavigate();

  const [slideIndex, setSlideIndex] = useState(0);
  const imagesCount = 10;
  const visibleImages = 4;
  const imageWidth = 300;
  const maxSlideIndex = imagesCount - visibleImages;

  // Search UI states
  const [showSearch, setShowSearch] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // Google Maps
  const { isLoaded } = useGoogleMaps();
  const autocompleteRef = useRef(null);

  // Search inputs
  const [categoryInput, setCategoryInput] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [location, setLocation] = useState(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [results, setResults] = useState([]);

  const allCategories = flattenCategories();

  // Category autocomplete suggestions
  useEffect(() => {
    if (categoryInput.length > 0) {
      const filtered = allCategories
        .filter((cat) => cat.toLowerCase().includes(categoryInput.toLowerCase()))
        .slice(0, 5);
      setCategorySuggestions(filtered);
    } else {
      setCategorySuggestions([]);
    }
  }, [categoryInput, allCategories]);

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    setCategoryInput(cat);
    setCategorySuggestions([]);
  };

  const onLoadAutocomplete = (autoC) => {
    autocompleteRef.current = autoC;
  };

  const onPlaceChanged = () => {
    const auto = autocompleteRef.current;
    if (auto) {
      const place = auto.getPlace();
      if (place.geometry) {
        setLocation({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || place.name,
        });
      }
    }
  };

  // Carousel handlers
  const nextSlide = () => {
    setSlideIndex((prev) => (prev < maxSlideIndex ? prev + 1 : prev));
  };
  const prevSlide = () => {
    setSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  // Search Firestore query
  const searchBusinesses = async () => {
    if (!selectedCategory && !location && !keywordInput) {
      alert("Please provide at least one filter.");
      return;
    }

    let q = collection(db, "businesses");
    const filters = [];

    if (selectedCategory) {
      filters.push(where("businessCategory", "==", selectedCategory));
    }
    if (keywordInput) {
      filters.push(where("keywords", "array-contains", keywordInput.toLowerCase()));
    }

    if (filters.length > 0) {
      q = query(q, ...filters);
    }

    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // If location filter, apply 20km radius filter client-side for simplicity (for now)
    if (location) {
      const radiusKm = 20;
      docs = docs.filter((doc) => {
        if (!doc.profile?.businessLocationCoords) return false;
        const { lat, lng } = doc.profile.businessLocationCoords;
        const dist = haversineDistance(
          [lat, lng],
          [location.lat, location.lng]
        );
        return dist <= radiusKm;
      });
    }

    setResults(docs);
  };

  // Haversine formula to compute distance between lat/lng points in KM
  const haversineDistance = ([lat1, lon1], [lat2, lon2]) => {
    function toRad(x) {
      return (x * Math.PI) / 180;
    }

    const R = 6371; // Radius of Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <>
      {/* User icon: click redirects to dashboard */}
      <div
        className="user-icon"
        aria-label="User profile icon"
        role="button"
        tabIndex={0}
        onClick={() => navigate("/dashboard")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
        }}
        style={{ cursor: "pointer" }}
      >
        <svg
          viewBox="0 0 40 40"
          width="54"
          height="54"
          fill="none"
          stroke="black"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="20" cy="15" r="8" />
          <path d="M4 38c0-7 14-11 16-11s16 4 16 11" />
        </svg>
      </div>

      <header>
        <img src="/logo.png" alt="freedome logo" className="logo" />
      </header>

      <main>
        <p className="subtitle">Κάνε την καλύτερη επιλογή για εσένα</p>

        <div className="actions">
          <button onClick={() => setShowSearch(!showSearch)}>Αναζήτηση</button>
          <button onClick={() => setShowLocation(!showLocation)}>Τοποθεσία</button>
          <button onClick={() => setShowFilter(!showFilter)}>Φίλτρο</button>
          <button
            className="search-icon"
            aria-label="Αναζήτηση"
            onClick={searchBusinesses}
          >
            <svg viewBox="0 0 30 30" width="34" height="34" aria-hidden="true">
              <circle
                cx="14"
                cy="14"
                r="10"
                stroke="black"
                strokeWidth="2.5"
                fill="none"
              />
              <line
                x1="26"
                y1="26"
                x2="20"
                y2="20"
                stroke="black"
                strokeWidth="2.5"
              />
            </svg>
          </button>
        </div>

        {/* Search Inputs */}
        {showSearch && (
          <div style={{ marginBottom: 12 }}>
            <label>
              Κατηγορία:
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="Πληκτρολογήστε κατηγορία..."
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {flattenCategories().map((cat, idx) => (
                  <option key={idx} value={cat} />
                ))}
              </datalist>
            </label>
          </div>
        )}

        {showLocation && isLoaded && (
          <div style={{ marginBottom: 12 }}>
            <label>
              Τοποθεσία:
              <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
                <input
                  type="text"
                  placeholder="Πληκτρολογήστε τοποθεσία..."
                  style={{ width: "100%", padding: 8, fontSize: 14, borderRadius: 6, border: "1px solid #ccc" }}
                />
              </Autocomplete>
            </label>
          </div>
        )}

        {showFilter && (
          <div style={{ marginBottom: 12 }}>
            <label>
              Λέξεις Κλειδιά:
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Πληκτρολογήστε λέξεις κλειδιά..."
              />
            </label>
          </div>
        )}

        {/* Carousel */}
        <div className="carousel-border">
          <div className="carousel-container">
            {/* Prev button */}
            <button
              className="carousel-btn left"
              aria-label="Previous"
              onClick={() => setSlideIndex((i) => (i > 0 ? i - 1 : i))}
              disabled={slideIndex === 0}
            >
              &#8592;
            </button>

            <div
              className="carousel"
              style={{
                transform: `translateX(-${slideIndex * imageWidth}px)`,
              }}
            >
              {[...Array(imagesCount)].map((_, i) => (
                <img
                  key={i}
                  src={`/mainpageimages/${i + 1}.jpg`}
                  alt={`Carousel item ${i + 1}`}
                />
              ))}
            </div>

            {/* Next button */}
            <button
              className="carousel-btn right"
              aria-label="Next"
              onClick={() => setSlideIndex((i) => (i < maxSlideIndex ? i + 1 : i))}
              disabled={slideIndex === maxSlideIndex}
            >
              &#8594;
            </button>
          </div>
        </div>

        {/* Results */}
        <div style={{ marginTop: 20 }}>
          {results.length > 0 ? (
            results.map((item) => (
              <div key={item.id} style={{ borderBottom: "1px solid #ccc", padding: 8 }}>
                <h3>{item.profile.businessName || item.profile.firstName}</h3>
                <p>Category: {item.profile.businessCategory || "N/A"}</p>
                <p>Location: {item.profile.businessLocation || item.profile.location}</p>
                <p>Keywords: {item.profile.keywords || "N/A"}</p>
              </div>
            ))
          ) : (
            <p>No results</p>
          )}
        </div>
      </main>
    </>
  );
}
