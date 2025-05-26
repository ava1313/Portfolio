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
  const [deletingId, setDeletingId] = useState("");

  // Modal state
  const [modal, setModal] = useState({ visible: false, message: "" });

  // Show modal helper
  const showModal = (message) => setModal({ visible: true, message });
  const closeModal = () => setModal({ visible: false, message: "" });

  // Fetch business data
  useEffect(() => {
    async function fetchBusiness() {
      setLoading(true);
      try {
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
      } catch (error) {
        showModal("Σφάλμα κατά τη φόρτωση της επιχείρησης.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchBusiness();
  }, [id]);

  // Fetch events
  useEffect(() => {
    if (!id) return;
    const fetchEvents = async () => {
      try {
        const eventsCol = collection(db, "events");
        const q = query(eventsCol, where("businessId", "==", id), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedEvents = [];
        querySnapshot.forEach((doc) => fetchedEvents.push({ id: doc.id, ...doc.data() }));
        setEvents(fetchedEvents);
      } catch (error) {
        showModal("Σφάλμα κατά τη φόρτωση των εκδηλώσεων.");
        console.error(error);
      }
    };
    fetchEvents();
  }, [id]);

  // Fetch offers
  useEffect(() => {
    if (!id) return;
    const fetchOffers = async () => {
      try {
        const offersCol = collection(db, "offers");
        const q = query(offersCol, where("businessId", "==", id), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedOffers = [];
        querySnapshot.forEach((doc) => fetchedOffers.push({ id: doc.id, ...doc.data() }));
        setOffers(fetchedOffers);
      } catch (error) {
        showModal("Σφάλμα κατά τη φόρτωση των προσφορών.");
        console.error(error);
      }
    };
    fetchOffers();
  }, [id]);

  // Fetch favorites
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((snap) => {
        if (snap.exists()) setFavorites(snap.data().favorites || []);
      }).catch(console.error);
    }
  }, []);

  // Fetch reviews
  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      try {
        const reviewsCol = collection(db, "users", id, "reviews");
        const q = query(reviewsCol, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedReviews = [];
        querySnapshot.forEach((doc) => fetchedReviews.push({ id: doc.id, ...doc.data() }));
        setReviews(fetchedReviews);
      } catch (error) {
        showModal("Σφάλμα κατά τη φόρτωση των κριτικών.");
        console.error(error);
      }
    };
    fetchReviews();
  }, [id]);

  // Toggle favorite business
  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) {
      showModal("Πρέπει να είστε συνδεδεμένος για να προσθέσετε στα αγαπημένα.");
      return;
    }
    const userRef = doc(db, "users", user.uid);
    let updatedFavorites;
    try {
      if (favorites.includes(id)) {
        updatedFavorites = favorites.filter((fid) => fid !== id);
      } else {
        updatedFavorites = [...favorites, id];
      }
      await updateDoc(userRef, { favorites: updatedFavorites });
      setFavorites(updatedFavorites);
    } catch (error) {
      showModal("Σφάλμα κατά την ενημέρωση των αγαπημένων.");
      console.error(error);
    }
  };

  // Handle review input change
  const handleReviewChange = (field, value) => {
    setNewReview((prev) => ({ ...prev, [field]: value }));
  };

  // Submit a new review
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
      // Refresh reviews after submit
      const q = query(reviewsCol, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedReviews = [];
      querySnapshot.forEach((doc) => fetchedReviews.push({ id: doc.id, ...doc.data() }));
      setReviews(fetchedReviews);
    } catch (error) {
      showModal("Σφάλμα κατά την αποστολή της κριτικής.");
      console.error(error);
    }
    setSubmittingReview(false);
  };

  // Delete event or offer
  const deleteItem = async (type, itemId) => {
    if (!window.confirm("Θέλετε σίγουρα να διαγράψετε;")) return;
    setDeletingId(itemId);
    try {
      await deleteDoc(doc(db, type, itemId));
      if (type === "offers") setOffers((prev) => prev.filter((o) => o.id !== itemId));
      if (type === "events") setEvents((prev) => prev.filter((e) => e.id !== itemId));
    } catch (error) {
      showModal("Σφάλμα στη διαγραφή.");
      console.error(error);
    }
    setDeletingId("");
  };

  if (loading) return (
    <>
      <Navbar />
      <div style={{ textAlign: "center", marginTop: 80, fontSize: 18 }}>Φόρτωση...</div>
    </>
  );

  if (!biz) return (
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

  // Calculate average rating for this business reviews
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <>
      <Navbar />

      <main
        style={{
          maxWidth: 700,
          margin: "40px auto 80px",
          fontFamily: "'EB Garamond', serif",
          color: "#191919",
          backgroundColor: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "24px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          position: "relative",
          userSelect: "none",
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
            top: 20,
            right: 20,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 30,
            color: favorites.includes(id) ? "#e63946" : "#ccc",
            transition: "color 0.3s",
            zIndex: 20,
          }}
          title={favorites.includes(id) ? "Αφαίρεση από αγαπημένα" : "Προσθήκη στα αγαπημένα"}
        >
          {favorites.includes(id) ? "❤️" : "🤍"}
        </button>

        {/* Business Header */}
        <header
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
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
              boxShadow: "0 2px 16px rgba(40,70,120,0.09)",
            }}
            onError={(e) => (e.target.src = "/placeholder-logo.png")}
          />

          {/* Name and rating */}
          <div style={{ flexGrow: 1, minWidth: 260 }}>
            <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 12, textAlign: "center" }}>
              {biz.businessName}
            </h1>

            {avgRating ? (
              <div
                style={{
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#f39c12",
                  marginBottom: 12,
                  userSelect: "none",
                }}
                title={`Μέση αξιολόγηση: ${avgRating} από ${reviews.length} κριτικές`}
              >
                {"⭐".repeat(Math.floor(avgRating))}{" "}
                {avgRating % 1 >= 0.5 ? "⭐" : ""}
                <span style={{ color: "#444", fontWeight: "normal", marginLeft: 8, fontSize: 16 }}>
                  ({reviews.length} κριτικές)
                </span>
              </div>
            ) : (
              <div style={{ textAlign: "center", fontSize: 18, color: "#777", marginBottom: 12 }}>
                Δεν υπάρχουν κριτικές ακόμα
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
                  lineHeight: 1.5,
                }}
              >
                {biz.companyDescription}
              </p>
            )}
          </div>
        </header>

        {/* Opening Hours */}
        {biz.openingHours && (
          <section
            style={{
              marginTop: 24,
              backgroundColor: "#f9fafb",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              padding: 20,
              fontSize: 15,
              color: "#191919",
            }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
              Ώρες Λειτουργίας
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                margin: "0 auto",
                maxWidth: 500,
              }}
            >
              <tbody>
                {Object.entries(biz.openingHours).map(([day, hours]) => (
                  <tr key={day}>
                    <td
                      style={{
                        padding: 8,
                        textTransform: "capitalize",
                        fontWeight: "600",
                        borderBottom: "1px solid #ddd",
                        width: "40%",
                        textAlign: "left",
                      }}
                    >
                      {day}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #ddd",
                        textAlign: "right",
                      }}
                    >
                      {hours}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Location */}
        <div
          style={{
            marginTop: 32,
            fontSize: 17,
            color: "#666",
            textAlign: "center",
            userSelect: "text",
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
              marginTop: 20,
              marginBottom: 32,
            }}
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              biz.businessLocation
            )}&output=embed`}
            allowFullScreen
          />
        )}

        {/* Contacts */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            maxWidth: 600,
            margin: "0 auto 48px",
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

        {/* Review Submission */}
        {auth.currentUser && (
          <form
            onSubmit={submitReview}
            style={{
              maxWidth: 600,
              margin: "0 auto 40px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 22 }}>Αφήστε Κριτική</h3>

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
        )}

        {/* Existing Reviews */}
        {reviews.length > 0 && (
          <section
            style={{
              maxWidth: 600,
              width: "100%",
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
                <div style={{ marginBottom: 6 }}>
                  {"⭐".repeat(review.rating)}{" "}
                  <span style={{ color: "#888" }}>
                    -{" "}
                    {review.timestamp
                      ? new Date(review.timestamp.seconds * 1000).toLocaleDateString()
                      : ""}
                  </span>
                </div>
                <div style={{ fontSize: 15, color: "#555" }}>{review.comment}</div>
              </article>
            ))}
          </section>
        )}

        {/* EVENTS */}
        {events.length > 0 && (
          <section
            style={{
              maxWidth: 600,
              width: "100%",
              margin: "0 auto 40px",
              background: "#f3f8fc",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: 22 }}>
              Εκδηλώσεις Επιχείρησης
            </h3>
            {events.map((event) => (
              <article key={event.id} style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 18 }}>{event.title}</div>
                <div style={{ fontSize: 16, color: "#444", marginBottom: 4 }}>{event.date}</div>
                <div style={{ fontSize: 15, color: "#555" }}>{event.description}</div>
                {event.imageURL && (
                  <img
                    src={event.imageURL}
                    alt={event.title}
                    style={{
                      width: "100%",
                      maxHeight: 220,
                      borderRadius: 8,
                      marginTop: 8,
                      objectFit: "cover",
                    }}
                  />
                )}
                {auth.currentUser?.uid === id && (
                  <button
                    onClick={() => deleteItem("events", event.id)}
                    disabled={deletingId === event.id}
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
                    {deletingId === event.id ? "Διαγραφή..." : "Διαγραφή"}
                  </button>
                )}
              </article>
            ))}
          </section>
        )}

        {/* OFFERS */}
        {offers.length > 0 && (
          <section
            style={{
              maxWidth: 600,
              width: "100%",
              margin: "0 auto 40px",
              background: "#f3f7f1",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: 22 }}>
              Προσφορές Επιχείρησης
            </h3>
            {offers.map((offer) => (
              <article key={offer.id} style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 18 }}>{offer.title}</div>
                <div style={{ fontSize: 15, color: "#555" }}>{offer.description}</div>
                {offer.imageURL && (
                  <img
                    src={offer.imageURL}
                    alt={offer.title}
                    style={{
                      width: "100%",
                      maxHeight: 220,
                      borderRadius: 8,
                      marginTop: 8,
                      objectFit: "cover",
                    }}
                  />
                )}
                {auth.currentUser?.uid === id && (
                  <button
                    onClick={() => deleteItem("offers", offer.id)}
                    disabled={deletingId === offer.id}
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
                    {deletingId === offer.id ? "Διαγραφή..." : "Διαγραφή"}
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
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
              boxShadow: "0 0 12px rgba(0,0,0,0.3)",
              cursor: "default",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ marginBottom: 20 }}>{modal.message}</p>
            <button
              onClick={closeModal}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "#191919",
                color: "#fff",
                fontWeight: "600",
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
