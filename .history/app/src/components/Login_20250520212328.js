import React from "react";
import { auth, provider, db } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import './Login.css';


export default function Login() {
  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // New user, create profile document with default role = null
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName,
          role: null,  // user will select client or business later
          createdAt: new Date(),
        });
        alert("Profile created! Please complete your profile.");
        // Redirect to profile builder page here (we'll build this next)
      } else {
        alert(`Welcome back, ${user.displayName}`);
        // Redirect to dashboard depending on role
      }

      console.log(user);
    } catch (error) {
      console.error(error);
      alert("Login failed");
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
        />
        Sign in with Google
      </button>
    </div>
  );
}
