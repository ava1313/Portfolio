import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
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
  const [alertModal, setAlertModal] = useState({ open: false, message: "", type: "info" });

  // NEW: mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const showAlert = (message, type = "info") => {
    setAlertModal({ open: true, message, type });
  };

  const closeAlert = () => {
    setAlertModal({ ...alertModal, open: false });
  };

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

  // Modal and form handlers here (unchanged) ...

  // Toggle mobile menu
  const toggleMobileMenu = () => setMobileMenuOpen((open) => !open);

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
        }}
      >
        {/* LEFT - Desktop nav, hidden on mobile when menu closed */}
        <nav
          aria-label="Primary navigation"
          style={{
            display: mobileMenuOpen ? "flex" : "none",
            gap: 14,
            alignItems: "center",
            flexGrow: 1,
          }}
          className="nav-left"
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => { navigate("/businessesmap"); setMobileMenuOpen(false); }}
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

          <div
            role="button"
            tabIndex={0}
            onClick={() => { navigate("/prospores"); setMobileMenuOpen(false); }}
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

          <div
            role="button"
            tabIndex={0}
            onClick={() => { navigate("/ekdiloseis"); setMobileMenuOpen(false); }}
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
        </nav>

        {/* CENTER: Logo */}
        <img
          src="/logo.png"
          alt="freedome logo"
          style={{
            height: 50,
            cursor: "pointer",
            objectFit: "contain",
            userSelect: "none",
            margin: "0 auto",
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

        {/* RIGHT - Desktop nav, hidden on mobile when menu closed */}
        <nav
          aria-label="User navigation"
          style={{
            display: mobileMenuOpen ? "flex" : "none",
            gap: 16,
            alignItems: "center",
            flexShrink: 0,
          }}
          className="nav-right"
        >
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

          {/* BusinessPage (only for business role) */}
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
                <rect x="3" y="7" width="18" height="12" rx="2.5" />
                <path d="M7 7V5a3 3 0 0 1 10 0v2" />
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
        </nav>

        {/* BURGER MENU BUTTON - shown on mobile */}
        <button
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          style={{
            display: "block",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 10,
            marginLeft: 10,
            flexShrink: 0,
          }}
          className="burger-button"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {mobileMenuOpen ? (
              // X icon
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              // Hamburger icon
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </header>

      {/* Floating create button and modals ... (unchanged) */}

      {/* Your existing modal and alert modal code stays unchanged */}

      {/* For simplicity, hide left/right nav when screen > 768px, always show them */}
      <style>{`
        @media(min-width: 769px) {
          .nav-left, .nav-right {
            display: flex !important;
          }
          .burger-button {
            display: none !important;
          }
        }
        @media(max-width: 768px) {
          header {
            flex-wrap: wrap;
          }
          img[alt="freedome logo"] {
            margin: 0 auto;
            order: 1;
            margin-bottom: 10px;
          }
          nav.nav-left {
            order: 2;
            width: 100%;
            justify-content: center;
          }
          nav.nav-right {
            order: 3;
            width: 100%;
            justify-content: center;
            margin-top: 10px;
          }
        }
      `}</style>
    </>
  );
}