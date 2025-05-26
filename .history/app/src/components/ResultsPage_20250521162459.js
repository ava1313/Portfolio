import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import "./style.css";

const libraries = ["places"];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Normalize string: remove accents, punctuation, lowercase, split to tokens
function normalizeTokens(str) {
  if (!str) return [];
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[.,\-]/g, " ") // punctuation → space
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

  // State controlled by inputs
  const [category, setCategory] = useState(query.get("category") || "");
  const [location, setLocation] = useState(query.get("location") || "");
  const [businessType, setBusinessType] = useState(query.get("keyword") || "");
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, []); // initial fetch once

  const onSearch = () => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (location) params.append("location", location);
    if (businessType) params.append("keyword", businessType);
    navigate(`/results?${params.toString()}`);
    fetchBusinesses();
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
      {/* Clickable centered Logo */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          marginBottom: 18,
        }}
        onClick={() => navigate("/mainpage")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/mainpage");
        }}
        aria-label="Go to homepage"
      >
        <img
          src="/logo.png"
          alt="freedome logo"
          className="logo"
          style={{
            height: 68,
            display: "block",
          }}
        />
      </div>

      <h2 className="subtitle" style={{ margin: "8px 0 22px 0", textAlign: "center" }}>
        Αποτελέσματα αναζήτησης
      </h2>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 30,
          justifyContent: "center",
        }}
      >
        {/* Category dropdown */}
        <select
          aria-label="Κατηγορία"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: "14px 20px",
            borderRadius: "40px",
            border: "2px solid black",
            fontSize: 18,
            cursor: "pointer",
            minWidth: 180,
            flexGrow: 1,
            maxWidth: 300,
            appearance: "none",
            backgroundColor: "white",
          }}
        >
          <option value="">Επιλέξτε κατηγορία</option>
          {flattenCategories().map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Location input */}
        <div style={{ flexGrow: 1, minWidth: 300, maxWidth: 400 }}>
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
                  fontSize: 18,
                  width: "100%",
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
                fontSize: 18,
                width: "100%",
              }}
            />
          )}
        </div>

        {/* Business Type dropdown */}
        <select
          aria-label="Τύπος Επιχείρησης"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          style={{
            padding: "14px 20px",
            borderRadius: "40px",
            border: "2px solid black",
            fontSize: 18,
            cursor: "pointer",
            minWidth: 180,
            flexGrow: 1,
            maxWidth: 300,
            appearance: "none",
            backgroundColor: "white",
          }}
        >
          <option value="">Επιλέξτε τύπο επιχείρησης</option>
          {businessTypes.map((type, idx) => (
            <option key={idx} value={type}>
              {type}
            </option>
          ))}
        </select>

        {/* Search button */}
        <button
          onClick={onSearch}
          aria-label="Αναζήτηση"
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
              }}
              tabIndex={0}
              role="button"
              onClick={() => navigate(`/business/${biz.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(`/business/${biz.id}`);
              }}
              className="results-card"
            >
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
              <div
                style={{ fontSize: 16, color: "#60636d", margin: "8px 0 0 0" }}
              >
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
