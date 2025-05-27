import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
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
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import categories from "../data/categories";
import "./style.css";

const flattenCategories = () =>
  categories.flatMap((cat) => [cat.name, ...(cat.subcategories || [])]);

const businessTypes = [
  "Απλή Επιχείρηση",
  "Κυριλέ Επιχείρηση",
  "Εμπορική Επιχείρηση",
  "Νεοφυής Επιχείρηση",
  "Άλλη",
];
const libraries = ["places"];

export default function EventsPage() {
  // UI
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState({});
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", type: "info" });

  // MainPage-style filter states
  const [searchCategory, setSearchCategory] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchBusinessType, setSearchBusinessType] = useState("");
  const [dateOrder, setDateOrder] = useState("desc");

  // Google Maps autocomplete
  const autocompleteRef = useRef(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const onLoad = (autocomplete) => (autocompleteRef.current = autocomplete);
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      const address = place.formatted_address || place.name || "";
      setSearchLocation(address);
    }
  };

  // Live user state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => setUser(usr));
    return () => unsub();
  }, []);

  // Fetch all events & businesses
  useEffect(() => {
    fetchEventsAndBusinesses();
    // eslint-disable-next-line
  }, []);

  async function fetchEventsAndBusinesses() {
    setLoading(true);
    try {
      const q = query(collection(db, "events"));
      const snap = await getDocs(q);
      let data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Get business data for all events
      const uniqueBusinessIds = Array.from(
        new Set(data.map((evt) => evt.businessId).filter(Boolean))
      );
      const businessFetches = uniqueBusinessIds.map((bid) =>
        getDoc(doc(db, "users", bid)).then((snap) => ({
          id: bid,
          ...((snap.exists() && snap.data().profile) || {}),
          businessName:
            snap.exists() && snap.data().profile
              ? snap.data().profile.businessName
              : "Άγνωστη επιχείρηση",
          businessLogo:
            snap.exists() && snap.data().profile
              ? snap.data().profile.businessLogo
              : "/placeholder-logo.png",
          businessCategory:
            snap.exists() && snap.data().profile
              ? snap.data().profile.businessCategory
              : "",
          businessLocation:
            snap.exists() && snap.data().profile
              ? snap.data().profile.businessLocation
              : "",
          businessType:
            snap.exists() && snap.data().profile
              ? snap.data().profile.businessType
              : "",
        }))
      );
      const businessesArr = await Promise.all(businessFetches);
      const businessesMap = {};
      businessesArr.forEach((b) => {
        businessesMap[b.id] = b;
      });
      setBusinesses(businessesMap);

      // Attach business info to each event
      data = data.map((evt) => ({
        ...evt,
        _business: businessesMap[evt.businessId] || {},
      }));

      // Sort by date
      data.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateOrder === "asc" ? dateA - dateB : dateB - dateA;
      });

      setEvents(data);
    } catch (error) {
      console.error("Error fetching events or businesses:", error);
      showToast("Σφάλμα κατά την ανάκτηση των εκδηλώσεων.", "error");
    }
    setLoading(false);
  }

  // Toast helper
  function showToast(message, type = "info") {
    setToast({ open: true, message, type });
    setTimeout(() => setToast({ open: false, message: "", type: "info" }), 2500);
  }

  const toggleGoing = async (evt) => {
    if (!user)
      return showToast("Πρέπει να είστε συνδεδεμένος για να δηλώσετε συμμετοχή.", "error");
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
        isGoing
          ? "Δηλώσατε ότι δεν θα έρθετε."
          : "Δηλώσατε συμμετοχή στην εκδήλωση!",
        "success"
      );
    } catch (error) {
      console.error("Error updating attendance:", error);
      showToast("Σφάλμα κατά την ενημέρωση της συμμετοχής.", "error");
    }
  };

  // Copy business profile url to clipboard
  const copyLink = (businessId) => {
    const url = `${window.location.origin}/business/${businessId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => showToast("Σύνδεσμος επιχείρησης αντιγράφηκε!", "success"))
      .catch(() => showToast("Αποτυχία αντιγραφής συνδέσμου.", "error"));
  };

  // FILTER FUNCTION
  function eventMatches(event) {
    // Category filter
    if (
      searchCategory &&
      event._business.businessCategory &&
      !event._business.businessCategory
        .toLowerCase()
        .includes(searchCategory.toLowerCase())
    ) {
      return false;
    }
    // Location filter
    if (
      searchLocation &&
      event._business.businessLocation &&
      !event._business.businessLocation
        .toLowerCase()
        .includes(searchLocation.toLowerCase())
    ) {
      return false;
    }
    // Business type filter
    if (
      searchBusinessType &&
      event._business.businessType &&
      !event._business.businessType
        .toLowerCase()
        .includes(searchBusinessType.toLowerCase())
    ) {
      return false;
    }
    return true;
  }

  // SEARCH BUTTON HANDLER
  function handleEventSearch() {
    // Just triggers a re-render since we filter in render
    setEvents((old) => [...old]);
  }

  // Styles for card
  const cardStyle = {
    marginBottom: 24,
    padding: 18,
    borderRadius: 14,
    boxShadow: "0 1px 8px rgba(0,0,0,0.11)",
    backgroundColor: "#fff",
    marginTop: 22,
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
        <h1>Εκδηλώσεις</h1>

        {/* MainPage-style Search Bar */}
        <div className="actions" style={{ marginBottom: 18 }}>
          {/* Category */}
          <div className="input-group">
            <input
              type="text"
              aria-label="Αναζήτηση κατηγορίας"
              placeholder="Επιλέξτε κατηγορία ή πληκτρολογήστε..."
              value={searchCategory}
              onChange={e => setSearchCategory(e.target.value)}
              autoComplete="off"
            />
            {searchCategory &&
              flattenCategories()
                .filter(
                  cat =>
                    cat.toLowerCase().includes(searchCategory.toLowerCase()) &&
                    cat.toLowerCase() !== searchCategory.toLowerCase()
                ).length > 0 && (
                <ul className="category-dropdown">
                  {flattenCategories()
                    .filter(
                      cat =>
                        cat.toLowerCase().includes(searchCategory.toLowerCase()) &&
                        cat.toLowerCase() !== searchCategory.toLowerCase()
                    )
                    .map((cat, idx) => (
                      <li
                        key={idx}
                        onClick={() => setSearchCategory(cat)}
                        onMouseDown={e => e.preventDefault()}
                      >
                        {cat}
                      </li>
                    ))}
                </ul>
              )}
          </div>
          {/* Location */}
          <div className="input-group">
            {isLoaded ? (
              <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                <input
                  type="text"
                  placeholder="Τοποθεσία"
                  value={searchLocation}
                  onChange={e => setSearchLocation(e.target.value)}
                  aria-label="Τοποθεσία"
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                placeholder="Τοποθεσία"
                value={searchLocation}
                onChange={e => setSearchLocation(e.target.value)}
                aria-label="Τοποθεσία"
              />
            )}
          </div>
          {/* Business type */}
          <div className="input-group">
            <select
              aria-label="Φίλτρο τύπου επιχείρησης"
              value={searchBusinessType}
              onChange={e => setSearchBusinessType(e.target.value)}
            >
              <option value="">Επιλέξτε τύπο επιχείρησης</option>
              {businessTypes.map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          {/* Search icon */}
          <button
            className="search-icon"
            aria-label="Αναζήτηση"
            onClick={handleEventSearch}
          >
            <svg viewBox="0 0 30 30" width="22" height="22" aria-hidden="true">
              <circle cx="14" cy="14" r="10" stroke="black" strokeWidth="2.5" fill="none" />
              <line x1="26" y1="26" x2="20" y2="20" stroke="black" strokeWidth="2.5" />
            </svg>
          </button>
        </div>

        {/* Date order filter */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 8
        }}>
          <select
            value={dateOrder}
            onChange={e => setDateOrder(e.target.value)}
            style={{
              padding: "6px 12px",
              fontSize: 15,
              borderRadius: 8,
              border: "1.2px solid #191919",
              background: "#fff",
              color: "#191919"
            }}
          >
            <option value="desc">Νεότερες πρώτα</option>
            <option value="asc">Παλαιότερες πρώτα</option>
          </select>
        </div>

        {/* Loading / No Events / Events */}
        {loading ? (
          <div style={{ textAlign: "center", marginTop: 80 }}>Φόρτωση...</div>
        ) : events.filter(eventMatches).length === 0 ? (
          <div style={{ color: "#888", textAlign: "center" }}>Δεν υπάρχουν εκδηλώσεις.</div>
        ) : (
          events.filter(eventMatches).map((evt) => {
            const biz = evt._business || {};
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
                    onMouseEnter={e => (e.currentTarget.style.background = "#28324a")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#202b40")}
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
                  {/* "Θα έρθω" / "Δεν θα έρθω" */}
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
                    onMouseEnter={e =>
                      (e.currentTarget.style.background = going ? "#d03131" : "#0d9356")
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.background = going ? "#ff4242" : "#13b36e")
                    }
                  >
                    {going ? "Δεν θα έρθω" : "Θα έρθω"}{" "}
                    <span style={{ marginLeft: 2, fontWeight: 400, fontSize: 14 }}>
                      ({evt.attendees?.length || 0})
                    </span>
                  </button>
                  {/* Share button */}
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
