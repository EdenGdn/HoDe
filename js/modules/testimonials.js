// Módulo de testimonios/reseñas funcionales para HoDe
function initTestimonials() {
  var grid = document.getElementById('testimonials-grid');
  var form = document.getElementById('testimonial-form');
  var textarea = document.getElementById('testimonial-text');
  var charCount = document.getElementById('testimonial-char-count');
  var statusNode = document.getElementById('testimonial-status');
  var authHint = document.getElementById('testimonial-auth-hint');
  var submitBtn = document.getElementById('testimonial-submit-btn');
  var ratingPicker = document.getElementById('testimonial-rating-picker');

  if (!grid || !form) return;

  var selectedRating = 5;

  // Hardcoded base testimonials (always shown first)
  var baseTestimonials = [
    { id: 'base-1', userName: 'Juan Pérez', userRole: 'Emprendedor', text: 'Encontré un desarrollador excelente en menos de una hora. El proceso fue muy sencillo y el resultado superó mis expectativas.', rating: 5 },
    { id: 'base-2', userName: 'Laura Martínez', userRole: 'Dueña de casa', text: 'La verificación de profesionales me dio mucha confianza. Contraté a alguien para reparar mi casa y todo salió perfecto.', rating: 5 },
    { id: 'base-3', userName: 'Roberto Sánchez', userRole: 'Plomero certificado', text: 'Como profesional, HoDe me ha permitido encontrar más clientes. La plataforma es intuitiva y segura.', rating: 5 }
  ];

  var userReviews = [];

  function starString(rating) {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    var diff = Date.now() - new Date(dateStr).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Justo ahora';
    if (mins < 60) return 'Hace ' + mins + ' min';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return 'Hace ' + hours + 'h';
    var days = Math.floor(hours / 24);
    return 'Hace ' + days + 'd';
  }

  function renderTestimonials() {
    var all = baseTestimonials.concat(userReviews);
    grid.innerHTML = all.map(function(review) {
      var isOwn = typeof review.id === 'number' && review.userId;
      var session = window.HodeAuth && window.HodeAuth.getSession ? window.HodeAuth.getSession() : null;
      var canDelete = isOwn && session && session.id === review.userId;

      return '<div class="testimonial' + (isOwn ? ' testimonial--user' : '') + '">' +
        '<div class="testimonial__stars">' + starString(review.rating) + '</div>' +
        '<p class="testimonial__quote">"' + escapeHtml(review.text) + '"</p>' +
        '<div class="testimonial__author">' + escapeHtml(review.userName) + '</div>' +
        '<div class="testimonial__role">' + escapeHtml(review.userRole) +
          (review.createdAt ? ' · ' + timeAgo(review.createdAt) : '') +
        '</div>' +
        (canDelete ? '<button type="button" class="testimonial__delete" data-delete-review="' + review.id + '" title="Eliminar reseña">✕</button>' : '') +
      '</div>';
    }).join('');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function updateAuthState() {
    var isAuth = window.HodeAuth && window.HodeAuth.isAuthenticated();
    if (authHint) {
      authHint.textContent = isAuth
        ? 'Tu opinión nos ayuda a mejorar.'
        : 'Inicia sesión para dejar tu reseña sobre HoDe.';
    }
    if (submitBtn) {
      submitBtn.disabled = !isAuth;
      submitBtn.textContent = isAuth ? 'Publicar reseña' : 'Inicia sesión primero';
    }
    if (textarea) textarea.disabled = !isAuth;
  }

  // Rating picker
  if (ratingPicker) {
    var starBtns = Array.from(ratingPicker.querySelectorAll('.testimonials__star-btn'));
    starBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        selectedRating = Number(btn.getAttribute('data-star'));
        starBtns.forEach(function(b) {
          b.classList.toggle('is-active', Number(b.getAttribute('data-star')) <= selectedRating);
        });
      });
      btn.addEventListener('mouseenter', function() {
        var hoverVal = Number(btn.getAttribute('data-star'));
        starBtns.forEach(function(b) {
          b.classList.toggle('is-hover', Number(b.getAttribute('data-star')) <= hoverVal);
        });
      });
      btn.addEventListener('mouseleave', function() {
        starBtns.forEach(function(b) { b.classList.remove('is-hover'); });
      });
    });
  }

  // Char count
  if (textarea && charCount) {
    textarea.addEventListener('input', function() {
      charCount.textContent = textarea.value.length + ' / 500';
    });
  }

  // Submit review
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!window.HodeAuth || !window.HodeAuth.isAuthenticated()) {
      if (window.HodeAuth && window.HodeAuth.openLogin) {
        window.HodeAuth.openLogin('login');
      }
      return;
    }

    var text = textarea.value.trim();
    if (text.length < 10) {
      if (statusNode) statusNode.textContent = 'Tu reseña debe tener al menos 10 caracteres.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Publicando...';

    try {
      var review = await window.HodeApi.createReview({ text: text, rating: selectedRating });
      userReviews.push(review);
      renderTestimonials();
      textarea.value = '';
      if (charCount) charCount.textContent = '0 / 500';
      selectedRating = 5;
      if (ratingPicker) {
        var btns = Array.from(ratingPicker.querySelectorAll('.testimonials__star-btn'));
        btns.forEach(function(b) {
          b.classList.toggle('is-active', Number(b.getAttribute('data-star')) <= 5);
        });
      }
      if (statusNode) statusNode.textContent = '¡Gracias por tu reseña!';
      setTimeout(function() { if (statusNode) statusNode.textContent = ''; }, 3000);
    } catch (error) {
      if (statusNode) statusNode.textContent = error.message || 'Error al publicar la reseña.';
    } finally {
      updateAuthState();
    }
  });

  // Delete review
  grid.addEventListener('click', async function(e) {
    var btn = e.target.closest('[data-delete-review]');
    if (!btn) return;
    var reviewId = Number(btn.getAttribute('data-delete-review'));
    try {
      await window.HodeApi.deleteReview(reviewId);
      userReviews = userReviews.filter(function(r) { return r.id !== reviewId; });
      renderTestimonials();
    } catch (error) {
      // noop
    }
  });

  // Load reviews from API
  async function loadReviews() {
    try {
      var reviews = await window.HodeApi.listReviews();
      if (Array.isArray(reviews) && reviews.length) {
        userReviews = reviews;
        renderTestimonials();
      }
    } catch (error) {
      // API not available, keep base testimonials
    }
  }

  window.addEventListener('hode:authCompleted', function() {
    updateAuthState();
    renderTestimonials();
  });

  window.addEventListener('hode:authLogout', function() {
    updateAuthState();
    renderTestimonials();
  });

  updateAuthState();
  loadReviews();
}
