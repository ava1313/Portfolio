import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// NOTIFICATION BELL + MODAL FOR BUSINESS ACCOUNTS
function NotificationsBell({ businessId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Live notifications from Firestore
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

  // Modal style
  const modalStyle = {
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
  };

  return (
    <>
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
          <div style={modalStyle}>
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
              }}
            >
              Ειδοποιήσεις
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

function NotificationRow({ notif }) {
  let icon, msg;
  if (notif.type === "favorite") {
    icon = "⭐";
    msg = (
      <span>
        <b>{notif.userId}</b> πρόσθεσε την επιχείρησή σας στα αγαπημένα
      </span>
    );
  } else if (notif.type === "going") {
    icon = "🎟️";
    msg = (
      <span>
        <b>{notif.userId}</b> θα έρθει στην εκδήλωσή σας
      </span>
    );
  } else if (notif.type === "review") {
    icon = "📝";
    msg = (
      <span>
        <b>{notif.userId}</b> έκανε κριτική στη σελίδα σας
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

// MAIN NAVBAR COMPONENT
export default function Navbar() {
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("offers");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserRole(null);
        setUserId(null);
        setLoadingRole(false);
        return;
      }
      setUserId(user.uid);
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setUserRole(null);
      }
      setLoadingRole(false);
    });
    return () => unsubscribe();
  }, []);

  const buttonStyle = {
    background: "#fff",
    borderRadius: "50%",
    border: "3px solid #000",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  };

  const navItemStyle = {
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    outline: "none",
    userSelect: "none",
  };

  const labelStyle = {
    fontSize: 12,
    whiteSpace: "nowrap",
    color: "#000",
  };

  const openCreateModal = () => {
    setModalType("offers");
    setFormData({
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
    });
    setModalOpen(true);
  };

  const handleSwitchType = (type) => {
    setModalType(type);
    setFormData({
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
    });
  };

  const handleChange = (e) => {
    setFormData((fd) => ({ ...fd, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) return alert("Πρέπει να είστε συνδεδεμένος.");

    if (modalType === "offers") {
      if (!formData.title.trim()) return alert("Συμπλήρωσε το όνομα προσφοράς.");

      setSubmitting(true);
      try {
        const userId = auth.currentUser.uid;
        const colRef = collection(db, "offers");
        await addDoc(colRef, {
          title: formData.title.trim(),
          description: formData.description.trim() || "",
          timestamp: serverTimestamp(),
          businessId: userId,
        });

        alert("Προσφορά δημιουργήθηκε!");
        setModalOpen(false);
        navigate("/prospores");
      } catch (err) {
        console.error("Error creating offer:", err.code, err.message);
        alert(`Σφάλμα κατά τη δημιουργία: ${err.message}`);
      }
      setSubmitting(false);
    }

    if (modalType === "events") {
      if (!formData.title.trim()) return alert("Συμπλήρωσε το όνομα εκδήλωσης.");
      if (!formData.date.trim()) return alert("Συμπλήρωσε ημερομηνία εκδήλωσης.");
      if (!formData.startTime.trim()) return alert("Συμπλήρωσε ώρα έναρξης.");
      if (!formData.endTime.trim()) return alert("Συμπλήρωσε ώρα λήξης.");

      setSubmitting(true);
      try {
        const userId = auth.currentUser.uid;
        const colRef = collection(db, "events");
        await addDoc(colRef, {
          title: formData.title.trim(),
          description: formData.description.trim() || "",
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          timestamp: serverTimestamp(),
          businessId: userId,
          attendees: [],
        });

        alert("Εκδήλωση δημιουργήθηκε!");
        setModalOpen(false);
        navigate("/ekdiloseis");
      } catch (err) {
        console.error("Error creating event:", err.code, err.message);
        alert(`Σφάλμα κατά τη δημιουργία: ${err.message}`);
      }
      setSubmitting(false);
    }
  };

  const BurgerIcon = ({ open, onClick }) => (
    <button
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        width: 40,
        height: 32,
        boxSizing: "content-box",
      }}
    >
      <span
        style={{
          display: "block",
          width: 28,
          height: 4,
          backgroundColor: open ? "#191919" : "#000",
          borderRadius: 2,
          transform: open ? "rotate(45deg) translate(6px, 6px)" : "none",
          transition: "all 0.3s ease",
          transformOrigin: "center",
        }}
      />
      <span
        style={{
          display: "block",
          width: 28,
          height: 4,
          backgroundColor: open ? "transparent" : "#000",
          transition: "all 0.3s ease",
        }}
      />
      <span
        style={{
          display: "block",
          width: 28,
          height: 4,
          backgroundColor: open ? "#191919" : "#000",
          borderRadius: 2,
          transform: open ? "rotate(-45deg) translate(6px, -6px)" : "none",
          transition: "all 0.3s ease",
          transformOrigin: "center",
        }}
      />
    </button>
  );

  const LeftNavItems = () => (
    <div
      style={{
        display: "flex",
        gap: 48,
        alignItems: "center",
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          navigate("/businessesmap");
          setMobileMenuOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            navigate("/businessesmap");
            setMobileMenuOpen(false);
          }
        }}
        aria-label="Χάρτης Επιχειρήσεων"
        style={navItemStyle}
      >
        <div style={buttonStyle}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 21c-4.97-5.38-8-8.65-8-11a8 8 0 1116 0c0 2.35-3.03 5.62-8 11z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <span style={labelStyle}>Χάρτης Επιχειρήσεων</span>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          navigate("/prospores");
          setMobileMenuOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            navigate("/prospores");
            setMobileMenuOpen(false);
          }
        }}
        aria-label="Προσφορές"
        style={navItemStyle}
      >
        <div style={buttonStyle}>
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M20 12.5V7a2 2 0 0 0-2-2h-5.5a2 2 0 0 0-1.41.59l-7.09 7.09a2 2 0 0 0 0 2.82l5.5 5.5a2 2 0 0 0 2.82 0l7.09-7.09A2 2 0 0 0 20 12.5z" />
            <circle cx="7.5" cy="7.5" r="1.5" />
          </svg>
        </div>
        <span style={labelStyle}>Προσφορές</span>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          navigate("/ekdiloseis");
          setMobileMenuOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            navigate("/ekdiloseis");
            setMobileMenuOpen(false);
          }
        }}
        aria-label="Εκδηλώσεις"
        style={navItemStyle}
      >
        <div style={buttonStyle}>
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <span style={labelStyle}>Εκδηλώσεις</span>
      </div>
    </div>
  );

  const RightNavItems = () => (
    <div
      style={{
        display: "flex",
        gap: 48,
        alignItems: "center",
        flexShrink: 0,
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          navigate("/dashboard");
          setMobileMenuOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            navigate("/dashboard");
            setMobileMenuOpen(false);
          }
        }}
        aria-label="User profile icon"
        style={navItemStyle}
      >
        <div style={buttonStyle}>
          <svg
            viewBox="0 0 40 40"
            width="24"
            height="24"
            fill="none"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="20" cy="15" r="8" />
            <path d="M4 38c0-7 14-11 16-11s16 4 16 11" />
          </svg>
        </div>
        <span style={labelStyle}>Το προφίλ μου</span>
      </div>
      {userRole === "business" && userId && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            navigate(`/business/${userId}`);
            setMobileMenuOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate(`/business/${userId}`);
              setMobileMenuOpen(false);
            }
          }}
          aria-label="Business page"
          title="Η Σελίδα της Επιχείρησής σας"
          style={navItemStyle}
        >
          <div style={buttonStyle}>
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="black"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="2" y="7" width="20" height="13" rx="2.5" />
              <path d="M6 7V5a4 4 0 0 1 12 0v2" />
            </svg>
          </div>
          <span style={labelStyle}>Η επιχείρησή μου</span>
        </div>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          navigate("/favorites");
          setMobileMenuOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            navigate("/favorites");
            setMobileMenuOpen(false);
          }
        }}
        aria-label="Favorites"
        style={navItemStyle}
      >
        <div style={buttonStyle}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h1.87C14.46 4.99 15.96 4 17.5 4 20 4 22 6 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z" />
          </svg>
        </div>
        <span style={labelStyle}>Αγαπημένα</span>
      </div>
    </div>
  );

  const MobileMenuItems = () => (
    <nav
      aria-label="Mobile navigation menu"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 40,
        padding: 20,
        paddingTop: 0,
      }}
    >
      <LeftNavItems />
      <RightNavItems />
    </nav>
  );

  return (
    <>
      <header
        style={{
          width: "100vw",
          backgroundColor: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          borderBottom: "1px solid #eee",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {!isMobile && <RightNavItems />}
{isMobile && (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <BurgerIcon open={mobileMenuOpen} onClick={() => setMobileMenuOpen((v) => !v)} />
  </div>
)}
{/* Floating + button for business users (all screens) */}
{!loadingRole && userRole === "business" && (
  <button
    onClick={openCreateModal}
    aria-label="Δημιουργία νέας προσφοράς ή εκδήλωσης"
    title="Δημιουργία νέας προσφοράς ή εκδήλωσης"
    style={{
      position: "fixed",
      bottom: 30,
      right: 30,
      width: 56,
      height: 56,
      borderRadius: "50%",
      backgroundColor: "#191919",
      color: "#fff",
      fontSize: 36,
      border: "none",
      cursor: "pointer",
      boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      zIndex: 10000,
      userSelect: "none",
    }}
  >
    +
  </button>
)}

            
      
      </header>
      {/* FLOATING NOTIFICATIONS BELL FOR BUSINESS */}
      {!loadingRole && userRole === "business" && userId && <NotificationsBell businessId={userId} />}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: 250,
            backgroundColor: "#fff",
            boxShadow: "-3px 0 8px rgba(0,0,0,0.15)",
            zIndex: 10500,
            paddingTop: 60,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 24,
              fontWeight: "bold",
              padding: 4,
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            ×
          </button>
          <MobileMenuItems />
        </div>
      )}
      {!loadingRole && userRole === "business" && modalOpen && (
        <>
          <div
            onClick={() => !submitting && setModalOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 11000,
              display: "flex",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 24,
                width: "90%",
                maxWidth: 420,
                boxSizing: "border-box",
                boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              }}
            >
              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 18,
                  justifyContent: "center",
                }}
              >
                <button
                  style={{
                    padding: "6px 18px",
                    background: modalType === "offers" ? "#191919" : "#f0f0f0",
                    color: modalType === "offers" ? "#fff" : "#191919",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => handleSwitchType("offers")}
                  disabled={submitting}
                >
                  Προσφορά
                </button>
                <button
                  style={{
                    padding: "6px 18px",
                    background: modalType === "events" ? "#191919" : "#f0f0f0",
                    color: modalType === "events" ? "#fff" : "#191919",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => handleSwitchType("events")}
                  disabled={submitting}
                >
                  Εκδήλωση
                </button>
              </div>
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <label>
                  Όνομα {modalType === "offers" ? "Προσφοράς" : "Εκδήλωσης"}:
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: 8, fontSize: 16 }}
                    disabled={submitting}
                    autoFocus
                  />
                </label>
                {modalType === "events" && (
                  <>
                    <label>
                      Ημερομηνία Εκδήλωσης:
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        disabled={submitting}
                        style={{ width: "100%", padding: 8, fontSize: 16 }}
                      />
                    </label>
                    <div style={{ display: "flex", gap: 10 }}>
                      <label style={{ flex: 1 }}>
                        Ώρα Έναρξης:
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          required
                          disabled={submitting}
                          style={{ width: "100%", padding: 8, fontSize: 16 }}
                        />
                      </label>
                      <label style={{ flex: 1 }}>
                        Ώρα Λήξης:
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          required
                          disabled={submitting}
                          style={{ width: "100%", padding: 8, fontSize: 16 }}
                        />
                      </label>
                    </div>
                  </>
                )}
                <label>
                  Σύντομη Περιγραφή:{" "}
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: 8,
                      fontSize: 16,
                      resize: "vertical",
                    }}
                    disabled={submitting}
                    placeholder="(Προαιρετικό)"
                  />
                </label>
                <div
                  style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
                >
                  <button
                    type="button"
                    onClick={() => !submitting && setModalOpen(false)}
                    disabled={submitting}
                    style={{
                      padding: "8px 16px",
                      fontSize: 16,
                      cursor: "pointer",
                      borderRadius: 6,
                      border: "1px solid #888",
                      backgroundColor: "#f0f0f0",
                    }}
                  >
                    Ακύρωση
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "8px 20px",
                      fontSize: 16,
                      cursor: submitting ? "wait" : "pointer",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "#191919",
                      color: "#fff",
                      fontWeight: "600",
                    }}
                  >
                    {submitting ? "Αποστολή..." : "Αποθήκευση"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
