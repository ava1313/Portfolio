import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
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
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [events, setEvents] = useState([]);
  const [offers, setOffers] = useState([]);

  const [deletingId, setDeletingId] = useState("");

  // Helper: render stars with SVG for ratings (full, half, empty)
  const renderStars = (rating) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const starSVG = (fill) => (
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`
    );

    return (
      <span style={{ display: "inline-flex", gap: 2, verticalAlign: "middle" }}
        dangerouslySetInnerHTML={{
          __html:
            starSVG("#FFC107").repeat(fullStars) +
            (halfStar
              ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="url(#halfGradient)" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="halfGradient"><stop offset="50%" stop-color="#FFC107"/><stop offset="50%" stop-color="none"/></linearGradient></defs><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`
              : "") +
            starSVG("none").replace('stroke="#FFC107"', 'stroke="#FFC107"').repeat(emptyStars),
        }}
      />
    );
  };

  // Average rating calculation
  const averageRating =
    reviews.length === 0
      ? null
      : reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  // Fetch business data
  useEffect(() => {
    async function fetchBusiness() {
      setLoading(true);
      const docRef = doc(db, "users", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setBiz(null);
        setLoading(false);
        return;
      }
      const data = docSnap.data();
      if (data.role !== "business") {
        setBiz(null);
        setLoading(false);
        return;
      }
      setBiz(data.profile || {});
      setLoading(false);
    }
    fetchBusiness();
  }, [id]);

  // Fetch events
  useEffect(() => {
    if (!id) return;
    const fetchEvents = async () => {
      const eventsCol = collection(db, "events");
      const q = query(eventsCol, where("businessId", "==", id), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedEvents = [];
      querySnapshot.forEach((doc) => {
        fetchedEvents.push({ id: doc.id, ...doc.data() });
      });
      setEvents(fetchedEvents);
    };
    fetchEvents();
  }, [id]);

  // Fetch offers
  useEffect(() => {
    if (!id) return;
    const fetchOffers = async () => {
      const offersCol = collection(db, "offers");
      const q = query(offersCol, where("businessId", "==", id), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedOffers = [];
      querySnapshot.forEach((doc) => {
        fetchedOffers.push({ id: doc.id, ...doc.data() });
      });
      setOffers(fetchedOffers);
    };
    fetchOffers();
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      const reviewsCol = collection(db, "users", id, "reviews");
      const q = query(reviewsCol, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedReviews = [];
      querySnapshot.forEach((doc) => {
        fetchedReviews.push({ id: doc.id, ...doc.data() });
      });
      setReviews(fetchedReviews);
    };
    fetchReviews();
  }, [id]);

  // Toggle favorite business
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
      await updateDoc(userRef, { favorites: updatedFavorites });
    } else {
      updatedFavorites = [...favorites, id];
      await updateDoc(userRef, { favorites: updatedFavorites });
    }
    setFavorites(updatedFavorites);
  };

  // Handle review input change
  const handleReviewChange = (field, value) => {
    setNewReview((prev) => ({ ...prev, [field]: value }));
  };

  // Submit a new review
  const submitReview = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Πρέπει να είστε συνδεδεμένος για να αφήσετε κριτική.");
      return;
    }
    if (!newReview.comment.trim()) {
      alert("Παρακαλώ γράψτε κάποιο σχόλιο.");
      return;
    }
    setSubmittingReview(true);
    try {
      const reviewsCol = collection(db, "users", id, "reviews");
      await addDoc(reviewsCol, {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Anonymous",
        rating: Number(newReview.rating),
        comment: newReview.comment.trim(),
        timestamp: new Date(),
      });
      setNewReview({ rating: 5, comment: "" });
      // Refresh reviews after submit
      const q = query(reviewsCol, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedReviews = [];
      querySnapshot.forEach((doc) => {
        fetchedReviews.push({ id: doc.id, ...doc.data() });
      });
      setReviews(fetchedReviews);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Σφάλμα κατά την αποστολή της κριτικής.");
    }
    setSubmittingReview(false);
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
          padding: 24,
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

        {/* Business Logo */}
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
            marginBottom: 20,
            boxShadow: "0 2px 16px rgba(40,70,120,0.09)",
            display: "block",
          }}
          onError={(e) => {
            e.target.src = "/placeholder-logo.png";
          }}
        />

        {/* Business Name */}
        <h1
          style={{
            fontWeight: 700,
            fontSize: 32,
            margin: "0 0 8px 0",
            textAlign: "center",
          }}
        >
          {biz.businessName}
        </h1>

        {/* Average Rating */}
        {reviews.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 18,
              marginBottom: 16,
              fontWeight: "600",
              color: "#f0a500",
            }}
          >
            {renderStars(averageRating)}
            <span style={{ color: "#444", fontWeight: "500" }}>
              {averageRating.toFixed(1)} ({reviews.length} κριτικές)
            </span>
          </div>
        )}

        {/* Company Description */}
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

        {/* Other UI (hours, location, contacts, map, review form, reviews...) */}
        {/* ... KEEP YOUR EXISTING CODE ... */}

        {/* Reviews List */}
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
              Κριτικές Χρηστών
            </h3>
            {reviews.map((review) => (
              <div
                key={review.id}
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
                  {review.userName}
                </div>
                <div style={{ marginBottom: 6, color: "#f0a500" }}>
                  {renderStars(review.rating)}
                  <span style={{ color: "#888", marginLeft: 8 }}>
                    {review.timestamp
                      ? new Date(review.timestamp.seconds * 1000).toLocaleDateString()
                      : ""}
                  </span>
                </div>
                <div style={{ fontSize: 15, color: "#555" }}>{review.comment}</div>
              </div>
            ))}
          </div>
        )}

        {/* ... keep the rest of your existing JSX for events, offers, buttons etc */}
      </div>
    </>
  );
}
