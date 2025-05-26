import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "./Navbar";

const filterButtonStyle = {
  padding: "8px 18px",
  borderRadius: 8,
  border: "1.5px solid #191919",
  backgroundColor: "#fff",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 15,
  transition: "all 0.3s ease",
  userSelect: "none",
};

const filterButtonActiveStyle = {
  ...filterButtonStyle,
  backgroundColor: "#191919",
  color: "#fff",
  borderColor: "#191919",
};

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState({});
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [dateOrder, setDateOrder] = useState("desc"); // 'asc' or 'desc'
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", type: "info" });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => setUser(usr));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchBusinessesAndEvents() {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const bizMap = {};
        const catSet = new Set();

        usersSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.role === "business" && data.profile) {
            bizMap[docSnap.id] = { id: docSnap.id, ...data.profile };
            if (data.profile.businessCategory) {
              catSet.add(data.profile.businessCategory);
            }
          }
        });

        setBusinesses(bizMap);
        setCategories([...catSet].sort());

        // Fetch events ordered by timestamp DESC by default (will reorder in code)
        const snap = await getDocs(query(collection(db, "events"), orderBy("timestamp", "desc")));
        let allEvents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Filter by category if any
        if (filterCategory) {
          allEvents = allEvents.filter(
            (evt) =>
              evt.businessId &&
              bizMap[evt.businessId] &&
              bizMap[evt.businessId].businessCategory === filterCategory
          );
        }

        // Sort events by dateOrder
        allEvents.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return dateOrder === "asc" ? timeA - timeB : timeB - timeA;
        });

        setEvents(allEvents);
      } catch (error) {
        console.error("Error fetching events or businesses:", error);
        showToast("Σφάλμα κατά την ανάκτηση των εκδηλώσεων.", "error");
      }
      setLoading(false);
    }
    fetchBusinessesAndEvents();
  }, [filterCategory, dateOrder]);

  function showToast(message, type = "info") {
    setToast({ open: true, message, type });
    setTimeout(() => setToast({ open: false, message: "", type: "info" }), 2300);
  }

  const toggleGoing = async (evt) => {
    if (!user) return showToast("Πρέπει να είστε συνδεδεμένος για να δηλώσετε συμμετοχή.", "error");
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
      showToast(
        isGoing ? "Δηλώσατε ότι δεν θα έρθετε." : "Δηλώσατε συμμετοχή στην εκδήλωση!",
        "success"
      );
    } catch (error) {
      console.error("Error updating attendance:", error);
      showToast("Σφάλμα κατά την ενημέρωση της συμμετοχής.", "error");
    }
  };

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
        <h1>Εκδηλώσεις</h1>

        {/* Filters UI */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          {/* Category filter */}
          <div>
            <label htmlFor="categoryFilter" style={{ fontWeight: "600", marginRight: 10 }}>
              Κατηγορία:
            </label>
            <select
              id="categoryFilter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: 16,
                borderRadius: 8,
                border: "1px solid #ccc",
                cursor: "pointer",
                minWidth: 140,
              }}
            >
              <option value="">Όλες</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date order filter */}
          <div>
            <label style={{ fontWeight: "600", marginRight: 10 }}>Ταξινόμηση:</label>
            <button
              onClick={() => setDateOrder("asc")}
              style={dateOrder === "asc" ? filterButtonActiveStyle : filterButtonStyle}
            >
              Αύξουσα
            </button>
            <button
              onClick={() => setDateOrder("desc")}
              style={dateOrder === "desc" ? filterButtonActiveStyle : filterButtonStyle}
            >
              Φθίνουσα
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", marginTop: 80 }}>Φόρτωση...</div>
        ) : events.length === 0 ? (
          <div style={{ color: "#888", textAlign: "center" }}>Δεν υπάρχουν εκδηλώσεις.</div>
        ) : (
          events.map((evt) => {
            const biz = businesses[evt.businessId] || {};
            const going = evt.attendees?.includes(user?.uid);

            return (
              <div key={evt.id} style={cardStyle}>
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
                      evt.businessId && window.location.assign(`/business/${evt.businessId}`)
                    }
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#28324a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#202b40")}
                  >
                    Προφίλ Επιχείρησης
                  </button>
                </div>
                {/* Event details */}
                <h2 style={{ margin: "0 0 7px 0" }}>{evt.title}</h2>
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
                  <p style={{ fontSize: 15, color: "#555", margin: "10px 0 0 0" }}>
                    {evt.description}
                  </p>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button
                    onClick={() => toggleGoing(evt)}
                    style={{
                      background: going ? "#ff4242" : "#13b36e",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 15,
                      padding: "8px 24px",
                      minWidth: 110,
                      boxShadow: going
                        ? "0 2px 9px #ff535346"
                        : "0 2px 9px #13b36e46",
                      cursor: "pointer",
                      transition: "background .18s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = going ? "#d03131" : "#0d9356")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = going ? "#ff4242" : "#13b36e")
                    }
                  >
                    {going ? "Δεν θα έρθω" : "Θα έρθω"}{" "}
                    <span style={{ marginLeft: 2, fontWeight: 400, fontSize: 14 }}>
                      ({evt.attendees?.length || 0})
                    </span>
                  </button>

                  <button
                    onClick={() => copyLink(evt.businessId)}
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === "error" && (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
