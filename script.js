const totalImages = 10;
const imagesFolder = 'HomePageImages/';
const carousel = document.getElementById('carousel');
let currentIndex = 0;

// Create all images once and add them
let images = [];
for(let i=1; i<=totalImages; i++) {
    const img = document.createElement('img');
    img.src = imagesFolder + i + '.jpg';
    img.alt = '';
    images.push(img);
}

// For seamless loop, duplicate first 4 images at the end and last 4 at the start
function buildCarouselTrack() {
    carousel.innerHTML = '';
    // Clone last 4 and add to start
    for(let i=totalImages-4; i<totalImages; i++) {
        carousel.appendChild(images[i].cloneNode());
    }
    // Add all main images
    for(let i=0; i<totalImages; i++) {
        carousel.appendChild(images[i].cloneNode());
    }
    // Clone first 4 and add to end
    for(let i=0; i<4; i++) {
        carousel.appendChild(images[i].cloneNode());
    }
}
buildCarouselTrack();

// Total slide width (each image = 25vw)
let slideWidth = carousel.querySelector('img').offsetWidth || carousel.offsetWidth/4;
let isTransitioning = false;

// Position the carousel so first "real" image is visible
function setCarouselPosition(animate = true) {
    if (!animate) carousel.style.transition = "none";
    else carousel.style.transition = "transform 0.65s cubic-bezier(.33,1.01,.68,1)";
    const pos = -(currentIndex + 4) * slideWidth;
    carousel.style.transform = `translateX(${pos}px)`;
    if (!animate) setTimeout(() => carousel.style.transition = "", 10);
}

// Fix slideWidth on resize
window.addEventListener('resize', () => {
    slideWidth = carousel.querySelector('img').offsetWidth || carousel.offsetWidth/4;
    setCarouselPosition(false);
});

// Initialize currentIndex to 0, but visual offset is +4
setTimeout(() => {
    slideWidth = carousel.querySelector('img').offsetWidth || carousel.offsetWidth/4;
    setCarouselPosition(false);
}, 50);

// Next/Prev
function nextSlide() {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex++;
    setCarouselPosition(true);
    setTimeout(handleLoop, 700);
}
function prevSlide() {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex--;
    setCarouselPosition(true);
    setTimeout(handleLoop, 700);
}

// Handle infinite loop (jump without transition at edges)
function handleLoop() {
    if (currentIndex >= totalImages) {
        currentIndex = 0;
        setCarouselPosition(false);
    }
    if (currentIndex < 0) {
        currentIndex = totalImages-1;
        setCarouselPosition(false);
    }
    isTransitioning = false;
}

// Arrow click
document.getElementById('nextBtn').onclick = () => {
    nextSlide();
    resetInterval();
};

// Interval auto-slide
let carouselInterval = setInterval(nextSlide, 2800);
function resetInterval() {
    clearInterval(carouselInterval);
    carouselInterval = setInterval(nextSlide, 2800);
}

setCarouselPosition(false);
