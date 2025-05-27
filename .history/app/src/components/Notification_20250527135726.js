import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function Notification({ businessId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (!businessId) return;
    const q = query(
      collection(db, "users", businessId, "notifications"),
      orderBy("timestamp", "desc"),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      const notifs = [];
      let unread = 0;
      snap.forEach((d) => {
        const data = d.data();
        if (!data.read) unread++;
        notifs.push({ id: d.id, ...data });
      });
      setNotifications(notifs);
      setUnreadCount(unread);
      setLoading(false);
    });
    return () => unsub();
  }, [businessId]);

  // Mark all as read when modal opens
  useEffect(() => {
    if (open && notifications.some((n) => !n.read)) {
      notifications
        .filter((n) => !n.read)
        .forEach((n) => {
          updateDoc(doc(db, "users", businessId, "notifications", n.id), {
            read: true,
          }).catch(() => {});
        });
    }
    // eslint-disable-next-line
  }, [open]);

  // Καθαρισμός όλων των ειδοποιήσεων
  const handleClearAll = async () => {
    if (!window.confirm("Θέλεις σίγουρα να διαγράψεις όλες τις ειδοποιήσεις;")) return;
    setClearing(true);
    try {
      const notifCol = collection(db, "users", businessId, "notifications");
      const snap = await getDocs(notifCol);
      const deletions = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletions);
    } catch (e) {
      alert("Σφάλμα κατά τον καθαρισμό των ειδοποιήσεων.");
    }
    setClearing(false);
  };

  return (
    <>
      {/* Floating Notification Bell */}
      <button
        aria-label="Ειδοποιήσεις"
        style={{
          position: "fixed",
          right: 30,
          bottom: 100,
          zIndex: 11000,
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "#fff",
          color: "#191919",
          border: "2px solid #191919",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          cursor: "pointer",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ position: "relative", display: "inline-block" }}>
          <svg
            width={32}
            height={32}
            fill="none"
            stroke="#191919"
            strokeWidth="2.7"
            viewBox="0 0 24 24"
            style={{ verticalAlign: "middle" }}
          >
            <path d="M18 16v-5a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2Z" />
            <circle cx="12" cy="20" r="2" />
          </svg>
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -8,
                background: "#e53935",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                padding: "2px 7px",
                borderRadius: 18,
                border: "2px solid #fff",
                minWidth: 24,
                textAlign: "center",
                lineHeight: "16px",
                boxShadow: "0 1px 6px #ff000044",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.18)",
              zIndex: 11999,
            }}
          />
          <div
            style={{
              position: "fixed",
              right: 18,
              bottom: 110,
              zIndex: 12000,
              width: 360,
              maxWidth: "90vw",
              maxHeight: "64vh",
              background: "#fff",
              boxShadow: "0 6px 32px rgba(0,0,0,0.23)",
              borderRadius: 18,
              padding: "12px 0 6px 0",
              overflowY: "auto",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              animation: "notifmodalfadein .18s",
            }}
          >
            <div
              style={{
                padding: "8px 18px 6px 18px",
                borderBottom: "1.5px solid #f2f2f2",
                fontWeight: 700,
                fontSize: 18,
                color: "#191919",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              Ειδοποιήσεις
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  style={{
                    background: "#fff4de",
                    border: "1px solid #f2ca81",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#ad6a00",
                    borderRadius: 8,
                    padding: "3px 10px",
                    cursor: clearing ? "wait" : "pointer",
                    opacity: clearing ? 0.6 : 1,
                  }}
                  disabled={clearing}
                  onClick={handleClearAll}
                  title="Καθαρισμός όλων των ειδοποιήσεων"
                >
                  Διαγραφη όλων
                </button>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 26,
                    fontWeight: 600,
                    color: "#666",
                    cursor: "pointer",
                  }}
                  aria-label="Κλείσιμο"
                  onClick={() => setOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>
            {loading ? (
              <div style={{ padding: 24, textAlign: "center" }}>Φόρτωση...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 28, textAlign: "center", color: "#aaa" }}>
                Καμία ειδοποίηση.
              </div>
            ) : (
              notifications.map((notif, i) => (
                <NotificationRow notif={notif} key={notif.id || i} />
              ))
            )}
          </div>
          <style>{`
            @keyframes notifmodalfadein {
              from { opacity: 0; transform: translateY(32px);}
              to { opacity: 1; transform: translateY(0);}
            }
          `}</style>
        </>
      )}
    </>
  );
}

// Helper to render notification rows
function NotificationRow({ notif }) {
  const userDisplay = notif.username || notif.userId;
  let icon, msg;
  if (notif.type === "favorite") {
    icon = "⭐";
    msg = (
      <span>
        <b>{userDisplay}</b> πρόσθεσε την επιχείρησή σας στα αγαπημένα
      </span>
    );
  } else if (notif.type === "going") {
    icon = "🎟️";
    msg = (
      <span>
        <b>{userDisplay}</b> θα έρθει στην εκδήλωσή σας
      </span>
    );
    } else if (notif.type === "not-going") {
  icon = "🚫";
  msg = (
    <span>
      <b>{notif.username || notif.userId}</b> ακύρωσε τη συμμετοχή του στην εκδήλωσή σας
    </span>
  );
  } else if (notif.type === "review") {
    icon = "📝";
    msg = (
      <span>
        <b>{userDisplay}</b> έκανε κριτική στη σελίδα σας
      </span>
    );
  } else {
    icon = "🔔";
    msg = notif.message || "Νέα ειδοποίηση";
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 20px 10px 20px",
        borderBottom: "1px solid #f6f6f6",
        fontSize: 16,
        background: notif.read ? "#fff" : "#fffbea",
        color: "#232323",
      }}
    >
      <span style={{ fontSize: 24, minWidth: 28, textAlign: "center" }}>{icon}</span>
      <span>{msg}</span>
      <span style={{ marginLeft: "auto", fontSize: 13, color: "#aaa" }}>
        {notif.timestamp &&
          new Date(notif.timestamp.seconds * 1000).toLocaleString("el-GR", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}
      </span>
    </div>
  );
}
