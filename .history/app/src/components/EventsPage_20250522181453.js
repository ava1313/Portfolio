// src/EventsPage.js
import React, { useEffect, useState } from "react";
import { collectionGroup, query, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth, storage } from "./firebase";


export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    async function fetchEvents() {
      const q = query(collectionGroup(db, "events"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      setEvents(snap.docs.map(d => ({ id: d.id, businessId: d.ref.parent.parent.id, ...d.data() })));
    }
    fetchEvents();
  }, []);

  const toggleGoing = async (evt) => {
    if (!user) return alert("Πρέπει να είστε συνδεδεμένος για να δηλώσετε συμμετοχή.");
    const ref = doc(db, "users", evt.businessId, "events", evt.id);
    const isGoing = evt.attendees?.includes(user.uid);
    await updateDoc(ref, {
      attendees: isGoing
        ? arrayRemove(user.uid)
        : arrayUnion(user.uid)
    });
    setEvents(es =>
      es.map(e =>
        e.id === evt.id
          ? { ...e,
              attendees: isGoing
                ? e.attendees.filter(u => u !== user.uid)
                : [...(e.attendees||[]), user.uid]
            }
          : e
      )
    );
  };

  const copyLink = (id) =>
    navigator.clipboard.writeText(`${window.location.origin}/ekdiloseis/${id}`)
      .then(() => alert("Σύνδεσμος αντιγράφηκε!"));

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Εκδηλώσεις</h1>
      {events.map(evt => (
        <div key={evt.id} style={cardStyle}>
          <h2>{evt.title}</h2>
          <p>{evt.description}</p>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => toggleGoing(evt)}>
              {evt.attendees?.includes(user?.uid) ? "Δεν θα έρθω" : "Θα έρθω"} ({evt.attendees?.length||0})
            </button>
            <button onClick={() => copyLink(evt.id)}>Share</button>
          </div>
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
