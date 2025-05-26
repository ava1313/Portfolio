// src/components/MainPage.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import categories from "../data/categories";
import { useGoogleMaps } from "./GoogleMapsLoader";  // use centralized context
import { Autocomplete } from "@react-google-maps/api";

const libraries = ["places"];
const imagesCount = 10;
const visibleImages = 4;
const imageWidth = 300;
const maxSlideIndex = imagesCount - visibleImages;

const flattenCategories = () =>
  categories.flatMap(cat => [cat.name, ...cat.subcategories]);

export default function MainPage() {
  const navigate = useNavigate();
  const { isLoaded, loadError } = useGoogleMaps();

  const [slideIndex, setSlideIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const allCategories = flattenCategories();

  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = allCategories
        .filter(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 5);
      setCategorySuggestions(filtered);
    } else {
      setCategorySuggestions([]);
    }
  }, [searchTerm]);

  const selectCategory = (cat) => {
    setSearchTerm(cat);
    setCategorySuggestions([]);
  };

  const nextSlide = () => {
    setSlideIndex(prev => (prev < maxSlideIndex ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setSlideIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

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
    alert(
      `Searching with:\nCategory: ${searchTerm}\nLocation: ${location}\nKeyword: ${keyword}`
    );
    // Implement actual search or navigation to results page here
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

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

        <div className="actions" style={{ gap: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <input
              type="text"
              placeholder="Αναζήτηση κατηγορίας"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Αναζήτηση κατηγορίας"
              style={{
                padding: "14px 20px",
                borderRadius: "40px",
                border: "2px solid black",
                width: "100%",
                fontSize: 18,
              }}
            />
            {categorySuggestions.length > 0 && (
              <ul
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid black",
                  borderRadius: "0 0 20px 20px",
                  maxHeight: 140,
                  overflowY: "auto",
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  zIndex: 10,
                }}
              >
                {categorySuggestions.map((cat, idx) => (
                  <li
                    key={idx}
                    onClick={() => selectCategory(cat)}
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {cat}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ flex: "1 1 200px" }}>
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
          </div>

          <input
            type="text"
            placeholder="Φίλτρο (Λέξεις κλειδιά)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            aria-label="Φίλτρο λέξεων κλειδιών"
            style={{
              padding: "14px 20px",
              borderRadius: "40px",
              border: "2px solid black",
              fontSize: 18,
              minWidth: 200,
              flex: "1 1 200px",
            }}
          />

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

        {/* Carousel code remains unchanged */}
      </main>
    </>
  );
}
