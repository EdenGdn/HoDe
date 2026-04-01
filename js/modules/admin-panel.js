// Módulo de panel de administración
function initAdminPanel() {
  var section = document.getElementById('admin-panel');
  var statsNode = document.getElementById('admin-stats');
  var tabsNode = document.getElementById('admin-tabs');
  var contentNode = document.getElementById('admin-content');
  if (!section || !statsNode || !tabsNode || !contentNode) return;

  var currentTab = 'users';

  function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function isAdmin() {
    var session = null;
    try { session = JSON.parse(localStorage.getItem('hode_session') || 'null'); } catch (e) { /* noop */ }
    return session && session.id === 1;
  }

  function show() {
    if (!isAdmin()) return;
    section.classList.remove('admin-panel--hidden');
    loadStats();
    loadTab(currentTab);
    var hdr = document.querySelector('.header') ? document.querySelector('.header').offsetHeight : 0;
    window.scrollTo({ top: section.offsetTop - hdr - 20, behavior: 'smooth' });
  }

  async function loadStats() {
    try {
      var s = await window.HodeApi.adminStats();
      statsNode.innerHTML =
        '<div class="admin-stat"><strong>' + s.users + '</strong><span>Usuarios</span></div>' +
        '<div class="admin-stat"><strong>' + s.workers + '</strong><span>Profesionales</span></div>' +
        '<div class="admin-stat"><strong>' + s.hirings + '</strong><span>Contrataciones</span></div>' +
        '<div class="admin-stat"><strong>' + s.payments + '</strong><span>Pagos</span></div>' +
        '<div class="admin-stat"><strong>$' + (s.revenue || 0).toLocaleString() + '</strong><span>Ingresos</span></div>' +
        '<div class="admin-stat"><strong>' + s.reviews + '</strong><span>Reseñas</span></div>';
    } catch (e) {
      statsNode.innerHTML = '<p class="admin-panel__error">No se pudieron cargar estadísticas.</p>';
    }
  }

  var tabConfig = {
    users: { fetch: function() { return window.HodeApi.adminUsers(); }, cols: ['ID', 'Nombre', 'Email', 'Rol', 'Ciudad', 'Fecha'], keys: ['id', 'name', 'email', 'role', 'city', 'createdAt'] },
    hirings: { fetch: function() { return window.HodeApi.adminHirings(); }, cols: ['ID', 'Usuario', 'Profesional', 'Monto', 'Estado', 'Fecha'], keys: ['id', 'userId', 'workerId', 'amount', 'status', 'createdAt'] },
    payments: { fetch: function() { return window.HodeApi.adminPayments(); }, cols: ['ID', 'Contratación', 'Método', 'Monto', 'Estado', 'Fecha'], keys: ['id', 'hiringId', 'method', 'amount', 'status', 'createdAt'] },
    reviews: { fetch: function() { return window.HodeApi.adminReviews(); }, cols: ['ID', 'Usuario', 'Rating', 'Texto', 'Fecha'], keys: ['id', 'userName', 'rating', 'text', 'createdAt'] },
    workers: { fetch: function() { return window.HodeApi.adminWorkers(); }, cols: ['ID', 'Nombre', 'Especialidad', 'Ciudad', 'Rating', 'Verificado'], keys: ['id', 'name', 'specialty', 'city', 'rating', 'verified'] }
  };

  function formatCell(key, val) {
    if (key === 'createdAt' && val) return new Date(val).toLocaleDateString('es');
    if (key === 'amount' && typeof val === 'number') return '$' + val.toLocaleString();
    if (key === 'status') {
      var cls = val === 'completed' ? 'success' : val === 'pending' ? 'warn' : val === 'active' ? 'info' : 'danger';
      return '<span class="admin-badge admin-badge--' + cls + '">' + escapeHtml(val) + '</span>';
    }
    if (key === 'verified') return val ? '✅' : '❌';
    return escapeHtml(String(val != null ? val : ''));
  }

  async function loadTab(tab) {
    currentTab = tab;
    var cfg = tabConfig[tab];
    if (!cfg) return;
    contentNode.innerHTML = '<p class="admin-panel__empty">Cargando...</p>';
    try {
      var data = await cfg.fetch();
      if (!data.length) { contentNode.innerHTML = '<p class="admin-panel__empty">Sin datos.</p>'; return; }
      var html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
        cfg.cols.map(function(c) { return '<th>' + c + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
        data.map(function(row) {
          return '<tr>' + cfg.keys.map(function(k) { return '<td>' + formatCell(k, row[k]) + '</td>'; }).join('') + '</tr>';
        }).join('') +
        '</tbody></table></div>';
      contentNode.innerHTML = html;
    } catch (e) {
      contentNode.innerHTML = '<p class="admin-panel__error">Error al cargar datos.</p>';
    }
  }

  tabsNode.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-admin-tab]');
    if (!btn) return;
    Array.from(tabsNode.querySelectorAll('.admin-panel__tab')).forEach(function(t) { t.classList.remove('is-active'); });
    btn.classList.add('is-active');
    loadTab(btn.getAttribute('data-admin-tab'));
  });

  window.addEventListener('hode:showAdmin', show);
  window.addEventListener('hode:authCompleted', function() { if (isAdmin()) show(); });
  window.addEventListener('hode:authLogout', function() { section.classList.add('admin-panel--hidden'); });
}
