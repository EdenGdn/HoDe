// Script principal para HoDe
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar módulos
  initAuth();
  initHeader();
  initLuminicCursor();
  initWorkers();
  initMessages();
  initUiPanels();
  initGeolocation();
  initDashboard();
  initTestimonials();
  initNotifications();
  initPublicProfile();
  initPayments();
  initMapSearch();
  initAdminPanel();
  initHiringHistory();
  initSectionAnimations();

  // Función para animaciones de secciones con stagger en hijos
  function initSectionAnimations() {
    var sections = document.querySelectorAll('.section');
    var CHILD_SEL = '.step, .testimonial, .differentiator';
    var STAGGER_MS = 120;

    // Pre-hide children and titles before observer fires
    sections.forEach(function(section) {
      section.classList.add('fade-in');

      var title = section.querySelector('h2');
      if (title) {
        title.style.opacity = '0';
        title.style.transform = 'translateY(-16px)';
      }

      var children = section.querySelectorAll(CHILD_SEL);
      children.forEach(function(child) {
        child.style.opacity = '0';
        child.style.transform = 'translateY(32px) scale(0.97)';
      });
    });

    var observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    function revealChildren(section) {
      // Title reveal
      var title = section.querySelector('h2');
      if (title && !title.dataset.revealed) {
        title.dataset.revealed = '1';
        title.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        title.style.opacity = '';
        title.style.transform = '';
        title.addEventListener('transitionend', function handler() {
          title.style.transition = '';
          title.removeEventListener('transitionend', handler);
        });
      }

      // Stagger child elements
      var children = section.querySelectorAll(CHILD_SEL);
      children.forEach(function(child, i) {
        if (child.dataset.revealed) return;
        child.dataset.revealed = '1';
        setTimeout(function() {
          child.style.transition = 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)';
          child.style.opacity = '';
          child.style.transform = '';
          child.addEventListener('transitionend', function handler() {
            child.style.transition = '';
            child.removeEventListener('transitionend', handler);
          });
        }, i * STAGGER_MS + 80);
      });
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealChildren(entry.target);
        }
      });
    }, observerOptions);

    sections.forEach(function(el) {
      observer.observe(el);
    });

    // Handle dynamically loaded professional cards
    var proGrid = document.getElementById('professionals-grid');
    if (proGrid) {
      var proSection = proGrid.closest('.section');
      if (proSection) {
        var mo = new MutationObserver(function() {
          if (proSection.classList.contains('visible')) {
            var cards = proGrid.querySelectorAll('.professional-card');
            cards.forEach(function(card, i) {
              if (card.dataset.revealed) return;
              card.dataset.revealed = '1';
              card.style.opacity = '0';
              card.style.transform = 'translateY(32px) scale(0.97)';
              setTimeout(function() {
                card.style.transition = 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)';
                card.style.opacity = '';
                card.style.transform = '';
                card.addEventListener('transitionend', function handler() {
                  card.style.transition = '';
                  card.removeEventListener('transitionend', handler);
                });
              }, i * 100 + 80);
            });
          }
        });
        mo.observe(proGrid, { childList: true });
      }
    }
  }
});
