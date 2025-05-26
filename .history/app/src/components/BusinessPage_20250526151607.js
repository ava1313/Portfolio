import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth, storage } from "../firebase";
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
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import Navbar from "./Navbar";
import "./style.css";

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  // Fetch user favorites
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

  // Toggle favorite business
  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) {
      alertPopup("Πρέπει να είστε συνδεδεμένος για να προσθέσετε στα αγαπημένα.");
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

  // Submit review
  const submitReview = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alertPopup("Πρέπει να είστε συνδεδεμένος για να αφήσετε κριτική.");
      return;
    }
    if (!newReview.comment.trim()) {
      alertPopup("Παρακαλώ γράψτε κάποιο σχόλιο.");
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
      const querySnapshot = await getDocs(q);
      const fetchedReviews = [];
      querySnapshot.forEach((doc) => {
        fetchedReviews.push({ id: doc.id, ...doc.data() });
      });
      setReviews(fetchedReviews);
    } catch (error) {
      console.error("Error submitting review:", error);
      alertPopup("Σφάλμα κατά την αποστολή της κριτικής.");
    }
    setSubmittingReview(false);
  };

  // Delete method (for events/offers)
  const deleteItem = async (type, itemId) => {
    if (!window.confirm("Θέλετε σίγουρα να διαγράψετε;")) return;
    setDeletingId(itemId);
    try {
      await deleteDoc(doc(db, type, itemId));
      if (type === "offers") setOffers((prev) => prev.filter((o) => o.id !== itemId));
      if (type === "events") setEvents((prev) => prev.filter((e) => e.id !== itemId));
    } catch (error) {
      alertPopup("Σφάλμα στη διαγραφή.");
      console.error(error);
    }
    setDeletingId("");
  };

  // Photo upload handler
  const onPhotoUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;
    if ((biz.photos?.length || 0) + files.length > 10) {
      alertPopup("Μπορείτε να ανεβάσετε μέχρι 10 φωτογραφίες.");
      return;
    }
    setUploading(true);
    let updatedPhotos = [...(biz.photos || [])];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `businesses/${id}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Upload error:", error);
              alertPopup("Σφάλμα κατά την αποστολή φωτογραφίας.");
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              updatedPhotos.push(downloadURL);
              resolve();
            }
          );
        });
      }

      // Update Firestore profile photos array
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        "profile.photos": updatedPhotos,
      });

      // Update local state
      setBiz((prev) => ({ ...prev, photos: updatedPhotos }));
      alertPopup("Οι φωτογραφίες ανέβηκαν επιτυχώς!", "success");
    } catch {
      // handled in uploadTask error listener
    }
    setUploading(false);
    setUploadProgress(0);
    // Reset file input manually if needed
    event.target.value = null;
  };

  // Photo delete handler
  const deletePhoto = async (url) => {
    if (!window.confirm("Θέλετε σίγουρα να διαγράψετε αυτή τη φωτογραφία;")) return;
    setUploading(true);
    try {
      // Delete from Firebase Storage
      const photoRef = ref(storage, url);
      await deleteObject(photoRef);

      // Remove from Firestore
      const updatedPhotos = (biz.photos || []).filter((p) => p !== url);
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        "profile.photos": updatedPhotos,
      });

      setBiz((prev) => ({ ...prev, photos: updatedPhotos }));
      alertPopup("Φωτογραφία διαγράφηκε.", "success");
    } catch (error) {
      console.error("Error deleting photo:", error);
      alertPopup("Σφάλμα κατά τη διαγραφή φωτογραφίας.");
    }
    setUploading(false);
  };

  // Custom popup alert replacing window.alert
  const alertPopup = (msg, type = "info") => {
    // Implement your popup UI here or use toast from previous code
    alert(msg);
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

  const isAdmin = auth.currentUser?.uid === id;
  const photos = biz.photos || [];

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
          padding: 20,
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
            marginBottom: 28,
            boxShadow: "0 2px 16px rgba(40,70,120,0.09)",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: 28,
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
            margin: "0 0 16px 0",
            textAlign: "center",
          }}
        >
          {biz.businessName}
        </h1>

        {/* Photos Section */}
        <section
          style={{
            width: "100%",
            maxWidth: 600,
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          <h2 style={{ marginBottom: 16 }}>Φωτογραφίες Επιχείρησης</h2>
          {photos.length === 0 && <p style={{ color: "#666" }}>Δεν υπάρχουν φωτογραφίες.</p>}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {photos.map((url, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
                }}
              >
                <img
                  src={url}
                  alt={`Φωτογραφία ${i + 1}`}
                  style={{
                    width: "100%",
                    height: 100,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {isAdmin && (
                  <button
                    onClick={() => deletePhoto(url)}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "rgba(0,0,0,0.6)",
                      border: "none",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      color: "#fff",
                      fontWeight: "700",
                      cursor: "pointer",
                      fontSize: 18,
                      lineHeight: "24px",
                      textAlign: "center",
                      padding: 0,
                    }}
                    title="Διαγραφή φωτογραφίας"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Upload button */}
          {isAdmin && photos.length < 10 && (
            <div style={{ textAlign: "center" }}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onPhotoUpload}
                disabled={uploading}
                style={{ display: "none" }}
                id="photo-upload-input"
              />
              <label
                htmlFor="photo-upload-input"
                style={{
                  cursor: uploading ? "not-allowed" : "pointer",
                  backgroundColor: uploading ? "#999" : "#191919",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: 24,
                  fontWeight: 600,
                  fontSize: 16,
                  display: "inline-block",
                  userSelect: "none",
                }}
              >
                {uploading
                  ? `Ανεβάζω... ${uploadProgress.toFixed(0)}%`
                  : `Ανέβασε φωτογραφίες (${photos.length}/10)`}
              </label>
            </div>
          )}
        </section>

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

        {/* Opening Hours */}
        {biz.openingHours && (
          <div
            style={{
              maxWidth: 600,
              margin: "20px auto",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              width: "100%",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              color: "#191919",
              textAlign: "center",
              marginBottom: 30,
            }}
          >
            <h3 style={{ marginBottom: 12, fontWeight: 700 }}>Ώρες Λειτουργίας</h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 15,
              }}
            >
              <tbody>
                {Object.entries(biz.openingHours).map(([day, hours]) => (
                  <tr key={day}>
                    <td
                      style={{
                        padding: 6,
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
                        padding: 6,
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
          </div>
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
            maxWidth: 600,
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
        </div>

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

            <label>
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
                  marginLeft: 8,
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
              </div>
            ))}
          </div>
        )}

        {/* Events Section */}
        {events.length > 0 && (
          <div
            style={{
              maxWidth: 600,
              width: "100%",
              marginBottom: 40,
              marginLeft: "auto",
              marginRight: "auto",
              background: "#f3f8fc",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: 22 }}>
              Εκδηλώσεις Επιχείρησης
            </h3>
            {events.map((event) => (
              <div key={event.id} style={{ marginBottom: 20 }}>
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
              </div>
            ))}
          </div>
        )}

        {/* Offers Section */}
        {offers.length > 0 && (
          <div
            style={{
              maxWidth: 600,
              width: "100%",
              marginBottom: 40,
              marginLeft: "auto",
              marginRight: "auto",
              background: "#f3f7f1",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: 22 }}>
              Προσφορές Επιχείρησης
            </h3>
            {offers.map((offer) => (
              <div key={offer.id} style={{ marginBottom: 20 }}>
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
              </div>
            ))}
          </div>
        )}

        {/* Directions Button */}
        {biz.businessLocation && (
          <button
            onClick={() => {
              if (!biz.businessLocation) return;
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
      </div>
    </>
  );
}
