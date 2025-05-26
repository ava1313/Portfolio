import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "./Navbar";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState({});
  const [user, setUser] = useState(null);

  // Live user state sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => setUser(usr));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchEventsAndBusinesses() {
      setLoading(true);
      try {
        // Fetch events
        const q = query(collection(db, "events"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setEvents(data);

        // Collect all unique businessIds
        const uniqueBusinessIds = Array.from(
          new Set(data.map((evt) => evt.businessId).filter(Boolean))
        );
        // Fetch all businesses in parallel
        const businessFetches = uniqueBusinessIds.map((bid) =>
          getDoc(doc(db, "users", bid)).then((snap) => ({
            id: bid,
            ...((snap.exists() && snap.data().profile) || {}),
            // Fallback for no profile object
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
        // Convert to map for easy access
        const businessesMap = {};
        businessesArr.forEach((b) => {
          businessesMap[b.id] = b;
        });
        setBusinesses(businessesMap);
      } catch (error) {
        console.error("Error fetching events or businesses:", error);
        alert("Σφάλμα κατά την ανάκτηση των εκδηλώσεων.");
      }
      setLoading(false);
    }
    fetchEventsAndBusinesses();
  }, []);

  const toggleGoing = async (evt) => {
    if (!user) return alert("Πρέπει να είστε συνδεδεμένος για να δηλώσετε συμμετοχή.");
    const ref = doc(db, "events", evt.id);
    const currentAttendees = evt.attendees || [];
    const isGoing = currentAttendees.includes(user.uid);

    try {
      await updateDoc(ref, {
        attendees: isGoing ? arrayRemove(user.uid) : arrayUnion(user.uid),
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
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert("Σφάλμα κατά την ενημέρωση της συμμετοχής.");
    }
  };

  const copyLink = (businessId, id) => {
    navigator.clipboard
      .writeText(`${window.location.origin}/ekdiloseis/${businessId}/${id}`)
      .then(() => alert("Σύνδεσμος αντιγράφηκε!"))
      .catch(() => alert("Αποτυχία αντιγραφής συνδέσμου."));
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
        <h1>Εκδηλώσεις</h1>
        {loading ? (
          <div style={{ textAlign: "center", marginTop: 80 }}>Φόρτωση...</div>
        ) : events.length === 0 ? (
          <div style={{ color: "#888", textAlign: "center" }}>Δεν υπάρχουν εκδηλώσεις.</div>
        ) : (
          events.map((evt) => {
            const biz = businesses[evt.businessId] || {};
            return (
              <div key={evt.id} style={cardStyle}>
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
                    onClick={() =>
                      evt.businessId && window.location.assign(`/business/${evt.businessId}`)
                    }
                  >
                    Προφίλ Επιχείρησης
                  </button>
                </div>
                {/* Event details */}
                <h2 style={{ margin: 0 }}>{evt.title}</h2>
                <div style={{ color: "#777", fontSize: 15, marginBottom: 2 }}>
                  {evt.date && (
                    <span>
                      <b>Ημ/νία:</b> {evt.date} &nbsp;
                    </span>
                  )}
                  {evt.startTime && evt.endTime && (
                    <span>
                      <b>Ώρες:</b> {evt.startTime} - {evt.endTime}
                    </span>
                  )}
                </div>
                {evt.description && (
                  <p style={{ fontSize: 15, color: "#555" }}>{evt.description}</p>
                )}
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => toggleGoing(evt)}>
                    {evt.attendees?.includes(user?.uid)
                      ? "Δεν θα έρθω"
                      : "Θα έρθω"}{" "}
                    ({evt.attendees?.length || 0})
                  </button>
                  <button onClick={() => copyLink(evt.businessId, evt.id)}>Share</button>
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
