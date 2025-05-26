// src/OffersPage.js
import React, { useEffect, useState } from "react";
import { collectionGroup, query, orderBy, getDocs } from "firebase/firestore";
import { db, auth, storage } from "../firebase";

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      getDocs(query(collectionGroup(db, "users"))) // pseudo: actually fetch user doc
        .then(snap => {
          // pull favorites array from users/{uid}
          const favs = snap.docs
            .find(d => d.id === user.uid)
            ?.data().favorites || [];
          setFavorites(favs);
        });
    }
  }, [user]);

  useEffect(() => {
    async function fetchOffers() {
      const q = query(collectionGroup(db, "offers"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, businessId: d.ref.parent.parent.id, ...d.data() }));
      // split favorites vs rest
      const favs = docs.filter(o => favorites.includes(o.businessId));
      const rest = docs.filter(o => !favorites.includes(o.businessId));
      setOffers([...favs, ...rest]);
    }
    fetchOffers();
  }, [favorites]);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Προσφορές</h1>
      {offers.map(o => (
        <div key={o.id} style={cardStyle}>
          <h2>{o.title}</h2>
          <p>{o.description}</p>
          {o.imageURL && <img src={o.imageURL} alt="" style={{ width: "100%", borderRadius: 8 }} />}
        </div>
      ))}
    </div>
  );
}

const cardStyle = {
  marginBottom: 24,
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
  backgroundColor: "#fff"
};
