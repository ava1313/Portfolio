// src/components/MainPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import categories from "../data/categories";

export default function MainPage() {
  const navigate = useNavigate();
  const [slideIndex, setSlideIndex] = useState(0);
  const imagesCount = 10;
  const visibleImages = 4;
  const imageWidth = 300;
  const maxSlideIndex = imagesCount - visibleImages;

  const nextSlide = () => {
    setSlideIndex((prev) => (prev < maxSlideIndex ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  return (
    <>
      <div
        className="user-icon"
        aria-label="User profile icon"
        role="button"
        tabIndex={0}
        onClick={() => navigate("/dashboard")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
        }}
        style={{ cursor: "pointer" }}
      >
        {/* SVG icon */}
      </div>

      <header>
        <img src="/logo.png" alt="freedome logo" className="logo" />
      </header>

      <main>
        <p className="subtitle">Κάνε την καλύτερη επιλογή για εσένα</p>

        <div className="actions">
          <button onClick={() => alert("Search clicked!")}>Αναζήτηση</button>
          <button onClick={() => alert("Location clicked!")}>Τοποθεσία</button>
          <button onClick={() => alert("Filter clicked!")}>Φίλτρο</button>
          <button
            className="search-icon"
            aria-label="Αναζήτηση"
            onClick={() => alert("Search icon clicked!")}
          >
            {/* Search SVG */}
          </button>
        </div>

        <div className="carousel-border">
          <div className="carousel-container">
            <button
              className="carousel-btn left"
              aria-label="Previous"
              onClick={prevSlide}
            >
              &#8592;
            </button>

            <div
              className="carousel"
              style={{
                transform: `translateX(-${slideIndex * imageWidth}px)`,
              }}
            >
              {[...Array(imagesCount)].map((_, i) => (
                <img
                  key={i}
                  src={`/mainpageimages/${i + 1}.jpg`}
                  alt={`Carousel item ${i + 1}`}
                />
              ))}
            </div>

            <button
              className="carousel-btn right"
              aria-label="Next"
              onClick={nextSlide}
            >
              &#8594;
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
