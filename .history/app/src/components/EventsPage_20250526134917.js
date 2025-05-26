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
        const q = query(collection(db, "events"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setEvents(data);

        const uniqueBusinessIds = Array.from(
          new Set(data.map((evt) => evt.businessId).filter(Boolean))
        );
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
            const isGoing = evt.attendees?.includes(user?.uid);
            return (
              <div key={evt.id} style={cardStyle}>
                {/* Business logo + name */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                  <img
                    src={biz.businessLogo || "/placeholder-logo.png"}
                    alt={biz.businessName || "Επιχείρηση"}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginRight: 14,
                      border: "1.5px solid #ececec",
                      background: "#f7f7f7",
                    }}
                  />
                  <div style={{ fontWeight: 700, fontSize: 19, color: "#24242d" }}>
                    {biz.businessName || "Άγνωστη επιχείρηση"}
                  </div>
                  <button
                    style={{
                      marginLeft: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 18px",
                      borderRadius: 18,
                      border: "1px solid #444",
                      background: "#fafbfc",
                      color: "#1a2332",
                      fontWeight: 600,
                      fontSize: 14.2,
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      transition: "background .2s, color .2s",
                    }}
                    onClick={() =>
                      evt.businessId && window.location.assign(`/business/${evt.businessId}`)
                    }
                  >
                    <svg width="18" height="18" fill="none" stroke="#1a2332" strokeWidth="2" viewBox="0 0 24 24" style={{marginRight:4}}>
                      <circle cx="12" cy="8" r="4" />
                      <path d="M3 21c0-4 4-7 9-7s9 3 9 7" />
                    </svg>
                    Προφίλ
                  </button>
                </div>
                {/* Event details */}
                <h2 style={{ margin: "0 0 4px 0", fontSize: 21 }}>{evt.title}</h2>
                <div style={{ color: "#777", fontSize: 15, marginBottom: 7 }}>
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
                  <p style={{ fontSize: 15, color: "#53545c", marginBottom: 9 }}>{evt.description}</p>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  {/* Θα έρθω / Δεν θα έρθω button */}
                  <button
                    onClick={() => toggleGoing(evt)}
                    style={{
                      background: isGoing ? "#ff5757" : "#1ec184",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 17px",
                      fontWeight: 600,
                      fontSize: 15,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 1px 4px rgba(30,30,30,0.07)",
                      cursor: "pointer",
                      transition: "background .2s",
                    }}
                  >
                    {isGoing ? (
                      <>
                        <svg width="19" height="19" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                        Δεν θα έρθω
                      </>
                    ) : (
                      <>
                        <svg width="19" height="19" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        Θα έρθω
                      </>
                    )}
                    <span style={{
                      background: "#fff",
                      color: isGoing ? "#ff5757" : "#1ec184",
                      marginLeft: 9,
                      borderRadius: "50%",
                      padding: "1px 8px",
                      fontSize: 14,
                      fontWeight: 600,
                      minWidth: 28,
                      textAlign: "center",
                    }}>
                      {evt.attendees?.length || 0}
                    </span>
                  </button>
                  {/* Share icon button */}
                  <button
                    title="Κοινοποίηση εκδήλωσης"
                    onClick={() => copyLink(evt.businessId, evt.id)}
                    style={{
                      border: "none",
                      background: "#f2f3f7",
                      color: "#19191e",
                      borderRadius: 8,
                      width: 41,
                      height: 41,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                      fontSize: 19,
                      padding: 0,
                      marginLeft: 4,
                    }}
                  >
                    <svg height="22" width="22" fill="none" stroke="#777" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" />
                    </svg>
                  </button>
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
  marginBottom: 26,
  padding: 20,
  borderRadius: 14,
  boxShadow: "0 2px 8px rgba(10,30,90,0.09)",
  backgroundColor: "#fff",
  fontFamily: "'Segoe UI', 'EB Garamond', serif",
  border: "1px solid #f3f3f3",
};

