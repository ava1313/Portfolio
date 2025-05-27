import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, provider, db } from "../firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import './Login.css';

function Modal({ open, message, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-bg">
      <div className="modal-content">
        <div style={{ marginBottom: 22 }}>{message}</div>
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState({ open: false, message: "" });

  // Redirect if already logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check for profile in Firestore
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
    <div className="login-root">
      <img src="/logo.png" alt="Site Logo" className="login-logo" />
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
