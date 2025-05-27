import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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

  // Mobile menu open toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Detect mobile viewport width
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

  // Modal + form handlers (unchanged)
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

  // Burger icon for mobile toggle
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


  // Nav items for left and right groups
  const LeftNavItems = () => (
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      {/* Map */}
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
        style={buttonStyle}
      >
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
      {/* Offers */}
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
        style={buttonStyle}
      >
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
      {/* Events */}
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
        style={buttonStyle}
      >
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
    </div>
  );

  const RightNavItems = () => (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
      {/* Profile */}
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
        style={buttonStyle}
      >
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

      {/* BusinessPage */}
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
          style={buttonStyle}
        >
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
      )}

      {/* Favorites */}
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
        style={buttonStyle}
      >
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
    </div>
  );

  // Combined nav items used inside mobile menu panel (all stacked vertically)
  const MobileMenuItems = () => (
    <nav
      aria-label="Mobile navigation menu"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: 20,
      }}
    >
      {/* All nav icons repeated here, stacked vertically */}
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
        {/* Left nav - desktop only */}
        {!isMobile && <LeftNavItems />}

        {/* Logo */}
        <img
          src="/logo.png"
          alt="freedome logo"
          style={{
            height: 50,
            cursor: "pointer",
            objectFit: "contain",
            userSelect: "none",
            position: isMobile ? "static" : "absolute",
            left: isMobile ? "auto" : "50%",
            transform: isMobile ? "none" : "translateX(-50%)",
          }}
          onClick={() => {
            navigate("/mainpage");
            setMobileMenuOpen(false);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/mainpage");
              setMobileMenuOpen(false);
            }
          }}
          aria-label="Go to homepage"
        />

        {/* Right nav - desktop only */}
        {!isMobile && <RightNavItems />}

        {/* Mobile: burger menu + floating + button */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
            <BurgerIcon open={mobileMenuOpen} onClick={() => setMobileMenuOpen((v) => !v)} />
          </div>
        )}
      </header>

      {/* Mobile sliding menu */}
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
          }}
        >
          <MobileMenuItems />
        </div>
      )}

      {/* Modal overlay & form */}
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

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {/* Title */}
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

                {/* Date & Times for Events */}
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

                {/* Description */}
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

                {/* Buttons */}
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
