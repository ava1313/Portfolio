// ——— Firebase Visitor Counter Setup ———
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
  
  firebase.initializeApp(firebaseConfig);
  const visitorsRef = firebase.database().ref('visitors');
  
  // ——— UI Handlers ———
  // Toggle popup menu visibility
  function togglePopup() {
    const menu = document.getElementById('popupMenu');
    menu.style.display = (menu.style.display === 'none' || menu.style.display === '')
      ? 'flex'
      : 'none';
  }
  
  // Animate skills when scrolled into view
  function handleScroll() {
    const skillsSection = document.getElementById('skills');
    const viewportHeight  = window.innerHeight;
    const sectionTop      = skillsSection.getBoundingClientRect().top;
    const sectionHeight   = skillsSection.offsetHeight;
    const middleOfSection = sectionTop + sectionHeight / 2;
    const middleOfView    = viewportHeight / 2;
  
    if (middleOfSection <= middleOfView) {
      document.querySelectorAll('.skills-grid .skill').forEach(skill => {
        skill.classList.add('animate');
      });
      window.removeEventListener('scroll', handleScroll);
    }
  }
  
  // ——— Initialize Everything on DOM Ready ———
  window.addEventListener('DOMContentLoaded', () => {
    // 1) Increment visitor count (silent, no UI on page)
    visitorsRef.transaction(count => (count || 0) + 1)
      .catch(err => console.error('Firebase tx failed:', err));
  
    // 2) Popup menu toggle
    document.getElementById('toggleMenu')
      .addEventListener('click', togglePopup);
  
    // 3) Close popup when any menu link or close button is clicked
    document.querySelectorAll('#popupMenu .nav-link, #popupMenu button')
      .forEach(el =>
        el.addEventListener('click', () => {
          document.getElementById('popupMenu').style.display = 'none';
        })
      );
  
    // 4) Scroll animation for skills
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // in case skills are already in view
  });
  