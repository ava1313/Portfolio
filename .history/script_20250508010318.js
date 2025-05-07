// ——— Firebase Visitor Counter Setup ———
// 1) Load and initialize Firebase (silent visitor count)
const firebaseConfig = {
    apiKey: "AIzaSyCoyF5L\_ipi7Z7nDql1oZfRUn6dvsLcdZw",
    authDomain: "esp32-oled-d0815.firebaseapp.com",
    databaseURL: "[https://esp32-oled-d0815-default-rtdb.europe-west1.firebasedatabase.app](https://esp32-oled-d0815-default-rtdb.europe-west1.firebasedatabase.app)",
    projectId: "esp32-oled-d0815",
    storageBucket: "esp32-oled-d0815.firebasestorage.app",
    messagingSenderId: "500729183488",
    appId: "1:500729183488\:web:2842ecd3d473869f6107e5",
    measurementId: "G-X6VCTKG79W"
    };
    
    firebase.initializeApp(firebaseConfig);
    const visitorsRef = firebase.database().ref('visitors');
    
    // ——— UI Handlers ———
    // Toggle popup menu visibility
    function togglePopup() {
    const menu = document.getElementById('popupMenu');
    menu.style.display = (menu.style.display === 'none' || menu.style.display === '') ? 'flex' : 'none';
    }
    
    // Animate skills section when it enters view
    function handleScroll() {
    const skillsSection = document.getElementById('skills');
    const viewportHeight  = window\.innerHeight;
    const sectionTop      = skillsSection.getBoundingClientRect().top;
    const sectionHeight   = skillsSection.offsetHeight;
    const middleOfSection = sectionTop + sectionHeight / 2;
    const middleOfViewport = viewportHeight / 1; // bottom of viewport
    
    console.log("Scroll Event: Section mid=", middleOfSection, "Viewport mid=", middleOfViewport);
    
    if (middleOfSection <= middleOfViewport) {
    document.querySelectorAll('.skills-grid .skill').forEach(skill => {
    skill.classList.add('animate');
    });
    window\.removeEventListener('scroll', handleScroll);
    }
    }
    
    // ——— Event Listeners ———
    window\.addEventListener('DOMContentLoaded', () => {
    // Increment visitor count (silent)
    visitorsRef.transaction(count => (count || 0) + 1)
    .catch(err => console.error('Firebase tx failed:', err));
    
    // Setup popup toggle
    document.getElementById('toggleMenu')
    .addEventListener('click', togglePopup);
    
    // Close popup on link or close-button click
    document.querySelectorAll('#popupMenu .nav-link, #popupMenu button').forEach(el =>
    el.addEventListener('click', () => {
    document.getElementById('popupMenu').style.display = 'none';
    })
    );
    
    // Initial scroll check in case skills are already visible
    handleScroll();
    });
    
    // Scroll animation for skills
    window\.addEventListener('scroll', handleScroll);
    
    // Additional popup mobile setup (optional fallback)
    window\.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('toggleMenu');
    const popupMenu    = document.getElementById('popupMenu');
    
    toggleButton.addEventListener('click', () => popupMenu.style.display = 'block');
    
    document.querySelectorAll('#popupMenu .nav-link').forEach(link =>
    link.addEventListener('click', () => popupMenu.style.display = 'none')
    );
    
    document.querySelector('#popupMenu button').addEventListener('click', () =>
    popupMenu.style.display = 'none'
    );
    });
    