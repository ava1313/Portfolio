import React, { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "./Navbar";

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState({});

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
        alert("Σφάλμα κατά την ανάκτηση των προσφορών.");
      }
      setLoading(false);
    }

    fetchOffersAndBusinesses();
  }, []);

  const copyLink = (businessId, id) => {
    navigator.clipboard
      .writeText(`${window.location.origin}/prospores/${businessId}/${id}`)
      .then(() => alert("Σύνδεσμος αντιγράφηκε!"))
      .catch(() => alert("Αποτυχία αντιγραφής συνδέσμου."));
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
                <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                  <img
                    src={biz.businessLogo || "/placeholder-logo.png"}
                    alt={biz.businessName || "Επιχείρηση"}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 16,
                      objectFit: "cover",
                      marginRight: 12,
                      border: "1.5px solid #e7e7e7",
                      background: "#f7f7f7",
                    }}
                  />
                  <div style={{ fontWeight: 600, fontSize: 18 }}>
                    {biz.businessName || "Άγνωστη επιχείρηση"}
                  </div>
                  <button
                    style={{
                      marginLeft: 18,
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: "1px solid #191919",
                      background: "#fafafa",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                    onClick={() => offer.businessId && window.location.assign(`/business/${offer.businessId}`)}
                  >
                    Προφίλ Επιχείρησης
                  </button>
                </div>
                {/* Offer details */}
                <h2 style={{ margin: 0 }}>{offer.title}</h2>
                {offer.description && (
                  <p style={{ fontSize: 15, color: "#555" }}>{offer.description}</p>
                )}
                {offer.imageURL && (
                  <img
                    src={offer.imageURL}
                    alt={offer.title}
                    style={{ width: "100%", maxHeight: 220, borderRadius: 8, marginTop: 8, objectFit: "cover" }}
                  />
                )}
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => copyLink(offer.businessId, offer.id)}>Share</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

const cardStyle = {
  marginBottom: 24,
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
  backgroundColor: "#fff",
};
