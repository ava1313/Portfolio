import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import categories from "../data/categories";


const allCategories = categories.flatMap(cat => cat.subcategories);

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
      {/* User icon: click redirects to dashboard */}
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
        <svg
          viewBox="0 0 40 40"
          width="54"
          height="54"
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
            <svg viewBox="0 0 30 30" width="34" height="34" aria-hidden="true">
              <circle
                cx="14"
                cy="14"
                r="10"
                stroke="black"
                strokeWidth="2.5"
                fill="none"
              />
              <line
                x1="26"
                y1="26"
                x2="20"
                y2="20"
                stroke="black"
                strokeWidth="2.5"
              />
            </svg>
          </button>
        </div>

        <div className="carousel-border">
          <div className="carousel-container">
            {/* Prev button */}
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

            {/* Next button */}
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
