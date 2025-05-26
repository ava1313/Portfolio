import React, { useRef } from "react";
import "./style.css";

export default function MainPage() {
  const carouselRef = useRef(null);
  const scrollPerClick = 400;

  const scrollNext = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    // Calculate new scroll position
    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    let newScrollLeft = carousel.scrollLeft + scrollPerClick;
    if (newScrollLeft > maxScrollLeft) newScrollLeft = maxScrollLeft;

    // Smooth scroll to new position
    carousel.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  };

  return (
    <>
      {/* User icon */}
      <div className="user-icon" aria-label="User profile icon">
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
          <button>Αναζήτηση</button>
          <button>Τοποθεσία</button>
          <button>Φίλτρο</button>
          <button className="search-icon" aria-label="Αναζήτηση">
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
            <div className="carousel" ref={carouselRef}>
              {[...Array(10)].map((_, i) => (
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
              onClick={scrollNext}
            >
              &#8594;
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
