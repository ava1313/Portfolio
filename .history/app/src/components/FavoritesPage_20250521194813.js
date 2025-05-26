import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFavorites() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setLoading(false);
        return;
      }
      const favs = userSnap.data().favorites || [];
      setFavorites(favs);

      if (favs.length === 0) {
        setBusinesses([]);
        setLoading(false);
        return;
      }

      // Fetch businesses matching favorites
      const usersCollection = collection(db, "users");
      const snapshot = await getDocs(usersCollection);

      const favBusinesses = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data.role === "business" &&
          data.profile &&
          favs.includes(doc.id)
        ) {
          favBusinesses.push({ id: doc.id, ...data.profile });
        }
      });

      setBusinesses(favBusinesses);
      setLoading(false);
    }

    fetchFavorites();
  }, []);

  if (loading)
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: 80 }}>
          Loading favorites...
        </div>
      </>
    );

  if (businesses.length === 0)
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: 100, color: "#999" }}>
          Δεν έχετε προσθέσει αγαπημένες επιχειρήσεις.
        </div>
      </>
    );

  return (
    <>
      <Navbar />
      <div
        style={{
          maxWidth: 1080,
          margin: "40px auto",
          padding: "16px",
          fontFamily: "'EB Garamond', serif",
          color: "#191919",
        }}
      >
        <h2 style={{ marginBottom: 24, textAlign: "center" }}>
          Οι Αγαπημένες Μου Επιχειρήσεις
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: 30,
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
                cursor: "pointer",
                border: "1.5px solid #f2f2f2",
              }}
              tabIndex={0}
              role="button"
              onClick={() => navigate(`/business/${biz.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(`/business/${biz.id}`);
              }}
            >
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
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
