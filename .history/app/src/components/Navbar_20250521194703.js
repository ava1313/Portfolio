import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

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
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Centered logo */}
      <img
        src="/logo.png"
        alt="freedome logo"
        style={{
          height: 50,
          cursor: "pointer",
          objectFit: "contain",
          margin: "0 auto",
        }}
        onClick={() => navigate("/mainpage")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/mainpage");
        }}
        aria-label="Go to homepage"
      />

      {/* Top right icons container */}
      <div
        style={{
          position: "absolute",
          right: 20,
          display: "flex",
          gap: 16,
          alignItems: "center",
          height: "100%",
        }}
      >
        {/* Profile icon */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/dashboard")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
          }}
          aria-label="User profile icon"
          style={{
            background: "#fff",
            borderRadius: "50%",
            border: "3px solid #000",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
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

        {/* Favorites icon */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/favorites")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/favorites");
          }}
          aria-label="Favorites"
          style={{
            background: "#fff",
            borderRadius: "50%",
            border: "3px solid #000",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
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
