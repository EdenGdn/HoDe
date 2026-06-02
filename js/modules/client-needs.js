// Módulo de publicaciones de necesidades de clientes
function initClientNeeds() {
  /* ── DOM refs ── */
  var section = document.getElementById('client-needs-section');
  var toggleBtn = document.getElementById('toggle-client-needs');
  var listNode = document.getElementById('client-needs-list');
  var mySection = document.getElementById('my-client-needs');
  var myListNode = document.getElementById('my-client-needs-list');
  var formWrap = document.getElementById('client-need-form-wrap');
  var form = document.getElementById('client-need-form');
  var statusNode = document.getElementById('client-need-status');
  var searchInput = document.getElementById('client-needs-search');

  /* Client subscription refs */
  var subPanel = document.getElementById('client-sub-panel');
  var subTiersNode = document.getElementById('client-sub-tiers');
  var subCurrentNode = document.getElementById('client-sub-current');
  var subCurrentIcon = document.getElementById('client-sub-current-icon');
  var subCurrentName = document.getElementById('client-sub-current-name');
  var subCurrentDetail = document.getElementById('client-sub-current-detail');
  var subCancelBtn = document.getElementById('client-sub-cancel-btn');

  var currentClientSub = null;
  var needsVisible = false;

  var CLIENT_TIER_META = {
    preferente: { icon: '💎', color: 'preferente', label: 'HoDe Preferente' },
    elite: { icon: '👑', color: 'elite', label: 'HoDe Elite' }
  };

  var CLIENT_TIER_BENEFITS = {
    preferente: [
      '✅ Recomendaciones de los mejores técnicos verificados',
      '✅ Mayor visibilidad de tus publicaciones',
      '✅ Hasta 10 publicaciones de necesidades',
      '✅ Soporte prioritario por chat'
    ],
    elite: [
      '✅ Todo lo de HoDe Preferente',
      '✅ Sello exclusivo 👑 en tu perfil',
      '✅ 🤖 IA para redactar necesidades (próximamente)',
      '✅ Atención prioritaria 24/7',
      '✅ Acceso anticipado a nuevas funciones'
    ]
  };

  var CLIENT_TIER_PRICES = {
    preferente: 99,
    elite: 199
  };

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem('hode_session') || 'null'); } catch (e) { return null; }
  }

  function timeAgo(d) {
    var ms = Date.now() - new Date(d).getTime();
    var m = Math.floor(ms / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h';
    return Math.floor(h / 24) + 'd';
  }

  /* ── Toggle visibility ── */
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      needsVisible = !needsVisible;
      if (section) section.style.display = needsVisible ? '' : 'none';
      toggleBtn.textContent = needsVisible ? '✕ Cerrar publicaciones de clientes' : '📋 Publicaciones de clientes';
      if (needsVisible) loadPublicNeeds();
    });
  }

  /* ── Render public needs ── */
  async function loadPublicNeeds() {
    if (!listNode || !window.HodeApi) return;
    var search = searchInput ? searchInput.value : '';
    try {
      var needs = await window.HodeApi.listClientNeeds({ search: search });
      if (!needs || !needs.length) {
        listNode.innerHTML = '<p class="client-needs__empty">No hay publicaciones de clientes por el momento.</p>';
        return;
      }
      listNode.innerHTML = needs.map(function(n) {
        var subBadge = '';
        var session = getSession();
        var isWorker = session && session.role === 'pro';
        var respondBtn = isWorker
          ? '<button type="button" class="btn btn-primary client-need-card__respond" data-respond-need="' + n.id + '">💬 Responder</button>'
          : '';
        var respCount = n.responseCount ? '<span class="client-need-card__responses">💬 ' + n.responseCount + ' respuesta' + (n.responseCount !== 1 ? 's' : '') + '</span>' : '';
        return '<article class="client-need-card" data-need-id="' + n.id + '">' +
          '<div class="client-need-card__header">' +
            '<strong>' + escapeHtml(n.userName) + '</strong>' +
            '<span class="client-need-card__category">' + escapeHtml(n.category) + '</span>' +
            '<small class="client-need-card__time">' + timeAgo(n.createdAt) + '</small>' +
          '</div>' +
          '<h4 class="client-need-card__title">' + escapeHtml(n.title) + '</h4>' +
          '<p class="client-need-card__desc">' + escapeHtml(n.description) + '</p>' +
          '<div class="client-need-card__footer">' +
            '<span class="client-need-card__budget">💰 ' + escapeHtml(n.budget) + '</span>' +
            (n.city ? '<span class="client-need-card__city">📍 ' + escapeHtml(n.city) + '</span>' : '') +
            respCount +
            respondBtn +
          '</div>' +
          '<div class="client-need-card__respond-form" id="respond-form-' + n.id + '" style="display:none">' +
            '<textarea class="client-need-card__respond-textarea" placeholder="Describe cómo puedes ayudar..." maxlength="500" minlength="5"></textarea>' +
            '<div class="client-need-card__respond-actions">' +
              '<button type="button" class="btn btn-primary btn--sm" data-send-response="' + n.id + '">Enviar</button>' +
              '<button type="button" class="btn btn-secondary btn--sm" data-cancel-response="' + n.id + '">Cancelar</button>' +
            '</div>' +
            '<p class="client-need-card__respond-status" id="respond-status-' + n.id + '"></p>' +
          '</div>' +
        '</article>';
      }).join('');
    } catch (e) {
      listNode.innerHTML = '<p class="client-needs__empty">Error al cargar publicaciones.</p>';
    }
  }

  if (searchInput) {
    var searchTimer;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadPublicNeeds, 350);
    });
  }

  /* ── Respond to client needs ── */
  if (listNode) {
    listNode.addEventListener('click', function(e) {
      var respondBtn = e.target.closest('[data-respond-need]');
      if (respondBtn) {
        var needId = respondBtn.getAttribute('data-respond-need');
        var formEl = document.getElementById('respond-form-' + needId);
        if (formEl) formEl.style.display = formEl.style.display === 'none' ? '' : 'none';
        return;
      }
      var cancelBtn = e.target.closest('[data-cancel-response]');
      if (cancelBtn) {
        var cNeedId = cancelBtn.getAttribute('data-cancel-response');
        var cForm = document.getElementById('respond-form-' + cNeedId);
        if (cForm) cForm.style.display = 'none';
        return;
      }
      var sendBtn = e.target.closest('[data-send-response]');
      if (sendBtn) {
        var sNeedId = sendBtn.getAttribute('data-send-response');
        var sForm = document.getElementById('respond-form-' + sNeedId);
        var textarea = sForm ? sForm.querySelector('textarea') : null;
        var statusEl = document.getElementById('respond-status-' + sNeedId);
        if (!textarea || !textarea.value.trim() || textarea.value.trim().length < 5) {
          if (statusEl) { statusEl.textContent = 'El mensaje debe tener al menos 5 caracteres.'; statusEl.className = 'client-need-card__respond-status client-need-card__respond-status--error'; }
          return;
        }
        sendBtn.disabled = true;
        sendBtn.textContent = 'Enviando...';
        window.HodeApi.respondToNeed(Number(sNeedId), textarea.value.trim()).then(function() {
          if (statusEl) { statusEl.textContent = '✅ Respuesta enviada correctamente.'; statusEl.className = 'client-need-card__respond-status client-need-card__respond-status--ok'; }
          textarea.value = '';
          sendBtn.disabled = false;
          sendBtn.textContent = 'Enviar';
          loadPublicNeeds();
        }).catch(function(err) {
          if (statusEl) { statusEl.textContent = err.message || 'Error al enviar.'; statusEl.className = 'client-need-card__respond-status client-need-card__respond-status--error'; }
          sendBtn.disabled = false;
          sendBtn.textContent = 'Enviar';
        });
      }
    });
  }

  /* ── My needs (dashboard) ── */
  async function loadMyNeeds() {
    if (!myListNode || !window.HodeApi) return;
    var session = getSession();
    if (!session || session.role !== 'client') {
      if (mySection) mySection.style.display = 'none';
      return;
    }
    if (mySection) mySection.style.display = '';
    try {
      var needs = await window.HodeApi.listMyClientNeeds();
      renderMyNeeds(needs);
    } catch (e) {
      myListNode.innerHTML = '<p class="client-needs__empty">No se pudieron cargar tus publicaciones.</p>';
    }
  }

  function renderMyNeeds(needs) {
    if (!myListNode) return;
    if (!needs || !needs.length) {
      myListNode.innerHTML = '<p class="client-needs__empty">Aún no tienes publicaciones. ¡Publica tu primera necesidad!</p>';
      if (formWrap) formWrap.style.display = '';
      return;
    }
    myListNode.innerHTML = needs.map(function(n) {
      return '<div class="client-need-mine">' +
        '<div class="client-need-mine__header">' +
          '<strong>' + escapeHtml(n.title) + '</strong>' +
          '<span class="client-need-mine__category">' + escapeHtml(n.category) + '</span>' +
        '</div>' +
        '<p class="client-need-mine__desc">' + escapeHtml(n.description) + '</p>' +
        '<div class="client-need-mine__footer">' +
          '<span>💰 ' + escapeHtml(n.budget) + '</span>' +
          '<button type="button" class="btn btn-secondary" data-delete-need="' + n.id + '">Eliminar</button>' +
        '</div>' +
      '</div>';
    }).join('');

    if (formWrap) {
      var max = currentClientSub ? 10 : 3;
      formWrap.style.display = needs.length >= max ? 'none' : '';
    }
  }

  if (myListNode) {
    myListNode.addEventListener('click', async function(e) {
      var btn = e.target.closest('[data-delete-need]');
      if (!btn) return;
      var id = Number(btn.getAttribute('data-delete-need'));
      try {
        await window.HodeApi.deleteClientNeed(id);
        loadMyNeeds();
      } catch (err) {
        if (statusNode) { statusNode.textContent = err.message || 'Error al eliminar.'; statusNode.className = 'client-need__status client-need__status--error'; }
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (statusNode) statusNode.textContent = '';
      var data = new FormData(form);
      var payload = {
        title: String(data.get('title') || '').trim(),
        description: String(data.get('description') || '').trim(),
        category: String(data.get('category') || '').trim(),
        budget: String(data.get('budget') || '').trim()
      };
      try {
        await window.HodeApi.createClientNeed(payload);
        form.reset();
        if (statusNode) { statusNode.textContent = '¡Publicación creada!'; statusNode.className = 'client-need__status client-need__status--ok'; }
        loadMyNeeds();
      } catch (err) {
        if (statusNode) { statusNode.textContent = err.message || 'Error al publicar.'; statusNode.className = 'client-need__status client-need__status--error'; }
      }
    });
  }

  /* ── Client Subscriptions ── */
  function renderClientTiers() {
    if (!subTiersNode) return;
    var tiers = ['preferente', 'elite'];
    subTiersNode.innerHTML = tiers.map(function(tier) {
      var meta = CLIENT_TIER_META[tier];
      var benefits = CLIENT_TIER_BENEFITS[tier];
      var price = CLIENT_TIER_PRICES[tier];
      var isActive = currentClientSub && currentClientSub.tier === tier;
      var popular = tier === 'elite' ? '<span class="subscription-tier__popular">Recomendado</span>' : '';
      return '<div class="subscription-tier subscription-tier--' + meta.color + '">' +
        popular +
        '<div class="subscription-tier__icon">' + meta.icon + '</div>' +
        '<h4 class="subscription-tier__name">' + meta.label + '</h4>' +
        '<div class="subscription-tier__price">$' + price.toLocaleString('es-MX') + ' MXN <small>/mes</small></div>' +
        '<ul class="subscription-tier__benefits">' +
          benefits.map(function(b) { return '<li>' + b + '</li>'; }).join('') +
        '</ul>' +
        '<button type="button" class="btn btn-primary subscription-tier__cta' +
          (isActive ? ' subscription-tier__cta--active' : '') + '" data-client-subscribe="' + tier + '"' +
          (isActive ? ' disabled' : '') + '>' +
          (isActive ? 'Plan activo ✓' : 'Suscribirme') +
        '</button>' +
      '</div>';
    }).join('');
  }

  function renderClientCurrentSub() {
    if (!subCurrentNode) return;
    if (!currentClientSub || !currentClientSub.tier) {
      subCurrentNode.style.display = 'none';
      return;
    }
    var meta = CLIENT_TIER_META[currentClientSub.tier];
    if (subCurrentIcon) subCurrentIcon.textContent = meta.icon;
    if (subCurrentName) subCurrentName.textContent = meta.label;
    if (subCurrentDetail) subCurrentDetail.textContent = 'Suscrito · $' + CLIENT_TIER_PRICES[currentClientSub.tier].toLocaleString('es-MX') + ' MXN/mes';
    subCurrentNode.style.display = '';
  }

  async function loadClientSubscription() {
    var session = getSession();
    if (!session || session.role !== 'client' || !window.HodeApi) return;
    try {
      var sub = await window.HodeApi.getMyClientSubscription();
      currentClientSub = sub && sub.tier ? sub : null;
    } catch (e) {
      currentClientSub = null;
    }
    renderClientCurrentSub();
    renderClientTiers();
  }

  if (subTiersNode) {
    subTiersNode.addEventListener('click', async function(e) {
      var btn = e.target.closest('[data-client-subscribe]');
      if (!btn || btn.disabled) return;
      var tier = btn.getAttribute('data-client-subscribe');
      btn.disabled = true;
      btn.textContent = 'Procesando...';
      try {
        await window.HodeApi.clientSubscribe(tier);
        currentClientSub = { tier: tier };
        renderClientCurrentSub();
        renderClientTiers();
      } catch (err) {
        btn.textContent = err.message || 'Error';
        btn.disabled = false;
      }
    });
  }

  if (subCancelBtn) {
    subCancelBtn.addEventListener('click', async function() {
      if (!currentClientSub) return;
      try {
        await window.HodeApi.cancelClientSubscription();
        currentClientSub = null;
        renderClientCurrentSub();
        renderClientTiers();
      } catch (e) { /* noop */ }
    });
  }

  /* ── Auth events ── */
  window.addEventListener('hode:authCompleted', function() {
    loadMyNeeds();
    loadClientSubscription();
    var session = getSession();
    if (session && session.role === 'client') {
      if (subPanel) subPanel.style.display = '';
    }
  });

  window.addEventListener('hode:authLogout', function() {
    currentClientSub = null;
    if (mySection) mySection.style.display = 'none';
    if (subPanel) subPanel.style.display = 'none';
    if (subCurrentNode) subCurrentNode.style.display = 'none';
    renderClientTiers();
  });

  /* ── Bootstrap ── */
  if (section) section.style.display = 'none';
  var existing = getSession();
  if (existing && existing.role === 'client') {
    loadMyNeeds();
    loadClientSubscription();
    if (subPanel) subPanel.style.display = '';
  } else {
    if (mySection) mySection.style.display = 'none';
    if (subPanel) subPanel.style.display = 'none';
  }

  window.HodeClientNeeds = {
    refresh: loadPublicNeeds,
    refreshMine: loadMyNeeds,
    getCurrentTier: function() { return currentClientSub ? currentClientSub.tier : null; }
  };
}
