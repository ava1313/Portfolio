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
      {/* Left: Map icon + Offers + Events */}
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {/* Map */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/businessesmap")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/businessesmap");
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
          {/* Tag icon */}
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
          {/* Calendar icon */}
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

      {/* Right: Profile + Favorites */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          height: "100%",
          flexShrink: 0,
          marginRight: 10,
        }}
      >
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
    </header>
  );
}
