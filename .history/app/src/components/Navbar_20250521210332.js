import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const iconStyle = {
    background: "#fff",
    borderRadius: "50%",
    border: "2.5px solid #000",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "border-color 0.3s, background-color 0.3s",
  };

  const iconHoverStyle = {
    borderColor: "#4285F4",
    backgroundColor: "#e8f0fe",
  };

  const [hoveredIcon, setHoveredIcon] = React.useState(null);

  return (
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
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: "relative",
      }}
    >
      {/* Left: Map Icon */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/businessesmap")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/businessesmap");
        }}
        aria-label="Open Businesses Map"
        onMouseEnter={() => setHoveredIcon("map")}
        onMouseLeave={() => setHoveredIcon(null)}
        style={{
          ...iconStyle,
          ...(hoveredIcon === "map" ? iconHoverStyle : {}),
          zIndex: 10,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          stroke="#000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          viewBox="0 0 24 24"
        >
          <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>

      {/* Center: Logo */}
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

      {/* Right: Profile and Favorites Icons */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", zIndex: 10 }}>
        {/* Profile */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/dashboard")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
          }}
          aria-label="User profile"
          onMouseEnter={() => setHoveredIcon("profile")}
          onMouseLeave={() => setHoveredIcon(null)}
          style={{
            ...iconStyle,
            ...(hoveredIcon === "profile" ? iconHoverStyle : {}),
          }}
        >
          <svg
            viewBox="0 0 40 40"
            width="24"
            height="24"
            fill="none"
            stroke="#000"
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
          onMouseEnter={() => setHoveredIcon("favorites")}
          onMouseLeave={() => setHoveredIcon(null)}
          style={{
            ...iconStyle,
            ...(hoveredIcon === "favorites" ? iconHoverStyle : {}),
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="#000"
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
