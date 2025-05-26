import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./style.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// More robust location matching: splits on words, ignores case, accents, and punctuation
function normalizeTokens(str) {
  if (!str) return [];
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[.,\-]/g, " ")         // Replace punctuation with space
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export default function ResultsPage() {
  const query = useQuery();
  const category = query.get("category") || "";
  const location = query.get("location") || "";
  const keyword = query.get("keyword") || "";

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBusinesses() {
      const userCollection = collection(db, "users");
      const snapshot = await getDocs(userCollection);

      const results = [];
      snapshot.forEach((doc) => {
        const { role, profile } = doc.data();
        if (role !== "business" || !profile) return;

        // Category matching
        const catMatch =
          !category ||
          (profile.businessCategory &&
            profile.businessCategory.toLowerCase().includes(category.toLowerCase()));

        // Location matching: split both query and address to tokens, compare each search word
        const searchLocationTokens = normalizeTokens(location);
        const businessLocationTokens = normalizeTokens(profile.businessLocation);

        const locMatch =
          !location ||
          (profile.businessLocation &&
            searchLocationTokens.every(token =>
              businessLocationTokens.some(bizToken => bizToken.includes(token))
            )
          );

        // Keyword matching
        const kwMatch =
          !keyword ||
          (profile.businessName &&
            profile.businessName.toLowerCase().includes(keyword.toLowerCase())) ||
          (profile.keywords &&
            profile.keywords.toLowerCase().includes(keyword.toLowerCase()));

        if (catMatch && locMatch && kwMatch) {
          results.push({ id: doc.id, ...profile });
        }
      });
      setBusinesses(results);
      setLoading(false);
    }

    fetchBusinesses();
  }, [category, location, keyword]);

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: "36px 16px 42px 16px",
        minHeight: "100vh",
        boxSizing: "border-box"
      }}
    >
      {/* Centered Logo */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <img
          src="/logo.png"
          alt="freedome logo"
          className="logo"
          style={{
            height: 68,
            margin: "0 auto 18px auto",
            display: "block",
            filter: "drop-shadow(0 2px 14px #e0e0e0)"
          }}
        />
      </div>

      {/* Subtitle and search criteria */}
      <h2 className="subtitle" style={{ margin: "8px 0 22px 0" }}>
        Αποτελέσματα αναζήτησης
      </h2>
      <div
        style={{
          background: "#f4f6fb",
          borderRadius: 16,
          padding: "13px 18px",
          marginBottom: 36,
          fontSize: 16,
          display: "flex",
          justifyContent: "center",
          gap: 20,
          flexWrap: "wrap"
        }}
      >
        <span><b>Κατηγορία:</b> {category || <i>Καμία</i>}</span>
        <span><b>Τοποθεσία:</b> {location || <i>Καμία</i>}</span>
        <span><b>Λέξεις-κλειδιά:</b> {keyword || <i>Καμία</i>}</span>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: "center", marginTop: 70 }}>
          <span>Φόρτωση...</span>
        </div>
      ) : businesses.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            marginTop: 100,
            color: "#999",
            fontSize: 24
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
            marginTop: 12
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
                border: "1.5px solid #f2f2f2"
              }}
              tabIndex={0}
              role="button"
              onClick={() => navigate(`/business/${biz.id}`)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate(`/business/${biz.id}`); }}
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
                  overflow: "hidden"
                }}
              >
                <img
                  src={biz.businessLogo || "/placeholder-logo.png"}
                  alt={biz.businessName}
                  style={{
                    width: 66,
                    height: 66,
                    objectFit: "cover",
                    borderRadius: "50%"
                  }}
                  onError={e => { e.target.src = "/placeholder-logo.png"; }}
                />
              </div>
              {/* Business Name */}
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  textAlign: "center",
                  color: "#232323"
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
                    textAlign: "center"
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
                    wordBreak: "break-word"
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
                            marginRight: 7
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
