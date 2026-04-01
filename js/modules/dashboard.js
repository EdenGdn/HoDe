// Módulo de dashboard post-login para HoDe
function initDashboard() {
  var dashboard = document.getElementById('dashboard');
  var userName = document.getElementById('dashboard-user-name');
  var dashRole = document.getElementById('dash-role');
  var dashEmail = document.getElementById('dash-email');
  var dashCity = document.getElementById('dash-city');
  var logoutBtn = document.getElementById('dashboard-logout');
  var nearbyList = document.getElementById('dashboard-nearby-list');
  var proSection = document.getElementById('dashboard-pro-section');
  var servicesList = document.getElementById('dashboard-services-list');
  var serviceForm = document.getElementById('dashboard-service-form');
  var serviceFormWrap = document.getElementById('dashboard-services-form-wrap');
  var svcStatus = document.getElementById('svc-status');

  if (!dashboard) return;

  function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function showDashboard(session) {
    if (!session) return;
    if (userName) userName.textContent = session.name || 'Usuario';
    if (dashRole) dashRole.textContent = session.role === 'pro' ? 'Profesional' : 'Cliente';
    if (dashEmail) dashEmail.textContent = session.email || '';
    if (dashCity) dashCity.textContent = session.city || 'Sin definir';
    dashboard.classList.remove('dashboard--hidden');

    if (session.role === 'pro' && proSection) {
      proSection.classList.remove('dashboard__pro-section--hidden');
      loadServices();
    } else if (proSection) {
      proSection.classList.add('dashboard__pro-section--hidden');
    }
  }

  function hideDashboard() {
    dashboard.classList.add('dashboard--hidden');
    if (proSection) proSection.classList.add('dashboard__pro-section--hidden');
  }

  /* ── Services management ── */
  async function loadServices() {
    if (!servicesList || !window.HodeApi) return;
    try {
      var services = await window.HodeApi.listMyServices();
      renderServices(services);
    } catch (e) {
      servicesList.innerHTML = '<p class="dashboard__empty">No se pudieron cargar tus servicios.</p>';
    }
  }

  function renderServices(services) {
    if (!servicesList) return;
    if (!services || !services.length) {
      servicesList.innerHTML = '<p class="dashboard__empty">Aún no tienes publicaciones. ¡Crea tu primer servicio!</p>';
      if (serviceFormWrap) serviceFormWrap.style.display = '';
      return;
    }
    servicesList.innerHTML = services.map(function(svc) {
      return '<div class="dashboard__service-card">' +
        '<div class="dashboard__service-header">' +
          '<strong>' + escapeHtml(svc.title) + '</strong>' +
          '<span class="dashboard__service-category">' + escapeHtml(svc.category) + '</span>' +
        '</div>' +
        '<p class="dashboard__service-desc">' + escapeHtml(svc.description) + '</p>' +
        '<div class="dashboard__service-footer">' +
          '<span class="dashboard__service-price">$' + Number(svc.price).toFixed(2) + '</span>' +
          '<button type="button" class="btn btn-secondary dashboard__service-delete" data-delete-svc="' + svc.id + '">Eliminar</button>' +
        '</div>' +
      '</div>';
    }).join('');

    if (serviceFormWrap) {
      serviceFormWrap.style.display = services.length >= 3 ? 'none' : '';
    }
  }

  if (serviceForm) {
    serviceForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (svcStatus) svcStatus.textContent = '';
      var data = new FormData(serviceForm);
      var payload = {
        title: String(data.get('title') || '').trim(),
        description: String(data.get('description') || '').trim(),
        category: String(data.get('category') || '').trim(),
        price: Number(data.get('price') || 0)
      };
      try {
        await window.HodeApi.createService(payload);
        serviceForm.reset();
        if (svcStatus) { svcStatus.textContent = '¡Servicio publicado!'; svcStatus.className = 'dashboard__svc-status dashboard__svc-status--ok'; }
        loadServices();
      } catch (err) {
        if (svcStatus) { svcStatus.textContent = err.message || 'Error al publicar.'; svcStatus.className = 'dashboard__svc-status dashboard__svc-status--error'; }
      }
    });
  }

  if (servicesList) {
    servicesList.addEventListener('click', async function(e) {
      var btn = e.target.closest('[data-delete-svc]');
      if (!btn) return;
      var id = Number(btn.getAttribute('data-delete-svc'));
      try {
        await window.HodeApi.deleteService(id);
        loadServices();
      } catch (err) {
        if (svcStatus) { svcStatus.textContent = err.message || 'Error al eliminar.'; svcStatus.className = 'dashboard__svc-status dashboard__svc-status--error'; }
      }
    });
  }

  function renderNearbyProfessionals(city) {
    if (!nearbyList || !window.HodeWorkers) return;
    var workers = window.HodeWorkers.list();
    if (!workers || !workers.length) return;

    var matched = [];
    var others = [];
    var cityLower = (city || '').toLowerCase();

    workers.forEach(function(w) {
      if (cityLower && w.city && w.city.toLowerCase() === cityLower) {
        matched.push(w);
      } else {
        others.push(w);
      }
    });

    var toShow = matched.concat(others).slice(0, 6);

    if (!toShow.length) {
      nearbyList.innerHTML = '<p class="dashboard__empty">No hay profesionales disponibles.</p>';
      return;
    }

    nearbyList.innerHTML = toShow.map(function(w) {
      var isLocal = cityLower && w.city && w.city.toLowerCase() === cityLower;
      return '<button type="button" class="dashboard__nearby-card" data-worker-id="' + w.id + '">' +
        '<div class="dashboard__nearby-avatar">' + w.name.charAt(0) + '</div>' +
        '<div class="dashboard__nearby-info">' +
        '<strong>' + w.name + (isLocal ? ' 📍' : '') + '</strong>' +
        '<small>' + w.specialty + ' · ' + w.city + '</small>' +
        '</div></button>';
    }).join('');
  }

  // Quick action buttons
  dashboard.addEventListener('click', function(e) {
    var action = e.target.closest('[data-dash-action]');
    if (!action) {
      var workerCard = e.target.closest('[data-worker-id]');
      if (workerCard) {
        var workerId = Number(workerCard.getAttribute('data-worker-id'));
        var worker = window.HodeWorkers && window.HodeWorkers.findById(workerId);
        if (worker) {
          window.dispatchEvent(new CustomEvent('hode:startChat', { detail: { worker: worker } }));
        }
      }
      return;
    }

    var act = action.getAttribute('data-dash-action');
    if (act === 'messages') {
      window.dispatchEvent(new CustomEvent('hode:openMessagesPanel'));
    } else if (act === 'settings') {
      window.dispatchEvent(new CustomEvent('hode:openSettingsPanel'));
    } else if (act === 'profile') {
      window.dispatchEvent(new CustomEvent('hode:openProfilePanel'));
    } else if (act === 'history') {
      var historySection = document.getElementById('hiring-history');
      if (historySection) {
        historySection.classList.remove('hiring-history--hidden');
        var headerH2 = document.querySelector('.header') ? document.querySelector('.header').offsetHeight : 0;
        window.scrollTo({ top: historySection.offsetTop - headerH2 - 20, behavior: 'smooth' });
      }
    } else if (act === 'admin') {
      window.dispatchEvent(new CustomEvent('hode:showAdmin'));
    } else if (act === 'search') {
      var proSection = document.getElementById('professionals');
      if (proSection) {
        var headerH = document.querySelector('.header') ? document.querySelector('.header').offsetHeight : 0;
        window.scrollTo({ top: proSection.offsetTop - headerH - 20, behavior: 'smooth' });
        var searchInput = document.getElementById('worker-search');
        if (searchInput) searchInput.focus();
      }
    }
  });

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
      if (window.HodeAuth && typeof window.HodeAuth.logout === 'function') {
        await window.HodeAuth.logout();
      }
    });
  }

  // Listen for auth events
  window.addEventListener('hode:authCompleted', function(e) {
    var detail = e.detail || {};
    var session = detail.session || (window.HodeAuth && window.HodeAuth.getSession());
    if (session) {
      showDashboard(session);
      renderNearbyProfessionals(session.city || '');
    }
  });

  window.addEventListener('hode:authLogout', function() {
    hideDashboard();
  });

  // When location is resolved, refresh nearby list
  window.addEventListener('hode:locationReady', function(e) {
    var loc = e.detail || {};
    if (loc.city) {
      if (dashCity) dashCity.textContent = loc.city;
      renderNearbyProfessionals(loc.city);
    }
  });

  // Bootstrap: check if already logged in
  var existing = null;
  try {
    existing = JSON.parse(localStorage.getItem('hode_session') || 'null');
  } catch (ex) { /* noop */ }
  if (existing) {
    showDashboard(existing);
    renderNearbyProfessionals(existing.city || '');
  }
}
