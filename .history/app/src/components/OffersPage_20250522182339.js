// src/components/OffersPage.js
import React, { useEffect, useState } from "react";
import {
  collectionGroup,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "./Navbar";

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOffers() {
      setLoading(true);
      try {
        const q = query(collectionGroup(db, "offers"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          businessId: d.ref.parent.parent.id,
          ...d.data(),
        }));
        setOffers(data);
      } catch (error) {
        console.error("Error fetching offers:", error);
        alert("Σφάλμα κατά την ανάκτηση των προσφορών.");
      }
      setLoading(false);
    }
    fetchOffers();
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
          offers.map((offer) => (
            <div key={offer.id} style={cardStyle}>
              <h2>{offer.title}</h2>
              <p>{offer.description}</p>
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
          ))
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
