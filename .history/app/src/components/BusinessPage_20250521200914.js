import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useGoogleMaps } from "./GoogleMapsLoader";
import Navbar from "./Navbar";
import "./style.css";

export default function BusinessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps();

  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const mapRef = useRef(null);

  useEffect(() => {
    async function fetchBusiness() {
      const docRef = doc(db, "users", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setBiz(null);
      } else {
        const data = docSnap.data();
        if (data.role !== "business") setBiz(null);
        else setBiz(data.profile || {});
      }
      setLoading(false);
    }
    fetchBusiness();
  }, [id]);

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

  useEffect(() => {
    if (
      isLoaded &&
      biz &&
      biz.businessLocation &&
      biz.businessName &&
      window.google &&
      !reviews.length
    ) {
      if (!mapRef.current) {
        mapRef.current = new window.google.maps.Map(document.createElement("div"));
      }
      const service = new window.google.maps.places.PlacesService(mapRef.current);

      const queryString = `${biz.businessName} ${biz.businessLocation}`;

      service.textSearch(
        { query: queryString },
        (results, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results &&
            results.length
          ) {
            const placeId = results[0].place_id;
            service.getDetails(
              { placeId, fields: ["review"] },
              (placeDetails, detailStatus) => {
                if (
                  detailStatus === window.google.maps.places.PlacesServiceStatus.OK &&
                  placeDetails
                ) {
                  setReviews(placeDetails.reviews || []);
                }
              }
            );
          }
        }
      );
    }
  }, [isLoaded, biz, reviews.length]);

  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Πρέπει να είστε συνδεδεμένος για να προσθέσετε στα αγαπημένα.");
      return;
    }
    const userRef = doc(db, "users", user.uid);
    let updatedFavorites;
    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter((fid) => fid !== id);
      await updateDoc(userRef, { favorites: arrayRemove(id) });
    } else {
      updatedFavorites = [...favorites, id];
      await updateDoc(userRef, { favorites: arrayUnion(id) });
    }
    setFavorites(updatedFavorites);
  };

  if (loading)
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: 80 }}>Φόρτωση...</div>
      </>
    );

  if (!biz)
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: 120, color: "#d00" }}>
          <h2>Η επιχείρηση δεν βρέθηκε.</h2>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              borderRadius: 22,
              background: "#333",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Επιστροφή στα αποτελέσματα
          </button>
        </div>
      </>
    );

  return (
    <>
      <Navbar />

      <div
        style={{
          maxWidth: 700,
          margin: "40px auto",
          boxSizing: "border-box",
          fontFamily: "'EB Garamond', serif",
          color: "#191919",
          borderRadius: 12,
          backgroundColor: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          // removed fixed height and overflow styles here
        }}
      >
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleFavorite();
          }}
          aria-label={favorites.includes(id) ? "Remove from favorites" : "Add to favorites"}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 30,
            color: favorites.includes(id) ? "#e63946" : "#ccc",
            transition: "color 0.3s",
            zIndex: 20,
          }}
        >
          {favorites.includes(id) ? "❤️" : "🤍"}
        </button>

        {/* Content */}
        <div style={{ padding: "0 20px", width: "100%", maxWidth: 700 }}>
          {/* Logo */}
          <img
            src={biz.businessLogo || "/placeholder-logo.png"}
            alt={biz.businessName}
            style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              border: "2.5px solid #f1f1f1",
              objectFit: "cover",
              background: "#f7f7f7",
              marginBottom: 28,
              boxShadow: "0 2px 16px rgba(40,70,120,0.09)",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              marginTop: 28
            }}
            onError={(e) => {
              e.target.src = "/placeholder-logo.png";
            }}
          />

          {/* Name */}
          <h1
            style={{
              fontWeight: 700,
              fontSize: 32,
              margin: "0 0 16px 0",
              textAlign: "center",
            }}
          >
            {biz.businessName}
          </h1>

          {/* Description */}
          {biz.companyDescription && (
            <p
              style={{
                fontSize: 18,
                fontStyle: "italic",
                color: "#555",
                textAlign: "center",
                marginBottom: 24,
                maxWidth: 600,
                lineHeight: 1.5,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {biz.companyDescription}
            </p>
          )}

          {/* Location */}
          <div
            style={{
              textAlign: "center",
              fontSize: 17,
              color: "#666",
              marginBottom: 24,
              maxWidth: 600,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {biz.businessLocation}
          </div>

          {/* Map */}
          {biz.businessLocation && (
            <iframe
              title="Business Location"
              width="100%"
              height="270"
              frameBorder="0"
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
                marginBottom: 30,
              }}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                biz.businessLocation
              )}&output=embed`}
              allowFullScreen
            />
          )}

          {/* Contacts */}
          <div
  style={{
    width: "100%",
    maxWidth: 600,
    marginBottom: 28,
    marginLeft: "auto",
    marginRight: "auto",
    fontSize: 16,
    color: "#191919",
  }}
>
  {biz.contactEmails && (
    <div style={{ marginBottom: 12 }}>
      <strong style={{ display: "block", marginBottom: 6 }}>Email:</strong>
      <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
        {biz.contactEmails.split(",").map((mail, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            <a
              href={`mailto:${mail.trim()}`}
              style={{
                color: "#285090",
                textDecoration: "underline",
                wordBreak: "break-word",
              }}
            >
              {mail.trim()}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )}

  {biz.contactPhones && (
    <div style={{ marginBottom: 12 }}>
      <strong style={{ display: "block", marginBottom: 6 }}>Τηλ:</strong>
      <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
        {biz.contactPhones.split(",").map((phone, i) => (
          <li key={i} style={{ marginBottom: 4, wordBreak: "break-word" }}>
            {phone.trim()}
          </li>
        ))}
      </ul>
    </div>
  )}

  {biz.fax && (
    <div>
      <strong style={{ display: "block", marginBottom: 6 }}>Fax:</strong>
      <span>{biz.fax}</span>
    </div>
  )}
</div>


          {/* Services / Keywords */}
          {biz.keywords && (
            <div
              style={{
                fontSize: 15,
                color: "#4682b4",
                fontStyle: "italic",
                textAlign: "center",
                marginBottom: 40,
                maxWidth: 600,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {biz.keywords}
            </div>
          )}

          {/* Google Reviews */}
          {reviews.length > 0 && (
            <div
              style={{
                maxWidth: 600,
                width: "100%",
                marginBottom: 40,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <h3 style={{ marginBottom: 16, fontWeight: 700, fontSize: 22 }}>
                Κριτικές Google
              </h3>
              {reviews.map((review, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 20,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#f6f8fc",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 6,
                      fontSize: 16,
                      color: "#232323",
                    }}
                  >
                    {review.author_name}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    {"⭐".repeat(review.rating)}{" "}
                    <span style={{ color: "#888" }}>
                      - {new Date(review.time * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, color: "#555" }}>{review.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Back Button */}
          <button
  onClick={() => navigate(-1)}
  style={{
    padding: "12px 28px",
    background: "#191919",
    color: "#fff",
    border: "none",
    borderRadius: 24,
    fontSize: 18,
    cursor: "pointer",
    fontFamily: "'EB Garamond', serif",
    marginBottom: 30,
    minWidth: 160,
    display: "block",      // added
    marginLeft: "auto",    // added
    marginRight: "auto",   // added
  }}
>
  Επιστροφή στα αποτελέσματα
</button>

        </div>
      </div>
    </>
  );
}
