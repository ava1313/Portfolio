import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {addDoc, collection, getDocs, getDoc, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import Navbar from "./Navbar";
import "./style.css";
import categories from "../data/categories";

const flattenCategories = () =>
  categories.flatMap((cat) => [cat.name, ...cat.subcategories]);

const libraries = ["places"];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function normalizeTokens(str) {
  if (!str) return [];
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\-]/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

const businessTypes = [
  "Απλή Επιχείρηση",
  "Κυριλέ Επιχείρηση",
  "Εμπορική Επιχείρηση",
  "Νεοφυής Επιχείρηση",
  "Άλλη",
];

export default function ResultsPage() {
  const query = useQuery();
  const navigate = useNavigate();

  const [category, setCategory] = useState(query.get("category") || "");
  const [location, setLocation] = useState(query.get("location") || "");
  const [businessType, setBusinessType] = useState(query.get("keyword") || "");
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  const autocompleteRef = useRef(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((snap) => {
        if (snap.exists()) {
          setFavorites(snap.data().favorites || []);
        }
      });
    }
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

  const fetchBusinesses = async () => {
    setLoading(true);
    const userCollection = collection(db, "users");
    const snapshot = await getDocs(userCollection);

    const results = [];
    snapshot.forEach((doc) => {
      const { role, profile } = doc.data();
      if (role !== "business" || !profile) return;

      const catMatch =
        !category ||
        (profile.businessCategory &&
          profile.businessCategory.toLowerCase().includes(category.toLowerCase()));

      const searchLocationTokens = normalizeTokens(location);
      const businessLocationTokens = normalizeTokens(profile.businessLocation);

      // Improved location match: exact token match (not substring)
      const locMatch =
        !location ||
        (profile.businessLocation &&
          searchLocationTokens.some((token) =>
            businessLocationTokens.includes(token)
          ));

      const typeMatch =
        !businessType ||
        (profile.businessType &&
          profile.businessType.toLowerCase().includes(businessType.toLowerCase()));

      if (catMatch && locMatch && typeMatch) {
        results.push({ id: doc.id, ...profile });
      }
    });

    setBusinesses(results);
    setLoading(false);
  };

  useEffect(() => {
    fetchBusinesses();
  }, []); // load on mount

  const onSearch = () => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (location) params.append("location", location);
    if (businessType) params.append("keyword", businessType);
    navigate(`/results?${params.toString()}`);
    fetchBusinesses();
  };

 const toggleFavorite = async (bizId) => {
  const user = auth.currentUser;
  if (!user) {
    alert("Πρέπει να είστε συνδεδεμένος για να προσθέσετε στα αγαπημένα.");
    return;
  }
  const userRef = doc(db, "users", user.uid);
  let updatedFavorites;

  // Φέρε το username του χρήστη (αν υπάρχει)
  let username = user.uid;
  const userDoc = await getDoc(userRef);
  if (userDoc.exists() && userDoc.data().profile && userDoc.data().profile.username) {
    username = userDoc.data().profile.username;
  }

  if (favorites.includes(bizId)) {
    // ΑΦΑΙΡΕΣΗ από αγαπημένα
    updatedFavorites = favorites.filter((id) => id !== bizId);
    await updateDoc(userRef, { favorites: arrayRemove(bizId) });

    // Ειδοποίηση αφαίρεσης
    await addDoc(collection(db, "users", bizId, "notifications"), {
      type: "unfavorite",
      userId: user.uid,
      username,
      timestamp: new Date(), // ή serverTimestamp()
      read: false,
    });

  } else {
    // ΠΡΟΣΘΗΚΗ στα αγαπημένα
    updatedFavorites = [...favorites, bizId];
    await updateDoc(userRef, { favorites: arrayUnion(bizId) });

    // Ειδοποίηση προσθήκης
    await addDoc(collection(db, "users", bizId, "notifications"), {
      type: "favorite",
      userId: user.uid,
      username,
      timestamp: new Date(), // ή serverTimestamp()
      read: false,
    });
  }
  setFavorites(updatedFavorites);
};

  return (
    <>
      <Navbar />

      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "16px",
          minHeight: "calc(100vh - 80px)",
          boxSizing: "border-box",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          className="subtitle"
          style={{ margin: "8px 0 22px 0", textAlign: "center" }}
        >
          Αποτελέσματα αναζήτησης
        </h2>

        <div className="actions">
  {/* Category input (with dropdown, like main page) */}
  <div className="input-group">
    <input
      type="text"
      aria-label="Αναζήτηση κατηγορίας"
      placeholder="Κατηγορία"
      value={category}
      onChange={e => {
        setCategory(e.target.value);
      }}
      autoComplete="off"
    />
    {/* Dropdown: show only when searching, not when exact match */}
    {category &&
      flattenCategories()
        .filter(
          cat =>
            cat.toLowerCase().includes(category.toLowerCase()) &&
            cat.toLowerCase() !== category.toLowerCase()
        ).length > 0 && (
        <ul className="category-dropdown">
          {flattenCategories()
            .filter(
              cat =>
                cat.toLowerCase().includes(category.toLowerCase()) &&
                cat.toLowerCase() !== category.toLowerCase()
            )
            .map((cat, idx) => (
              <li
                key={idx}
                onClick={() => setCategory(cat)}
                onMouseDown={e => e.preventDefault()}
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
          onChange={e => setLocation(e.target.value)}
          aria-label="Τοποθεσία"
        />
      </Autocomplete>
    ) : (
      <input
        type="text"
        placeholder="Τοποθεσία"
        value={location}
        onChange={e => setLocation(e.target.value)}
        aria-label="Τοποθεσία"
      />
    )}
  </div>

  {/* Business type */}
  <div className="input-group">
    <select
      aria-label="Φίλτρο τύπου επιχείρησης"
      value={businessType}
      onChange={e => setBusinessType(e.target.value)}
    >
      <option value="">Φίλτρο</option>
      {businessTypes.map((type, idx) => (
        <option key={idx} value={type}>
          {type}
        </option>
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


        {loading ? (
          <div style={{ textAlign: "center", marginTop: 70, flexGrow: 1 }}>
            <span>Φόρτωση...</span>
          </div>
        ) : businesses.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              marginTop: 100,
              color: "#999",
              fontSize: 24,
              flexGrow: 1,
            }}
          >
            <span>Δεν βρέθηκαν επιχειρήσεις με αυτά τα κριτήρια.</span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
              gap: 30,
              flexGrow: 1,
              overflowY: "auto",
            }}
          >
            {businesses.map((biz) => (
              <div
                key={biz.id}
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  padding: "29px 18px 19px 18px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minHeight: 260,
                  transition: "transform 0.13s, box-shadow 0.13s",
                  cursor: "pointer",
                  border: "1.5px solid #f2f2f2",
                  position: "relative",
                }}
                tabIndex={0}
                role="button"
                onClick={() => navigate(`/business/${biz.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/business/${biz.id}`);
                }}
                className="results-card"
              >
                {/* Favorite Heart */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    await toggleFavorite(biz.id);
                  }}
                  aria-label={favorites.includes(biz.id) ? "Remove from favorites" : "Add to favorites"}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 24,
                    color: favorites.includes(biz.id) ? "#e63946" : "#ccc",
                    transition: "color 0.3s",
                  }}
                >
                  {favorites.includes(biz.id) ? "❤️" : "🤍"}
                </button>

                {/* Logo */}
                <div
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: "50%",
                    background: "#f6f8fc",
                    border: "2.5px solid #eaeaea",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 13,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={biz.businessLogo || "/placeholder-logo.png"}
                    alt={biz.businessName}
                    style={{
                      width: 66,
                      height: 66,
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                    onError={(e) => {
                      e.target.src = "/placeholder-logo.png";
                    }}
                  />
                </div>
                {/* Business Name */}
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 20,
                    textAlign: "center",
                    color: "#232323",
                  }}
                >
                  {biz.businessName}
                </div>
                {/* Category & Location */}
                <div style={{ fontSize: 16, color: "#60636d", margin: "8px 0 0 0" }}>
                  <span>{biz.businessCategory}</span>
                </div>
                <div style={{ fontSize: 15, color: "#999", marginBottom: 9 }}>
                  {biz.businessLocation}
                </div>
                {/* Keywords */}
                {biz.keywords && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#4682b4",
                      marginBottom: 7,
                      fontStyle: "italic",
                      textAlign: "center",
                    }}
                  >
                    {biz.keywords}
                  </div>
                )}
                {/* Contact */}
                {(biz.contactEmails || biz.contactPhones) && (
                  <div
                    style={{
                      fontSize: 14,
                      marginTop: 8,
                      textAlign: "center",
                      wordBreak: "break-word",
                    }}
                  >
                    {biz.contactEmails && (
                      <div>
                        <b>Email:</b>{" "}
                        {biz.contactEmails.split(",").map((mail, i) => (
                          <a
                            href={`mailto:${mail.trim()}`}
                            key={i}
                            style={{
                              color: "#285090",
                              textDecoration: "underline",
                              marginRight: 7,
                            }}
                          >
                            {mail.trim()}
                          </a>
                        ))}
                      </div>
                    )}
                    {biz.contactPhones && (
                      <div>
                        <b>Τηλ:</b>{" "}
                        {biz.contactPhones.split(",").map((phone, i) => (
                          <span key={i} style={{ marginRight: 7 }}>
                            {phone.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
