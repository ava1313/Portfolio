import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar"; // your Navbar component
import categories from "../data/categories"; // your categories data
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase"; // import your Firestore instance
import "./style.css";

const libraries = ["places"];
const imagesCount = 10;
const visibleImages = 4;
const imageWidth = 300;
const maxSlideIndex = imagesCount - visibleImages;

const businessTypes = [
  "Απλή Επιχείρηση",
  "Κυριλέ Επιχείρηση",
  "Εμπορική Επιχείρηση",
  "Νεοφυής Επιχείρηση",
  "Άλλη",
];

const flattenCategories = () =>
  categories.flatMap((cat) => [cat.name, ...cat.subcategories]);

export default function MainPage() {
  const navigate = useNavigate();
  const [slideIndex, setSlideIndex] = useState(0);

  // Category search states
  const allCategories = flattenCategories();
  const [categoryInput, setCategoryInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const filteredCategories = allCategories.filter((cat) =>
    cat.toLowerCase().includes(categoryInput.toLowerCase())
  );

  // Location and business type states
  const [location, setLocation] = useState("");
  const [businessType, setBusinessType] = useState("");

  // Firestore counts
  const [businessCount, setBusinessCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);

  const autocompleteRef = useRef(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Fetch counts from Firestore on mount
  useEffect(() => {
    async function fetchCounts() {
      try {
        // Count businesses (role === "business")
        const businessQuery = query(
          collection(db, "users"),
          where("role", "==", "business")
        );
        const businessSnapshot = await getDocs(businessQuery);
        setBusinessCount(businessSnapshot.size);

        // Count clients (role === "client")
        const clientQuery = query(
          collection(db, "users"),
          where("role", "==", "client")
        );
        const clientSnapshot = await getDocs(clientQuery);
        setClientCount(clientSnapshot.size);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    }
    fetchCounts();
  }, []);

  const onLoad = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      const address = place.formatted_address || place.name || "";
      setLocation(address);
    }
  };

  const onSearch = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.append("category", selectedCategory);
    if (location) params.append("location", location);
    if (businessType) params.append("keyword", businessType);
    navigate(`/results?${params.toString()}`);
  };

  // When user clicks category from dropdown
  const onCategoryChange = (value) => {
    setSelectedCategory(value);
    setCategoryInput(value);
  };

  return (
    <>
      <Navbar />

      <main>
        {/* Show counts */}
        <p className="trust-counts">
  Μας εμπιστεύονται{" "}
  <strong>{businessCount.toLocaleString()}</strong> επιχειρηματίες και{" "}
  <strong>{clientCount.toLocaleString()}</strong> πελάτες
</p>

        <p className="subtitle">Κάνε την καλύτερη επιλογή για εσένα</p>

        <div className="actions" style={{ gap: 20, flexWrap: "wrap" }}>
          {/* Searchable Category Input */}
          <div style={{ flex: "1 1 200px", position: "relative" }}>
            <input
              type="text"
              aria-label="Αναζήτηση κατηγορίας"
              placeholder="Επιλέξτε κατηγορία ή πληκτρολογήστε..."
              value={categoryInput}
              onChange={(e) => {
                setCategoryInput(e.target.value);
                setSelectedCategory(""); // clear selection on typing
              }}
              style={{
                padding: "14px 20px",
                borderRadius: "40px",
                border: "2px solid black",
                width: "100%",
                fontSize: 18,
                cursor: "text",
                backgroundColor: "white",
              }}
              autoComplete="off"
            />

            {/* Dropdown with filtered categories */}
            {categoryInput && filteredCategories.length > 0 && (
              <ul
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  maxHeight: 150,
                  overflowY: "auto",
                  backgroundColor: "white",
                  border: "2px solid black",
                  borderTop: "none",
                  borderRadius: "0 0 40px 40px",
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  zIndex: 1000,
                }}
              >
                {filteredCategories.map((cat, idx) => (
                  <li
                    key={idx}
                    onClick={() => onCategoryChange(cat)}
                    style={{
                      padding: "8px 20px",
                      cursor: "pointer",
                      borderBottom: "1px solid #ddd",
                    }}
                    onMouseDown={(e) => e.preventDefault()} // prevent input blur on click
                  >
                    {cat}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Location input with Google autocomplete */}
          <div style={{ flex: "1 1 200px" }}>
            {isLoaded ? (
              <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                <input
                  type="text"
                  placeholder="Τοποθεσία"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  aria-label="Τοποθεσία"
                  style={{
                    padding: "14px 20px",
                    borderRadius: "40px",
                    border: "2px solid black",
                    width: "100%",
                    fontSize: 18,
                  }}
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                placeholder="Τοποθεσία"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="Τοποθεσία"
                style={{
                  padding: "14px 20px",
                  borderRadius: "40px",
                  border: "2px solid black",
                  width: "100%",
                  fontSize: 18,
                }}
              />
            )}
          </div>

          {/* Business type dropdown (filter) */}
          <div style={{ flex: "1 1 200px" }}>
            <select
              aria-label="Φίλτρο τύπου επιχείρησης"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              style={{
                padding: "14px 20px",
                borderRadius: "40px",
                border: "2px solid black",
                width: "100%",
                fontSize: 18,
                cursor: "pointer",
                backgroundColor: "white",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
              }}
            >
              <option value="">Επιλέξτε τύπο επιχείρησης</option>
              {businessTypes.map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Search icon button */}
          <button
            className="search-icon"
            aria-label="Αναζήτηση"
            onClick={onSearch}
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              border: "2px solid black",
              backgroundColor: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            <svg viewBox="0 0 30 30" width="28" height="28" aria-hidden="true">
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

        {/* Carousel below (optional) */}
        <div className="carousel-border" style={{ marginTop: 40 }}>
          <div className="carousel-container">
            <button
              className="carousel-btn left"
              aria-label="Previous"
              onClick={() => setSlideIndex((i) => (i > 0 ? i - 1 : i))}
            >
              &#8592;
            </button>

            <div
              className="carousel"
              style={{ transform: `translateX(-${slideIndex * imageWidth}px)` }}
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
              onClick={() =>
                setSlideIndex((i) => (i < maxSlideIndex ? i + 1 : i))
              }
            >
              &#8594;
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
