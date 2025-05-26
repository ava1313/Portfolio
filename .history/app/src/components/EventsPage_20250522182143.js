// src/EventsPage.js
import React, { useEffect, useState } from "react";
import { collectionGroup, query, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const q = query(collectionGroup(db, "events"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      setEvents(
        snap.docs.map((d) => ({
          id: d.id,
          businessId: d.ref.parent.parent.id, // business' userId
          ...d.data(),
        }))
      );
      setLoading(false);
    }
    fetchEvents();
  }, []);

  // Handle "I will go" button
  const toggleGoing = async (evt) => {
    if (!user) return alert("Πρέπει να είστε συνδεδεμένος για να δηλώσετε συμμετοχή.");
    const ref = doc(db, "users", evt.businessId, "events", evt.id);
    const currentAttendees = evt.attendees || [];
    const isGoing = currentAttendees.includes(user.uid);

    await updateDoc(ref, {
      attendees: isGoing
        ? arrayRemove(user.uid)
        : arrayUnion(user.uid),
    });

    setEvents((es) =>
      es.map((e) =>
        e.id === evt.id
          ? {
              ...e,
              attendees: isGoing
                ? currentAttendees.filter((u) => u !== user.uid)
                : [...currentAttendees, user.uid],
            }
          : e
      )
    );
  };

  // Handle "Share" button
  const copyLink = (businessId, id) =>
    navigator.clipboard
      .writeText(`${window.location.origin}/ekdiloseis/${businessId}/${id}`)
      .then(() => alert("Σύνδεσμος αντιγράφηκε!"));

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <h2>Φόρτωση...</h2>
      </div>
    );

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Εκδηλώσεις</h1>
      {events.length === 0 ? (
        <div style={{ color: "#888", textAlign: "center" }}>Δεν υπάρχουν εκδηλώσεις.</div>
      ) : (
        events.map((evt) => (
          <div key={evt.id} style={cardStyle}>
            <h2>{evt.title}</h2>
            <p>{evt.description}</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => toggleGoing(evt)}>
                {evt.attendees?.includes(user?.uid) ? "Δεν θα έρθω" : "Θα έρθω"} (
                {evt.attendees?.length || 0})
              </button>
              <button onClick={() => copyLink(evt.businessId, evt.id)}>Share</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const cardStyle = {
  marginBottom: 24,
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
  backgroundColor: "#fff",
};
