import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function FavoritesPage() {
  const [favoritesData, setFavoritesData] = useState({}); // { bizId: {tags: [], note: ""} }
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFavorites() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }
        const favs = userSnap.data().favorites || {};

        // favs can be old style array or new style object - normalize to object
        const favsObj = Array.isArray(favs)
          ? favs.reduce((acc, id) => {
              acc[id] = { tags: [], note: "" };
              return acc;
            }, {})
          : favs;

        setFavoritesData(favsObj);

        if (Object.keys(favsObj).length === 0) {
          setBusinesses([]);
          setLoading(false);
          return;
        }

        // Fetch business profiles for favorites
        const usersCollection = collection(db, "users");
        const snapshot = await getDocs(usersCollection);

        const favBusinesses = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (
            data.role === "business" &&
            data.profile &&
            favsObj.hasOwnProperty(doc.id)
          ) {
            favBusinesses.push({ id: doc.id, ...data.profile });
          }
        });

        setBusinesses(favBusinesses);
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setError("Failed to load favorites.");
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, []);

  // Save note or tags changes for a business favorite
  const handleSaveFavorite = async (bizId) => {
    setSavingId(bizId);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const userRef = doc(db, "users", user.uid);

      // Update only favorites field with the modified favorite info
      const updatedFavorites = {
        ...favoritesData,
      };

      await updateDoc(userRef, { favorites: updatedFavorites });

      alert("Favorite updated!");
    } catch (err) {
      console.error("Error saving favorite:", err);
      setError("Failed to save favorite.");
    } finally {
      setSavingId(null);
    }
  };

  // Update note or tags input for a favorite
  const handleFavoriteChange = (bizId, field, value) => {
    setFavoritesData((prev) => ({
      ...prev,
      [bizId]: {
        ...prev[bizId],
        [field]: value,
      },
    }));
  };

  if (loading)
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: 80 }}>Loading favorites...</div>
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

        {error && (
          <div
            style={{
              color: "red",
              textAlign: "center",
              marginBottom: 20,
              fontWeight: "bold",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: 30,
          }}
        >
          {businesses.map((biz) => {
            const fav = favoritesData[biz.id] || { tags: [], note: "" };
            return (
              <div
                key={biz.id}
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 360,
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
                    marginBottom: 6,
                  }}
                >
                  {biz.businessName}
                </div>
                {/* Category & Location */}
                <div
                  style={{
                    fontSize: 16,
                    color: "#60636d",
                    marginBottom: 6,
                    textAlign: "center",
                  }}
                >
                  <span>{biz.businessCategory}</span>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: "#999",
                    marginBottom: 12,
                    textAlign: "center",
                  }}
                >
                  {biz.businessLocation}
                </div>

                {/* Tags input */}
                <label
                  style={{ fontSize: 14, marginBottom: 4, fontWeight: "600" }}
                  htmlFor={`tags-${biz.id}`}
                >
                  Tags (comma separated)
                </label>
                <input
                  id={`tags-${biz.id}`}
                  type="text"
                  value={(fav.tags || []).join(", ")}
                  onChange={(e) =>
                    handleFavoriteChange(
                      biz.id,
                      "tags",
                      e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                    )
                  }
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    marginBottom: 12,
                    fontSize: 14,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  placeholder="Add tags separated by commas"
                />

                {/* Notes textarea */}
                <label
                  style={{ fontSize: 14, marginBottom: 4, fontWeight: "600" }}
                  htmlFor={`note-${biz.id}`}
                >
                  Notes
                </label>
                <textarea
                  id={`note-${biz.id}`}
                  value={fav.note || ""}
                  onChange={(e) => handleFavoriteChange(biz.id, "note", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  rows={4}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    fontSize: 14,
                    resize: "vertical",
                    width: "100%",
                    boxSizing: "border-box",
                    marginBottom: 12,
                  }}
                  placeholder="Add notes about this business"
                />

                {/* Save button */}
                <button
                  type="button"
                  disabled={savingId === biz.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveFavorite(biz.id);
                  }}
                  style={{
                    backgroundColor: savingId === biz.id ? "#999" : "#191919",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 24,
                    cursor: savingId === biz.id ? "not-allowed" : "pointer",
                    fontFamily: "'EB Garamond', serif",
                    fontWeight: 400,
                    fontSize: 16,
                    alignSelf: "center",
                    transition: "background-color 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    if (savingId !== biz.id) e.currentTarget.style.backgroundColor = "#444";
                  }}
                  onMouseLeave={(e) => {
                    if (savingId !== biz.id) e.currentTarget.style.backgroundColor = "#191919";
                  }}
                >
                  {savingId === biz.id ? "Saving..." : "Save"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
