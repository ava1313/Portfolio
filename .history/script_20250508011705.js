// ——— Firebase Visitor Counter ———
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
  
  // Animate all skills using IntersectionObserver
  function observeSkills() {
    const skills = document.querySelectorAll('.skills-grid .skill');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // staggered animation
          setTimeout(() => entry.target.classList.add('animate'), i * 100);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
  
    skills.forEach(skill => observer.observe(skill));
  }
  
  // ——— Bootstrap Everything on DOMContentLoaded ———
  
  window.addEventListener('DOMContentLoaded', () => {
    // 1) Increment visitor count silently
    visitorsRef
      .transaction(c => (c || 0) + 1)
      .catch(err => console.error('Firebase tx failed:', err));
  
    // 2) Popup menu toggle
    document.getElementById('toggleMenu')
      .addEventListener('click', togglePopup);
  
    // 3) Close popup on any link or close-button click
    document.querySelectorAll('#popupMenu .nav-link, #popupMenu button')
      .forEach(el =>
        el.addEventListener('click', () => {
          document.getElementById('popupMenu').style.display = 'none';
        })
      );
  
    // 4) Kick off skill animations when they enter view
    observeSkills();
  });
  