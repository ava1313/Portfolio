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
