// Módulo para el cursor luminoso
function initLuminicCursor() {
  const cursor = document.getElementById('luminic-cursor');
  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let isActive = false;

  // Función para actualizar la posición del cursor
  function updateCursor() {
    const delay = 0.1; // Delay para el efecto
    cursorX += (mouseX - cursorX) * delay;
    cursorY += (mouseY - cursorY) * delay;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    requestAnimationFrame(updateCursor);
  }

  // Event listeners para el mouse
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isActive) {
      isActive = true;
      cursor.classList.add('active');
    }
  });

  document.addEventListener('mouseleave', function() {
    isActive = false;
    cursor.classList.remove('active');
  });

  // Iniciar la animación
  updateCursor();

  // Parallax para el hero
  function updateParallax() {
    const scrolled = window.pageYOffset;
    const parallaxElement = document.querySelector('.hero__parallax');
    if (parallaxElement) {
      const rate = scrolled * -0.5;
      parallaxElement.style.setProperty('--parallax-offset', rate + 'px');
    }
    requestAnimationFrame(updateParallax);
  }

  updateParallax();
}

// Fallback para navegadores antiguos
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function(callback) {
    setTimeout(callback, 16);
  };
}
