// Módulo de historial de contrataciones
function initHiringHistory() {
  var section = document.getElementById('hiring-history');
  var listNode = document.getElementById('hiring-list');
  if (!section || !listNode) return;

  var hirings = [];
  var filter = 'all';

  function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function timeAgo(d) {
    var secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (secs < 60) return 'Hace un momento';
    var mins = Math.floor(secs / 60);
    if (mins < 60) return 'Hace ' + mins + ' min';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return 'Hace ' + hrs + 'h';
    var days = Math.floor(hrs / 24);
    return 'Hace ' + days + 'd';
  }

  function statusLabel(s) {
    var m = { pending: 'Pendiente', active: 'Activa', completed: 'Completada', cancelled: 'Cancelada' };
    return m[s] || s;
  }

  function render() {
    var filtered = filter === 'all' ? hirings : hirings.filter(function(h) { return h.status === filter; });
    if (!filtered.length) {
      listNode.innerHTML = '<p class="hiring-history__empty">No hay contrataciones' + (filter !== 'all' ? ' con este filtro' : '') + '.</p>';
      return;
    }
    listNode.innerHTML = filtered.map(function(h) {
      var statusCls = h.status === 'completed' ? 'success' : h.status === 'active' ? 'info' : h.status === 'pending' ? 'warn' : 'danger';
      var actions = '';
      if (h.status === 'pending') {
        actions = '<button class="btn btn--sm btn--primary" data-hiring-action="pay" data-id="' + h.id + '">💳 Pagar</button>' +
          '<button class="btn btn--sm btn--danger" data-hiring-action="cancel" data-id="' + h.id + '">Cancelar</button>';
      } else if (h.status === 'active') {
        actions = '<button class="btn btn--sm btn--success" data-hiring-action="complete" data-id="' + h.id + '">✓ Completar</button>';
      }
      return '<div class="hiring-card">' +
        '<div class="hiring-card__header">' +
          '<strong>#' + h.id + ' — ' + escapeHtml(h.workerName || 'Profesional #' + h.workerId) + '</strong>' +
          '<span class="hiring-badge hiring-badge--' + statusCls + '">' + statusLabel(h.status) + '</span>' +
        '</div>' +
        '<p class="hiring-card__desc">' + escapeHtml(h.description || 'Sin descripción') + '</p>' +
        '<div class="hiring-card__footer">' +
          '<span class="hiring-card__amount">$' + (h.amount || 0).toLocaleString() + '</span>' +
          '<span class="hiring-card__time">' + timeAgo(h.createdAt) + '</span>' +
          '<div class="hiring-card__actions">' + actions + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  async function load() {
    try {
      hirings = await window.HodeApi.listHirings();
      render();
    } catch (e) {
      listNode.innerHTML = '<p class="hiring-history__empty">Inicia sesión para ver tu historial.</p>';
    }
  }

  listNode.addEventListener('click', async function(e) {
    var btn = e.target.closest('[data-hiring-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-hiring-action');
    var id = Number(btn.getAttribute('data-id'));
    var hiring = hirings.find(function(h) { return h.id === id; });
    if (!hiring) return;

    if (action === 'pay') {
      window.dispatchEvent(new CustomEvent('hode:openPayment', { detail: { hiringId: hiring.id, workerId: hiring.workerId, workerName: hiring.workerName, amount: hiring.amount } }));
    } else if (action === 'cancel') {
      try { await window.HodeApi.updateHiringStatus(id, 'cancelled'); load(); } catch (e) { /* noop */ }
    } else if (action === 'complete') {
      try { await window.HodeApi.updateHiringStatus(id, 'completed'); load(); } catch (e) { /* noop */ }
    }
  });

  var filters = section.querySelectorAll('[data-hiring-filter]');
  filters.forEach(function(f) {
    f.addEventListener('click', function() {
      filter = f.getAttribute('data-hiring-filter');
      filters.forEach(function(b) { b.classList.remove('is-active'); });
      f.classList.add('is-active');
      render();
    });
  });

  window.addEventListener('hode:paymentCompleted', load);
  window.addEventListener('hode:authCompleted', function() {
    section.classList.remove('hiring-history--hidden');
    load();
  });
  window.addEventListener('hode:authLogout', function() {
    hirings = [];
    section.classList.add('hiring-history--hidden');
    listNode.innerHTML = '<p class="hiring-history__empty">Inicia sesión para ver tu historial.</p>';
  });

  window.addEventListener('hode:openHiring', async function(e) {
    var d = e.detail || {};
    if (d.workerId) {
      try {
        await window.HodeApi.createHiring({ workerId: d.workerId, description: d.description || 'Contratación', amount: d.amount || 0 });
        load();
        var hdr = document.querySelector('.header') ? document.querySelector('.header').offsetHeight : 0;
        window.scrollTo({ top: section.offsetTop - hdr - 20, behavior: 'smooth' });
      } catch (e) { /* noop */ }
    }
  });
}
