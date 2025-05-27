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
  // Add a blur to hide dropdown (optional)
  setTimeout(() => {
    document.activeElement.blur();
  }, 0);
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

        <div className="actions">
  {/* Category */}
<div className="input-group">
  <input
    type="text"
    aria-label="Αναζήτηση κατηγορίας"
    placeholder="Κατηγορία"
    value={categoryInput}
    onChange={(e) => {
      setCategoryInput(e.target.value);
      setSelectedCategory(""); // Clear selection on typing
    }}
    autoComplete="off"
  />
  {categoryInput &&
    categoryInput !== selectedCategory &&
    filteredCategories.length > 0 && (
      <ul className="category-dropdown">
        {filteredCategories.map((cat, idx) => (
          <li
            key={idx}
            onClick={() => {
              setSelectedCategory(cat);
              setCategoryInput(cat); // Set as input value
            }}
            onMouseDown={e => e.preventDefault()} // Prevent blur on click
          >
            {cat}
          </li>
        ))}
      </ul>
    )}
</div>


  {/* Location */}
  <div className="input-group">
    {isLoaded ? (
      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
        <input
          type="text"
          placeholder="Τοποθεσία"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Τοποθεσία"
        />
      </Autocomplete>
    ) : (
      <input
        type="text"
        placeholder="Τοποθεσία"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        aria-label="Τοποθεσία"
      />
    )}
  </div>

  {/* Business type */}
  <div className="input-group">
    <select
      aria-label="Φίλτρο"
      value={businessType}
      onChange={(e) => setBusinessType(e.target.value)}
    >
      <option value="">Φίλτρο	</option>
      {businessTypes.map((type, idx) => (
        <option key={idx} value={type}>{type}</option>
      ))}
    </select>
  </div>

  {/* Search icon */}
  <button className="search-icon" aria-label="Αναζήτηση" onClick={onSearch}>
    <svg viewBox="0 0 30 30" width="22" height="22" aria-hidden="true">
      <circle cx="14" cy="14" r="10" stroke="black" strokeWidth="2.5" fill="none" />
      <line x1="26" y1="26" x2="20" y2="20" stroke="black" strokeWidth="2.5" />
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
