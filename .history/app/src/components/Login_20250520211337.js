import React from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

export default function Login() {
  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      alert(`Welcome, ${user.displayName}`);
      console.log(user);
    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f9f9f9",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <img 
        src="/logo.png" 
        alt="Site Logo" 
        style={{ width: 200, marginBottom: 40 }} 
      />
      <button 
        onClick={login} 
        style={{
          padding: "15px 30px",
          fontSize: 18,
          borderRadius: 30,
          border: "none",
          cursor: "pointer",
          backgroundColor: "#4285F4",
          color: "white",
          boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
          transition: "background-color 0.3s"
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#357ae8"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = "#4285F4"}
      >
        Sign in with Google
      </button>
    </div>
  );
}
