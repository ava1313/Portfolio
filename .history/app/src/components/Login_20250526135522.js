import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, provider, db } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import './Login.css';

function Modal({ open, message, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        padding: "30px 26px", minWidth: 300, textAlign: "center", fontSize: 18, fontFamily: "inherit"
      }}>
        <div style={{ marginBottom: 22 }}>{message}</div>
        <button
          style={{
            background: "#191919", color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 36px", fontWeight: 600, fontSize: 16, cursor: "pointer"
          }}
          onClick={onClose}
        >OK</button>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState({ open: false, message: "" });

  const showModal = (msg, cb) => {
    setModal({ open: true, message: msg, cb });
  };

  const closeModal = () => {
    setModal({ open: false, message: "" });
    if (modal.cb) modal.cb();
  };

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // Where should we redirect after login?
      const redirectPath = location.state?.from?.pathname || "/mainpage";

      if (!userSnap.exists() || userSnap.data().role === null) {
        showModal("Please complete your profile.", () => navigate("/profile-builder", { replace: true }));
      } else {
        showModal(`Welcome back, ${user.displayName}`, () => navigate(redirectPath, { replace: true }));
      }
    } catch (error) {
      console.error(error);
      showModal("Login failed");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9f9f9",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <img src="/logo.png" alt="Site Logo" style={{ width: 200, marginBottom: 40 }} />
      <button className="google-btn" onClick={login}>
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          alt="Google logo"
          style={{ marginRight: 8 }}
        />
        Sign in with Google
      </button>
      <Modal open={modal.open} message={modal.message} onClose={closeModal} />
    </div>
  );
}
