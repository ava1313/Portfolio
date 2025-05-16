const totalImages = 10;
const imagesFolder = 'HomePageImages/';
const carousel = document.getElementById('carousel');
let currentIndex = 0;
let images = [];

for(let i=1; i<=totalImages; i++) {
    const img = document.createElement('img');
    img.src = imagesFolder + i + '.jpg';
    img.alt = '';
    images.push(img);
}

// Show 4 images at a time
function renderCarousel() {
    carousel.innerHTML = '';
    for(let i=0; i<4; i++) {
        const imgIndex = (currentIndex + i) % images.length;
        carousel.appendChild(images[imgIndex].cloneNode());
    }
}

let carouselInterval = setInterval(() => {
    nextSlide();
}, 2800);

function nextSlide() {
    currentIndex = (currentIndex + 1) % images.length;
    renderCarousel();
}
function prevSlide() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    renderCarousel();
}

// Only right arrow is shown (left is hidden, but handler exists if you want to enable it)
document.getElementById('nextBtn').onclick = () => {
    nextSlide();
    resetInterval();
};

function resetInterval() {
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        nextSlide();
    }, 2800);
}

renderCarousel();
