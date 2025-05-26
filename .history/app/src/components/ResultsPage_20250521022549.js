import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./style.css"; // uses your existing CSS

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResultsPage() {
  const query = useQuery();
  const category = query.get("category") || "";
  const location = query.get("location") || "";
  const keyword = query.get("keyword") || "";

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBusinesses() {
      const userCollection = collection(db, "users");
      const snapshot = await getDocs(userCollection);

      const results = [];
      snapshot.forEach((doc) => {
        const { role, profile } = doc.data();
        if (role !== "business" || !profile) return;

        // Match criteria (loose matching for better UX)
        const catMatch =
          !category ||
          (profile.businessCategory &&
            profile.businessCategory.toLowerCase().includes(category.toLowerCase()));
        const locMatch =
          !location ||
          (profile.businessLocation &&
            profile.businessLocation.toLowerCase().includes(location.toLowerCase()));
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 0" }}>
      <header>
        <img src="/logo.png" alt="freedome logo" className="logo" />
      </header>
      <h2 className="subtitle" style={{ marginTop: 28 }}>
        Αποτελέσματα αναζήτησης
      </h2>

      <div style={{
        background: "#fafafa",
        borderRadius: 18,
        padding: "20px 24px",
        marginBottom: 32,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        fontSize: 17
      }}>
        <b>Κατηγορία:</b> {category || <i>Καμία</i>}{" | "}
        <b>Τοποθεσία:</b> {location || <i>Καμία</i>}{" | "}
        <b>Λέξεις-κλειδιά:</b> {keyword || <i>Καμία</i>}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: 50 }}>
          <span>Φόρτωση...</span>
        </div>
      ) : businesses.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 80, color: "#999", fontSize: 24 }}>
          <span>Δεν βρέθηκαν επιχειρήσεις με αυτά τα κριτήρια.</span>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 28,
        }}>
          {businesses.map((biz) => (
            <div
              key={biz.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minHeight: 220,
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <img
                  src={biz.businessLogo || "/placeholder-logo.png"}
                  alt={biz.businessName}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1.5px solid #ddd",
                    background: "#fafafa"
                  }}
                  onError={e => { e.target.src = "/placeholder-logo.png"; }}
                />
              </div>
              <div style={{ fontWeight: 600, fontSize: 20, textAlign: "center" }}>
                {biz.businessName}
              </div>
              <div style={{ fontSize: 15, color: "#666", margin: "10px 0 2px 0" }}>
                {biz.businessCategory}
              </div>
              <div style={{ fontSize: 15, color: "#999", marginBottom: 8 }}>
                {biz.businessLocation}
              </div>
              {biz.keywords && (
                <div style={{
                  fontSize: 13, color: "#4682b4",
                  marginBottom: 7, fontStyle: "italic"
                }}>
                  {biz.keywords}
                </div>
              )}
              {/* Contact details */}
              {(biz.contactEmails || biz.contactPhones) && (
                <div style={{ fontSize: 14, marginTop: 8 }}>
                  {biz.contactEmails && (
                    <div>
                      <b>Email:</b>{" "}
                      {biz.contactEmails.split(",").map((mail, i) => (
                        <a
                          href={`mailto:${mail.trim()}`}
                          key={i}
                          style={{ color: "#285090", textDecoration: "underline", marginRight: 8 }}
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
                        <span key={i} style={{ marginRight: 10 }}>
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
