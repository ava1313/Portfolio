// src/components/Login.js
import React from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

export default function Login() {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Logged in user:", user);
      alert(`Welcome, ${user.displayName}`);
      // TODO: Redirect user after login
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to login");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      <button onClick={handleGoogleLogin}>Sign in with Google</button>
    </div>
  );
}
