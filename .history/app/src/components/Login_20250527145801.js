import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, provider, db } from "../firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
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

  // Auto-redirect if logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const redirectPath = location.state?.from?.pathname || "/mainpage";
        if (!userSnap.exists() || userSnap.data().role == null) {
          navigate("/profile-builder", { replace: true });
        } else {
          navigate(redirectPath, { replace: true });
        }
      }
    });
    return () => unsub();
    // eslint-disable-next-line
  }, []);

  const showModal = (msg, cb) => setModal({ open: true, message: msg, cb });
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

      // Save minimal user info if new user
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
          role: null, // force profile completion
        });
        showModal("Συμπληρώστε το προφίλ σας.", () =>
          navigate("/profile-builder", { replace: true })
        );
      } else if (userSnap.data().role == null) {
        showModal("Συμπληρώστε το προφίλ σας.", () =>
          navigate("/profile-builder", { replace: true })
        );
      } else {
        showModal(`Καλώς ήρθατε ξανά, ${userSnap.data().displayName || user.displayName}`, () =>
          navigate(location.state?.from?.pathname || "/mainpage", { replace: true })
        );
      }
    } catch (error) {
      console.error(error);
      showModal("Η σύνδεση απέτυχε");
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
        Σύνδεση με Google
      </button>
      <Modal open={modal.open} message={modal.message} onClose={closeModal} />
    </div>
  );
}
