// src/Navbar.js
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

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

  return (
    <header
      style={{
        width: "100vw",
        backgroundColor: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        borderBottom: "1px solid #eee",
        padding: "10px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        boxSizing: "border-box",
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      {/* Left: Map icon */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/businessesmap")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/businessesmap");
        }}
        aria-label="Businesses Map"
        style={buttonStyle}
      >
        {/* …your SVG… */}
      </div>

      {/* Centered logo */}
      <img
        src="/logo.png"
        alt="freedome logo"
        style={{
          height: 50,
          cursor: "pointer",
          objectFit: "contain",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          userSelect: "none",
        }}
        onClick={() => navigate("/mainpage")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/mainpage");
        }}
        aria-label="Go to homepage"
      />

      {/* Right icons */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginRight: 10 }}>
        {/* Εκδηλώσεις */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/ekdiloseis")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/ekdiloseis");
          }}
          aria-label="Εκδηλώσεις"
          style={buttonStyle}
        >
          📅
        </div>

        {/* Προσφορές */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/prospores")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/prospores");
          }}
          aria-label="Προσφορές"
          style={buttonStyle}
        >
          🏷️
        </div>

        {/* Profile */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/dashboard")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
          }}
          aria-label="User profile icon"
          style={buttonStyle}
        >
          {/* …SVG… */}
        </div>

        {/* Favorites */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/favorites")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/favorites");
          }}
          aria-label="Favorites"
          style={buttonStyle}
        >
          {/* …SVG… */}
        </div>
      </div>
    </header>
  );
}
