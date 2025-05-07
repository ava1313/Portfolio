// ——— Firebase Visitor Counter Setup ———
// 1) Your Firebase config (from Project Settings → General → Your apps)
const firebaseConfig = {
    apiKey: "AIzaSyCoyF5L_ipi7Z7nDql1oZfRUn6dvsLcdZw",
    authDomain: "esp32-oled-d0815.firebaseapp.com",
    databaseURL: "https://esp32-oled-d0815-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "esp32-oled-d0815",
    storageBucket: "esp32-oled-d0815.firebasestorage.app",
    messagingSenderId: "500729183488",
    appId: "1:500729183488:web:2842ecd3d473869f6107e5",
    measurementId: "G-X6VCTKG79W"
  };
  
  // 2) Init Firebase & get reference to /visitors
  firebase.initializeApp(firebaseConfig);
  const visitorsRef = firebase.database().ref('visitors');
  
  // 3) Increment on each load (no on-page UI)
  window.addEventListener('DOMContentLoaded', () => {
    visitorsRef
      .transaction(count => (count || 0) + 1)
      .catch(err => console.error('Firebase tx failed:', err));
  });
  
  // ——— Your Existing JS Below ———
  
  // Toggle popup menu on small screens
  function togglePopup() {
    const menu = document.getElementById('popupMenu');
    menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
  }
  
  // Example scroll handler (replace with yours)
  function handleScroll() {
    const skills = document.getElementById('skills');
    // … your scroll-into-view code …
  }
  
  // Wire up your handlers
  document.getElementById('toggleMenu').addEventListener('click', togglePopup);
  window.addEventListener('scroll', handleScroll);
  
  // … any other code you already have …
  
function handleScroll() {
    var skillsSection = document.getElementById('skills');
    var viewportHeight = window.innerHeight;
    var sectionTop = skillsSection.getBoundingClientRect().top;
    var sectionHeight = skillsSection.offsetHeight;

    // Calculate the middle of the section and the viewport
    var middleOfSection = sectionTop + sectionHeight / 2;
    var middleOfViewport = viewportHeight / 1;

    // Debugging output
    console.log("Scroll Event: Middle of section:", middleOfSection, "Middle of viewport:", middleOfViewport);

    // Check if the middle of the section is at or has passed the middle of the viewport
    if (middleOfSection <= middleOfViewport) {
        var skills = document.querySelectorAll('.skills-grid .skill');
        skills.forEach(skill => {
            skill.classList.add('animate');
        });
        // Remove event listener to prevent re-animation on further scrolls
        window.removeEventListener('scroll', handleScroll);
    }
}

// Initial event listener setup
window.addEventListener('scroll', handleScroll);

// Check immediately in case the section is already in view on initial page load
document.addEventListener('DOMContentLoaded', handleScroll);




document.addEventListener('DOMContentLoaded', function () {
    var toggleButton = document.getElementById('toggleMenu');
    var popupMenu = document.getElementById('popupMenu');

    toggleButton.addEventListener('click', function() {
        popupMenu.style.display = 'block';
    });

    document.querySelectorAll('#popupMenu .nav-link').forEach(function(link) {
        link.addEventListener('click', function() {
            popupMenu.style.display = 'none';
        });
    });

    // This part handles the close button
    document.querySelector('#popupMenu button').addEventListener('click', function() {
        popupMenu.style.display = 'none';
    });
});
