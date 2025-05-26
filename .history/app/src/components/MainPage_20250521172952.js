import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import categories from "../data/categories";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
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
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [businessType, setBusinessType] = useState("");
  const allCategories = flattenCategories();

  const autocompleteRef = useRef(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

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
    if (category) params.append("category", category);
    if (location) params.append("location", location);
    if (businessType) params.append("keyword", businessType);
    navigate(`/results?${params.toString()}`);
  };

  return (
    <>
      {/* User icon */}
      <div
        className="user-icon"
        role="button"
        tabIndex={0}
        onClick={() => navigate("/dashboard")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
        }}
        style={{ cursor: "pointer" }}
        aria-label="User profile icon"
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

      {/* Favorites icon */}
      <div
        className="favorites-icon"
        role="button"
        tabIndex={0}
        onClick={() => navigate("/favorites")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/favorites");
        }}
        style={{ cursor: "pointer", position: "absolute", top: 16, right: 16 }}
        aria-label="Favorites"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="black"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="54"
          height="54"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h1.87C14.46 4.99 15.96 4 17.5 4 20 4 22 6 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z" />
        </svg>
      </div>

      <header>
        <img src="/logo.png" alt="freedome logo" className="logo" />
      </header>

      <main>
        <p className="subtitle">Κάνε την καλύτερη επιλογή για εσένα</p>

        <div className="actions" style={{ gap: 20, flexWrap: "wrap" }}>
          {/* Category dropdown */}
          <div style={{ flex: "1 1 200px" }}>
            <select
              aria-label="Αναζήτηση κατηγορίας"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
              <option value="">Επιλέξτε κατηγορία</option>
              {allCategories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
