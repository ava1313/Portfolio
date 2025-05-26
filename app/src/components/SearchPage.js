// src/components/SearchPage.js
import React, { useState, useEffect, useRef } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import categoriesData from "../data/categories";

const libraries = ["places"];
const defaultCenter = { lat: 37.9838, lng: 23.7275 }; // Athens default

const flattenCategories = () =>
  categoriesData.flatMap(cat => [cat.name, ...cat.subcategories]);

export default function SearchPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCRtwSDjGfyulFxOGi4cKR3IQf3i-MTHU",
    libraries,
  });

  const [categoryInput, setCategoryInput] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [location, setLocation] = useState(null);
  const [results, setResults] = useState([]);
  const autocompleteRef = useRef(null);

  const allCategories = flattenCategories();

  // Handle Google Places autocomplete for location input
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

  // Category autocomplete filtering
  useEffect(() => {
    if (categoryInput.length > 0) {
      const filtered = allCategories.filter(cat =>
        cat.toLowerCase().includes(categoryInput.toLowerCase())
      ).slice(0, 5);
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

  // Firestore search query combining category, 20km radius, and keyword filters
  async function searchBusinesses() {
    if (!selectedCategory && !location && !keywordInput) {
      alert("Please provide at least one filter.");
      return;
    }

    // Note: Firestore does not support geo queries natively.
    // Use a library like geofirestore for geo queries.
    // This is a conceptual example combining category and keyword filters.

    let q = collection(db, "businesses");

    const filters = [];

    if (selectedCategory) {
      filters.push(where("businessCategory", "==", selectedCategory));
    }
    if (keywordInput) {
      // Assuming keywords stored as array in Firestore
      filters.push(where("keywords", "array-contains", keywordInput.toLowerCase()));
    }

    if (filters.length > 0) {
      q = query(q, ...filters);
    }

    // TODO: add geo query filtering businesses within 20 km radius of location
    // Using geofirestore, example:
    // const geoCollection = GeoFirestore.collection('businesses');
    // const geoQuery = geoCollection.near({ center: new GeoPoint(location.lat, location.lng), radius: 20 });
    // Combine geoQuery with above filters if possible

    const querySnapshot = await getDocs(q);

    const resultsData = [];
    querySnapshot.forEach(doc => {
      resultsData.push({ id: doc.id, ...doc.data() });
    });

    setResults(resultsData);
  }

  return (
    <div style={{ maxWidth: 600, margin: "20px auto", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2>Search Businesses</h2>

      {/* Category input with autocomplete */}
      <label>
        Category:
        <input
          type="text"
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value)}
          placeholder="Start typing category"
          autoComplete="off"
          style={{ width: "100%", padding: 8, fontSize: 14, marginBottom: 8 }}
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

      {/* Location input with Google Maps autocomplete */}
      <label>
        Location:
        {isLoaded ? (
          <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
            <input
              type="text"
              placeholder="Start typing location"
              style={{ width: "100%", padding: 8, fontSize: 14, marginBottom: 8 }}
            />
          </Autocomplete>
        ) : (
          <input
            type="text"
            placeholder="Start typing location"
            disabled
            style={{ width: "100%", padding: 8, fontSize: 14, marginBottom: 8 }}
          />
        )}
      </label>

      {/* Keywords input */}
      <label>
        Keywords (comma separated):
        <input
          type="text"
          value={keywordInput}
          onChange={e => setKeywordInput(e.target.value)}
          placeholder="e.g. eco, vegan, organic"
          style={{ width: "100%", padding: 8, fontSize: 14, marginBottom: 12 }}
        />
      </label>

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
        }}
      >
        Search
      </button>

      {/* Results */}
      <div style={{ marginTop: 24 }}>
        {results.length === 0 ? (
          <p>No results found.</p>
        ) : (
          results.map(biz => (
            <div key={biz.id} style={{ borderBottom: "1px solid #ccc", padding: 12 }}>
              <h3>{biz.businessName || "Unnamed Business"}</h3>
              <p>Category: {biz.businessCategory}</p>
              <p>Location: {biz.businessLocation}</p>
              <p>Keywords: {biz.keywords?.join(", ") || "None"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
