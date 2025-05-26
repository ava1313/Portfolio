import React, { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "./Navbar";

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState({});
  const [toast, setToast] = useState({ open: false, message: "", type: "info" });

  useEffect(() => {
    async function fetchOffersAndBusinesses() {
      setLoading(true);
      try {
        // Fetch offers
        const q = query(collection(db, "offers"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          businessId: doc.data().businessId,
          ...doc.data(),
        }));
        setOffers(data);

        // Unique businessIds
        const uniqueBusinessIds = Array.from(
          new Set(data.map((offer) => offer.businessId).filter(Boolean))
        );
        // Batch fetch all businesses
        const businessFetches = uniqueBusinessIds.map((bid) =>
          getDoc(doc(db, "users", bid)).then((snap) => ({
            id: bid,
            ...((snap.exists() && snap.data().profile) || {}),
            businessName: snap.exists() && snap.data().profile
              ? snap.data().profile.businessName
              : snap.exists() && snap.data().businessName
                ? snap.data().businessName
                : "Άγνωστη επιχείρηση",
            businessLogo: snap.exists() && snap.data().profile
              ? snap.data().profile.businessLogo
              : "/placeholder-logo.png",
          }))
        );
        const businessesArr = await Promise.all(businessFetches);
        const businessesMap = {};
        businessesArr.forEach((b) => {
          businessesMap[b.id] = b;
        });
        setBusinesses(businessesMap);
      } catch (error) {
        console.error("Error fetching offers or businesses:", error);
        showToast("Σφάλμα κατά την ανάκτηση των προσφορών.", "error");
      }
      setLoading(false);
    }

    fetchOffersAndBusinesses();
    // eslint-disable-next-line
  }, []);

  function showToast(message, type = "info") {
    setToast({ open: true, message, type });
    setTimeout(() => setToast({ open: false, message: "", type: "info" }), 2300);
  }

  // Copy business page url, not offer url
  const copyLink = (businessId) => {
    const url = `${window.location.origin}/business/${businessId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => showToast("Σύνδεσμος επιχείρησης αντιγράφηκε!", "success"))
      .catch(() => showToast("Αποτυχία αντιγραφής συνδέσμου.", "error"));
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
        <h1>Προσφορές</h1>
        {loading ? (
          <div style={{ textAlign: "center", marginTop: 80 }}>Φόρτωση...</div>
        ) : offers.length === 0 ? (
          <div style={{ color: "#888", textAlign: "center" }}>Δεν υπάρχουν προσφορές.</div>
        ) : (
          offers.map((offer) => {
            const biz = businesses[offer.businessId] || {};
            return (
              <div key={offer.id} style={cardStyle}>
                {/* Business logo + name */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                  <img
                    src={biz.businessLogo || "/placeholder-logo.png"}
                    alt={biz.businessName || "Επιχείρηση"}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      objectFit: "cover",
                      marginRight: 14,
                      border: "1.5px solid #e7e7e7",
                      background: "#f7f7f7",
                    }}
                  />
                  <div style={{ fontWeight: 600, fontSize: 17, flex: 1 }}>
                    {biz.businessName || "Άγνωστη επιχείρηση"}
                  </div>
                  <button
                    style={{
                      marginLeft: 16,
                      padding: "6px 13px",
                      borderRadius: 9,
                      border: "none",
                      background: "#202b40",
                      color: "#fff",
                      fontWeight: 500,
                      fontSize: 14,
                      boxShadow: "0 1px 4px #d1d9e6a0",
                      cursor: "pointer",
                      transition: "background .18s",
                    }}
                    onClick={() =>
                      offer.businessId && window.location.assign(`/business/${offer.businessId}`)
                    }
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#28324a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#202b40")}
                  >
                    Προφίλ Επιχείρησης
                  </button>
                </div>
                {/* Offer details */}
                <h2 style={{ margin: "0 0 7px 0" }}>{offer.title}</h2>
                {offer.description && (
                  <p style={{ fontSize: 15, color: "#555", margin: "10px 0 0 0" }}>
                    {offer.description}
                  </p>
                )}
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
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  {/* Share button */}
                  <button
                    onClick={() => copyLink(offer.businessId)}
                    style={{
                      background: "#eee",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 500,
                      color: "#191919",
                      padding: "8px 18px",
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      boxShadow: "0 1px 4px #d6d6d6a6",
                      gap: 7,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#202b40"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Toast popup */}
      {toast.open && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 34,
            transform: "translateX(-50%)",
            minWidth: 210,
            maxWidth: 360,
            padding: "13px 26px",
            background:
              toast.type === "error"
                ? "#ff5353"
                : toast.type === "success"
                ? "#13b36e"
                : "#343f54",
            color: "#fff",
            borderRadius: 17,
            fontWeight: 600,
            fontSize: 16.5,
            letterSpacing: "0.03em",
            boxShadow: "0 2px 18px rgba(0,0,0,0.18)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "toastIn 0.18s",
          }}
        >
          {toast.type === "success" && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === "error" && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}
      {/* Toast animation */}
      <style>
        {`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(25px);}
          to { opacity: 1; transform: translateX(-50%) translateY(0);}
        }
        `}
      </style>
    </>
  );
}

const cardStyle = {
  marginBottom: 24,
  padding: 18,
  borderRadius: 14,
  boxShadow: "0 1px 8px rgba(0,0,0,0.11)",
  backgroundColor: "#fff",
  marginTop: 22,
};
