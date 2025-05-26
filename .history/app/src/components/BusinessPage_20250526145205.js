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
import Navbar from "./Navbar";

export default function BusinessPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [events, setEvents] = useState([]);
  const [offers, setOffers] = useState([]);

  const [modal, setModal] = useState({ visible: false, message: "" });
  const [deletingId, setDeletingId] = useState("");

  // Fetch business data
  useEffect(() => {
    setLoading(true);
    getDoc(doc(db, "users", id))
      .then((docSnap) => {
        if (!docSnap.exists() || docSnap.data().role !== "business") {
          setBiz(null);
        } else {
          setBiz(docSnap.data().profile || {});
        }
      })
      .catch(() => setBiz(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "users", id, "reviews"),
      orderBy("timestamp", "desc")
    );
    getDocs(q).then((snap) => {
      const fetched = [];
      snap.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      setReviews(fetched);
    });
  }, [id]);

  // Fetch events
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "events"),
      where("businessId", "==", id),
      orderBy("timestamp", "desc")
    );
    getDocs(q).then((snap) => {
      const fetched = [];
      snap.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      setEvents(fetched);
    });
  }, [id]);

  // Fetch offers
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "offers"),
      where("businessId", "==", id),
      orderBy("timestamp", "desc")
    );
    getDocs(q).then((snap) => {
      const fetched = [];
      snap.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      setOffers(fetched);
    });
  }, [id]);

  // Fetch user favorites
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      getDoc(doc(db, "users", user.uid)).then((snap) => {
        if (snap.exists()) setFavorites(snap.data().favorites || []);
      });
    }
  }, []);

  // Modal helpers
  const showModal = (message) => setModal({ visible: true, message });
  const closeModal = () => setModal({ visible: false, message: "" });

  // Toggle favorite
  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) {
      showModal("Πρέπει να είστε συνδεδεμένος για να προσθέσετε στα αγαπημένα.");
      return;
    }
    const userRef = doc(db, "users", user.uid);
    let updatedFavorites;
    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter((fid) => fid !== id);
    } else {
      updatedFavorites = [...favorites, id];
    }
    try {
      await updateDoc(userRef, { favorites: updatedFavorites });
      setFavorites(updatedFavorites);
    } catch {
      showModal("Σφάλμα κατά την ενημέρωση των αγαπημένων.");
    }
  };

  // Handle review input change
  const handleReviewChange = (field, value) => {
    setNewReview((prev) => ({ ...prev, [field]: value }));
  };

  // Submit review
  const submitReview = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      showModal("Πρέπει να είστε συνδεδεμένος για να αφήσετε κριτική.");
      return;
    }
    if (!newReview.comment.trim()) {
      showModal("Παρακαλώ γράψτε κάποιο σχόλιο.");
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

      // Refresh reviews
      const q = query(reviewsCol, orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      const fetched = [];
      snap.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      setReviews(fetched);
    } catch {
      showModal("Σφάλμα κατά την αποστολή της κριτικής.");
    }
    setSubmittingReview(false);
  };

  // Delete item (event/offer)
  const deleteItem = async (type, itemId) => {
    if (!window.confirm("Θέλετε σίγουρα να διαγράψετε;")) return;
    setDeletingId(itemId);
    try {
      await deleteDoc(doc(db, type, itemId));
      if (type === "offers") setOffers((prev) => prev.filter((o) => o.id !== itemId));
      if (type === "events") setEvents((prev) => prev.filter((e) => e.id !== itemId));
    } catch {
      showModal("Σφάλμα στη διαγραφή.");
    }
    setDeletingId("");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: 80 }}>Φόρτωση...</div>
      </>
    );
  }
  if (!biz) {
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
  }

  // Calculate average rating
  const avgRating =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const getStars = (rating) => {
    if (!rating) return "No rating";
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let stars = "";
    for (let i = 0; i < full; i++) stars += "⭐";
    if (half) stars += "✩";
    while (stars.length < 5) stars += "☆";
    return stars;
  };

  return (
    <>
      <Navbar />

      <main
        style={{
          maxWidth: 900,
          margin: "40px auto",
          padding: "0 16px 40px",
          fontFamily: "'EB Garamond', serif",
          color: "#191919",
        }}
      >
        {/* Header with logo, name, rating and favorite toggle */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 3px 15px rgba(0,0,0,0.05)",
            background: "#fff",
          }}
        >
          <img
            src={biz.businessLogo || "/placeholder-logo.png"}
            alt={biz.businessName}
            style={{
              width: 120,
              height: 120,
              objectFit: "cover",
              borderRadius: 16,
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              flexShrink: 0,
            }}
            onError={(e) => (e.target.src = "/placeholder-logo.png")}
          />
          <div style={{ flexGrow: 1 }}>
            <h1 style={{ margin: 0, fontSize: 32 }}>{biz.businessName}</h1>
            <div
              style={{
                fontSize: 18,
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              aria-label={`Μέση βαθμολογία: ${avgRating.toFixed(1)} αστέρια από ${reviews.length} κριτικές`}
            >
              <span style={{ fontWeight: "700" }}>{getStars(avgRating)}</span>
              <span style={{ color: "#666", fontSize: 16 }}>
                ({reviews.length} κριτικές)
              </span>
            </div>
          </div>
          <button
            onClick={toggleFavorite}
            aria-label={favorites.includes(id) ? "Αφαίρεση από αγαπημένα" : "Προσθήκη στα αγαπημένα"}
            style={{
              background: "none",
              border: "none",
              fontSize: 32,
              cursor: "pointer",
              color: favorites.includes(id) ? "#e63946" : "#ccc",
              transition: "color 0.3s",
            }}
          >
            {favorites.includes(id) ? "❤️" : "🤍"}
          </button>
        </header>

        {/* Description */}
        {biz.companyDescription && (
          <p
            style={{
              fontSize: 18,
              fontStyle: "italic",
              color: "#555",
              marginBottom: 32,
              maxWidth: 700,
              marginLeft: "auto",
              marginRight: "auto",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {biz.companyDescription}
          </p>
        )}

        {/* Location and map */}
        <section
          style={{
            marginBottom: 32,
            maxWidth: 700,
            marginLeft: "auto",
            marginRight: "auto",
            textAlign: "center",
            fontSize: 16,
            color: "#555",
          }}
        >
          <div>{biz.businessLocation}</div>
          {biz.businessLocation && (
            <iframe
              title="Business Location"
              width="100%"
              height="270"
              frameBorder="0"
              style={{ borderRadius: 12, marginTop: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                biz.businessLocation
              )}&output=embed`}
              allowFullScreen
            />
          )}
        </section>

        {/* Contacts */}
        <section
          style={{
            maxWidth: 700,
            margin: "0 auto 40px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            color: "#191919",
          }}
        >
          {biz.contactEmails && (
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <div style={{ fontWeight: "700", marginBottom: 8 }}>Email</div>
              {biz.contactEmails.split(",").map((mail, i) => (
                <a
                  key={i}
                  href={`mailto:${mail.trim()}`}
                  style={{
                    color: "#285090",
                    textDecoration: "underline",
                    marginBottom: 6,
                    wordBreak: "break-word",
                    fontSize: 15,
                  }}
                >
                  {mail.trim()}
                </a>
              ))}
            </div>
          )}
          {biz.contactPhones && (
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <div style={{ fontWeight: "700", marginBottom: 8 }}>Τηλ</div>
              {biz.contactPhones.split(",").map((phone, i) => (
                <span
                  key={i}
                  style={{
                    marginBottom: 6,
                    wordBreak: "break-word",
                    fontSize: 15,
                  }}
                >
                  {phone.trim()}
                </span>
              ))}
            </div>
          )}
          {biz.fax && (
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                fontSize: 15,
              }}
            >
              <div style={{ fontWeight: "700", marginBottom: 8 }}>Fax</div>
              <span>{biz.fax}</span>
            </div>
          )}
        </section>

        {/* Review form */}
        {auth.currentUser && (
          <section
            style={{
              maxWidth: 700,
              margin: "0 auto 40px",
              padding: 16,
              borderRadius: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              backgroundColor: "#fafafa",
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>
              Αφήστε Κριτική
            </h3>
            <form
              onSubmit={submitReview}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                Rating:
                <select
                  value={newReview.rating}
                  onChange={(e) => handleReviewChange("rating", e.target.value)}
                  style={{
                    padding: 8,
                    fontSize: 16,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    width: 80,
                  }}
                  required
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} ⭐
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Comment:
                <textarea
                  value={newReview.comment}
                  onChange={(e) => handleReviewChange("comment", e.target.value)}
                  rows={4}
                  style={{
                    padding: 8,
                    fontSize: 16,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    resize: "vertical",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  placeholder="Γράψτε την κριτική σας εδώ..."
                  required
                />
              </label>
              <button
                type="submit"
                disabled={submittingReview}
                style={{
                  backgroundColor: "#191919",
                  color: "#fff",
                  border: "none",
                  padding: "14px 50px",
                  borderRadius: 24,
                  fontSize: 18,
                  cursor: submittingReview ? "wait" : "pointer",
                  fontFamily: "'EB Garamond', serif",
                  fontWeight: 400,
                  alignSelf: "center",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) => {
                  if (!submittingReview) e.currentTarget.style.backgroundColor = "#444";
                }}
                onMouseLeave={(e) => {
                  if (!submittingReview) e.currentTarget.style.backgroundColor = "#191919";
                }}
              >
                {submittingReview ? "Αποστολή..." : "Υποβολή Κριτικής"}
              </button>
            </form>
          </section>
        )}

        {/* Reviews list */}
        {reviews.length > 0 && (
          <section
            style={{
              maxWidth: 700,
              margin: "0 auto 40px",
              userSelect: "text",
            }}
          >
            <h3 style={{ marginBottom: 16, fontWeight: 700, fontSize: 22 }}>
              Κριτικές Χρηστών
            </h3>
            {reviews.map((review) => (
              <article
                key={review.id}
                style={{
                  marginBottom: 20,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: "#f0f3f8",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#222",
                    marginBottom: 6,
                  }}
                >
                  {review.userName}
                </div>
                <div style={{ marginBottom: 8, fontSize: 18, color: "#444" }}>
                  {"⭐".repeat(review.rating)}{" "}
                  <span style={{ fontWeight: 400, color: "#888", fontSize: 14 }}>
                    {review.timestamp
                      ? new Date(review.timestamp.seconds * 1000).toLocaleDateString()
                      : ""}
                  </span>
                </div>
                <p style={{ fontSize: 16, color: "#333" }}>{review.comment}</p>
              </article>
            ))}
          </section>
        )}

        {/* Events */}
        {events.length > 0 && (
          <section
            style={{
              maxWidth: 700,
              margin: "0 auto 40px",
              background: "#e9f0f8",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: 22 }}>
              Εκδηλώσεις Επιχείρησης
            </h3>
            {events.map((event) => (
              <article
                key={event.id}
                style={{ marginBottom: 20 }}
              >
                <div style={{ fontWeight: 600, fontSize: 18 }}>{event.title}</div>
                <div style={{ fontSize: 16, color: "#444", marginBottom: 4 }}>{event.date}</div>
                <div style={{ fontSize: 15, color: "#555" }}>{event.description}</div>
                {event.imageURL && (
                  <img
                    src={event.imageURL}
                    alt={event.title}
                    style={{ width: "100%", maxHeight: 220, borderRadius: 8, marginTop: 8, objectFit: "cover" }}
                  />
                )}
                {auth.currentUser?.uid === id && (
                  <button
                    onClick={() => {
                      if (window.confirm("Θέλετε σίγουρα να διαγράψετε;")) deleteItem("events", event.id);
                    }}
                    style={{
                      marginTop: 8,
                      background: "#c92a2a",
                      color: "#fff",
                      border: "none",
                      padding: "8px 20px",
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Διαγραφή
                  </button>
                )}
              </article>
            ))}
          </section>
        )}

        {/* Offers */}
        {offers.length > 0 && (
          <section
            style={{
              maxWidth: 700,
              margin: "0 auto 40px",
              background: "#e5f1e7",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: 22 }}>
              Προσφορές Επιχείρησης
            </h3>
            {offers.map((offer) => (
              <article
                key={offer.id}
                style={{ marginBottom: 20 }}
              >
                <div style={{ fontWeight: 600, fontSize: 18 }}>{offer.title}</div>
                <div style={{ fontSize: 15, color: "#555" }}>{offer.description}</div>
                {offer.imageURL && (
                  <img
                    src={offer.imageURL}
                    alt={offer.title}
                    style={{ width: "100%", maxHeight: 220, borderRadius: 8, marginTop: 8, objectFit: "cover" }}
                  />
                )}
                {auth.currentUser?.uid === id && (
                  <button
                    onClick={() => {
                      if (window.confirm("Θέλετε σίγουρα να διαγράψετε;")) deleteItem("offers", offer.id);
                    }}
                    style={{
                      marginTop: 8,
                      background: "#c92a2a",
                      color: "#fff",
                      border: "none",
                      padding: "8px 20px",
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Διαγραφή
                  </button>
                )}
              </article>
            ))}
          </section>
        )}

        {/* Directions Button */}
        {biz.businessLocation && (
          <button
            onClick={() => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                biz.businessLocation
              )}`;
              window.open(url, "_blank");
            }}
            style={{
              backgroundColor: "#4285F4",
              color: "#fff",
              border: "none",
              padding: "12px 28px",
              borderRadius: 24,
              fontSize: 18,
              cursor: "pointer",
              fontFamily: "'EB Garamond', serif",
              marginBottom: 40,
              minWidth: 160,
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3367d6")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4285F4")}
          >
            Πώς θα έρθω εκεί
          </button>
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
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
            transition: "background-color 0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#444")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#191919")}
        >
          Επιστροφή στα αποτελέσματα
        </button>

      </main>

      {/* Modal */}
      {modal.visible && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "90%",
              textAlign: "center",
              fontFamily: "'EB Garamond', serif",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
          >
            <p style={{ marginBottom: 20, fontSize: 18 }}>{modal.message}</p>
            <button
              onClick={closeModal}
              style={{
                backgroundColor: "#191919",
                color: "#fff",
                border: "none",
                borderRadius: 24,
                padding: "12px 28px",
                fontSize: 16,
                cursor: "pointer",
                fontFamily: "'EB Garamond', serif",
              }}
            >
              Κλείσιμο
            </button>
          </div>
        </div>
      )}
    </>
  );
}
