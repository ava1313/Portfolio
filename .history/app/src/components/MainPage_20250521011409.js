// src/components/MainPage.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import categoriesData from "../data/categories";
import "./style.css";

const libraries = ["places"];
const defaultCenter = { lat: 37.9838, lng: 23.7275 }; // Athens default

const flattenCategories = () =>
  categoriesData.flatMap(cat => [cat.name, ...cat.subcategories]);

export default function MainPage() {
  const navigate = useNavigate();

  // Carousel state
  const [slideIndex, setSlideIndex] = useState(0);
  const imagesCount = 10;
  const visibleImages = 4;
  const imageWidth = 300;
  const maxSlideIndex = imagesCount - visibleImages;

  // Search UI states
  const [showSearch, setShowSearch] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // Google Places autocomplete
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCRtwSDCjGfyulFxOGi4cKR3IQf3i-MTHU",
    libraries,
  });
  const autocompleteRef = useRef(null);

  // Search filters
  const [categoryInput, setCategoryInput] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [location, setLocation] = useState(null); // {lat, lng, address}
  const [keywordInput, setKeywordInput] = useState("");
  const [results, setResults] = useState([]);

  const allCategories = flattenCategories();

  // Category autocomplete filtering
  useEffect(() => {
    if (categoryInput.length > 0) {
      const filtered = allCategories
        .filter(cat => cat.toLowerCase().includes(categoryInput.toLowerCase()))
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

  // Google Autocomplete load and change handlers
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

  // Carousel control functions
  const nextSlide = () => {
    setSlideIndex((prev) => (prev < maxSlideIndex ? prev + 1 : prev));
  };
  const prevSlide = () => {
    setSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  // Search button handler
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

    // TODO: Add geolocation 20km radius filtering here with geofirestore or similar

    const querySnapshot = await getDocs(q);

    const resultsData = [];
    querySnapshot.forEach(doc => {
      resultsData.push({ id: doc.id, ...doc.data() });
    });

    setResults(resultsData);
  };

  // Show/hide search UI handlers (toggle independently or together)
  const toggleSearch = () => setShowSearch(s => !s);
  const toggleLocation = () => setShowLocation(s => !s);
  const toggleFilter = () => setShowFilter(s => !s);

  return (
    <>
      {/* User icon */}
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
          <button onClick={toggleSearch}>Αναζήτηση</button>
          <button onClick={toggleLocation}>Τοποθεσία</button>
          <button onClick={toggleFilter}>Φίλτρο</button>
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

        {/* Carousel */}
        <div className="carousel-border">
          <div className="carousel-container">
            <button
              className="carousel-btn left"
              aria-label="Previous"
              onClick={prevSlide}
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

            <button
              className="carousel-btn right"
              aria-label="Next"
              onClick={nextSlide}
            >
              &#8594;
            </button>
          </div>
        </div>

        {/* Search filters UI */}
        {(showSearch || showLocation || showFilter) && (
          <div
            style={{
              marginTop: 30,
              border: "1px solid #ccc",
              padding: 20,
              borderRadius: 12,
              backgroundColor: "#f9f9f9",
              maxWidth: 600,
            }}
          >
            {/* Category filter */}
            {showSearch && (
              <label style={{ display: "block", marginBottom: 12 }}>
                Κατηγορία:
                <input
                  type="text"
                  value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value)}
                  placeholder="Ξεκινήστε να πληκτρολογείτε κατηγορία"
                  autoComplete="off"
                  style={{ width: "100%", padding: 8, fontSize: 14 }}
                />
                {categorySuggestions.length > 0 && (
                  <ul style={{
                    listStyle: "none",
                    margin: 0,
                    padding: "5px",
                    border: "1px solid #ccc",
                    maxHeight: 140,
                    overflowY: "auto",
                    cursor: "pointer",
                    backgroundColor: "white",
                    borderRadius: 4,
                  }}>
                    {categorySuggestions.map((cat, idx) => (
                      <li
                        key={idx}
                        onClick={() => selectCategory(cat)}
                        style={{ padding: "6px 10px" }}
                      >
                        {cat}
                      </li>
                    ))}
                  </ul>
                )}
              </label>
            )}

            {/* Location filter */}
            {showLocation && (
              <label style={{ display: "block", marginBottom: 12 }}>
                Τοποθεσία:
                {isLoaded ? (
                  <Autocomplete
                    onLoad={onLoadAutocomplete}
                    onPlaceChanged={onPlaceChanged}
                  >
                    <input
                      type="text"
                      placeholder="Ξεκινήστε να πληκτρολογείτε τοποθεσία"
                      style={{ width: "100%", padding: 8, fontSize: 14 }}
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    placeholder="Ξεκινήστε να πληκτρολογείτε τοποθεσία"
                    disabled
                    style={{ width: "100%", padding: 8, fontSize: 14 }}
                  />
                )}
              </label>
            )}

            {/* Keywords filter */}
            {showFilter && (
              <label style={{ display: "block", marginBottom: 12 }}>
                Λέξεις-κλειδιά (comma separated):
                <input
                  type="text"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  placeholder="π.χ. eco, vegan, organic"
                  style={{ width: "100%", padding: 8, fontSize: 14 }}
                />
              </label>
            )}

            <button
              onClick={searchBusinesses}
              style={{
                backgroundColor: "#4285F4",
                color: "white",
                padding: "12px 24px",
                borderRadius: 24,
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                width: "100%",
                marginTop: 10,
              }}
            >
              Αναζήτηση
            </button>

            {/* Results */}
            <div style={{ marginTop: 24, maxHeight: 300, overflowY: "auto" }}>
              {results.length === 0 ? (
                <p>Δεν βρέθηκαν αποτελέσματα.</p>
              ) : (
                results.map((biz) => (
                  <div key={biz.id} style={{ borderBottom: "1px solid #ccc", padding: 12 }}>
                    <h3>{biz.businessName || "Unnamed Business"}</h3>
                    <p>Κατηγορία: {biz.businessCategory}</p>
                    <p>Τοποθεσία: {biz.businessLocation}</p>
                    <p>Λέξεις-κλειδιά: {biz.keywords?.join(", ") || "None"}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
