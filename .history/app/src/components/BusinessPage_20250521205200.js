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
  query,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const mapRef = useRef(null);

  // Fetch business data and gallery images
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
      setGalleryImages(data.profile?.gallery || []);
      setLoading(false);
    }
    fetchBusiness();
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

  // Fetch Google reviews stored in Firestore subcollection
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

  // Upload gallery image
  const uploadGalleryImage = async (file) => {
    if (!file) return;
    if (!auth.currentUser) {
      alert("Πρέπει να είστε συνδεδεμένος για να ανεβάσετε εικόνες.");
      return;
    }
    setUploadingImage(true);
    try {
      const imageRef = ref(storage, `businessGallery/${id}/${file.name}_${Date.now()}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      const updatedGallery = [...galleryImages, url];
      setGalleryImages(updatedGallery);

      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        "profile.gallery": updatedGallery,
      });
    } catch (error) {
      console.error("Error uploading gallery image:", error);
      alert("Σφάλμα κατά την αποστολή της εικόνας.");
    }
    setUploadingImage(false);
  };

  // Open Google Maps directions
  const openDirections = () => {
    if (!biz.businessLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      biz.businessLocation
    )}`;
    window.open(url, "_blank");
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

        {/* Gallery Upload & Display */}
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto 40px",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
          }}
        >
          {galleryImages.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Gallery image ${idx + 1}`}
              style={{ width: 110, height: 110, borderRadius: 12, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            />
          ))}

          {/* Upload input */}
          {auth.currentUser && (
            <label
              htmlFor="galleryUpload"
              style={{
                width: 110,
                height: 110,
                borderRadius: 12,
                border: "2px dashed #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 28,
                color: "#888",
                fontWeight: "600",
                userSelect: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              title="Upload new image"
            >
              +
              <input
                type="file"
                id="galleryUpload"
                accept="image/*"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    await uploadGalleryImage(file);
                    e.target.value = ""; // reset input
                  }
                }}
                disabled={uploadingImage}
              />
            </label>
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

        {/* Directions Button */}
        {biz.businessLocation && (
          <button
            onClick={openDirections}
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
