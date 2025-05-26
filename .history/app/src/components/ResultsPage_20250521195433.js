import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, getDoc, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
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

  // Filters and data
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

  // Load user favorites on mount
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

      const locMatch =
        !location ||
        (profile.businessLocation &&
          searchLocationTokens.every((token) =>
            businessLocationTokens.some((bizToken) => bizToken.includes(token))
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

  // Toggle favorite for a business
  const toggleFavorite = async (bizId) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Πρέπει να είστε συνδεδεμένος για να προσθέσετε στα αγαπημένα.");
      return;
    }
    const userRef = doc(db, "users", user.uid);
    let updatedFavorites;
    if (favorites.includes(bizId)) {
      updatedFavorites = favorites.filter((id) => id !== bizId);
      await updateDoc(userRef, { favorites: arrayRemove(bizId) });
    } else {
      updatedFavorites = [...favorites, bizId];
      await updateDoc(userRef, { favorites: arrayUnion(bizId) });
    }
    setFavorites(updatedFavorites);
  };

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: "16px",
        minHeight: "100vh",
        boxSizing: "border-box",
        height: "calc(100vh - 80px)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navbar: logo center, profile + favorites right */}
      <header
        style={{
          width: "100vw",
          backgroundColor: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 0",
          position: "relative",
          boxSizing: "border-box",
          marginBottom: 16,
        }}
      >
        {/* Centered Logo */}
        <img
          src="/logo.png"
          alt="freedome logo"
          style={{
            height: 50,
            cursor: "pointer",
            objectFit: "contain",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
          onClick={() => navigate("/mainpage")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/mainpage");
          }}
          aria-label="Go to homepage"
        />

        {/* Icons on the right */}
        <div
          style={{
            position: "absolute",
            right: 16,
            display: "flex",
            gap: 16,
          }}
        >
          {/* Profile Icon */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/dashboard")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
            }}
            aria-label="User profile icon"
            style={{
              background: "#fff",
              borderRadius: "50%",
              border: "3px solid #000",
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg
              viewBox="0 0 40 40"
              width="24"
              height="24"
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

          {/* Favorites Icon */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/favorites")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/favorites");
            }}
            aria-label="Favorites"
            style={{
              background: "#fff",
              borderRadius: "50%",
              border: "3px solid #000",
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="black"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h1.87C14.46 4.99 15.96 4 17.5 4 20 4 22 6 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z" />
            </svg>
          </div>
        </div>
      </header>

      <h2 className="subtitle" style={{ margin: "8px 0 22px 0", textAlign: "center" }}>
        Αποτελέσματα αναζήτησης
      </h2>

      {/* Filters */}
      <div className="actions" style={{ gap: 20, flexWrap: "wrap" }}>
        {/* Category dropdown */}
        <div style={{ flex: "1 1 200px" }}>
          <select
            aria-label="Κατηγορία"
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
            {flattenCategories().map((cat, idx) => (
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

      {/* Results */}
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

              {/* Logo (circle) */}
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
  );
}
