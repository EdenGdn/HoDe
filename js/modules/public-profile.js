// Módulo de perfil público de profesional
function initPublicProfile() {
  var modal = document.getElementById('public-profile-modal');
  var content = document.getElementById('public-profile-content');
  if (!modal || !content) return;

  function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function starString(r) { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); }

  function open(worker) {
    var w = worker;
    content.innerHTML =
      '<div class="public-profile__header">' +
        '<div class="public-profile__avatar">' + escapeHtml(w.name.charAt(0)) + '</div>' +
        '<div class="public-profile__info">' +
          '<h3>' + escapeHtml(w.name) + (w.verified ? ' <span class="public-profile__badge" title="Verificado">✓</span>' : '') + '</h3>' +
          '<p class="public-profile__specialty">' + escapeHtml(w.specialty) + ' · ' + escapeHtml(w.city) + '</p>' +
          '<p class="public-profile__rating"><span class="public-profile__stars">' + starString(w.rating) + '</span> ' + w.rating + ' (' + (w.reviewsCount || 0) + ' reseñas)</p>' +
        '</div>' +
      '</div>' +
      '<div class="public-profile__details">' +
        '<div class="public-profile__detail"><strong>' + escapeHtml(w.hourly || '$20/h') + '</strong><small>Tarifa</small></div>' +
        '<div class="public-profile__detail"><strong>' + escapeHtml(w.response || '15 min') + '</strong><small>Respuesta</small></div>' +
        '<div class="public-profile__detail"><strong>' + (w.experience || 3) + ' años</strong><small>Experiencia</small></div>' +
      '</div>' +
      (w.tags && w.tags.length ? '<div class="public-profile__tags">' + w.tags.map(function(t) { return '<span class="public-profile__tag">' + escapeHtml(t) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="public-profile__about"><h4>Sobre ' + escapeHtml(w.name.split(' ')[0]) + '</h4><p>' + escapeHtml(w.about || 'Profesional verificado en HoDe.') + '</p></div>' +
      (w.reviews && w.reviews.length ? '<div class="public-profile__reviews"><h4>Reseñas destacadas</h4>' + w.reviews.map(function(r) { return '<article class="public-profile__review"><strong>' + escapeHtml(r.author) + '</strong><p>' + escapeHtml(r.text) + '</p></article>'; }).join('') + '</div>' : '') +
      '<div class="public-profile__actions">' +
        '<button type="button" class="btn btn-primary" data-pp-action="contact" data-worker-id="' + w.id + '">Contactar</button>' +
        '<button type="button" class="btn btn-secondary" data-pp-action="hire" data-worker-id="' + w.id + '">Contratar</button>' +
      '</div>';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  modal.addEventListener('click', function(e) {
    if (e.target.closest('[data-close-public-profile]')) { close(); return; }
    var btn = e.target.closest('[data-pp-action]');
    if (!btn) return;
    var workerId = Number(btn.getAttribute('data-worker-id'));
    var worker = window.HodeWorkers && window.HodeWorkers.findById(workerId);
    if (!worker) return;
    if (btn.getAttribute('data-pp-action') === 'contact') {
      window.dispatchEvent(new CustomEvent('hode:startChat', { detail: { worker: worker } }));
    } else if (btn.getAttribute('data-pp-action') === 'hire') {
      window.dispatchEvent(new CustomEvent('hode:openHiring', { detail: { worker: worker } }));
    }
    close();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  window.addEventListener('hode:openPublicProfile', function(e) {
    var w = e.detail && e.detail.worker;
    if (w) open(w);
  });

  window.HodePublicProfile = { open: open, close: close };
}
