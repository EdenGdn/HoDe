// Módulo de suscripciones para trabajadores HoDe
function initSubscriptions() {
  var tiersContainer = document.getElementById('subscription-tiers');
  var currentContainer = document.getElementById('subscription-current');
  var cancelBtn = document.getElementById('sub-cancel-btn');
  var subCurrentIcon = document.getElementById('sub-current-icon');
  var subCurrentName = document.getElementById('sub-current-name');
  var subCurrentDetail = document.getElementById('sub-current-detail');
  var maxSlotsNode = document.getElementById('svc-max-slots');

  // Recommended carousel
  var carouselTrack = document.getElementById('recommended-track');
  var carouselSection = document.getElementById('recommended-carousel');
  var prevBtn = document.getElementById('carousel-prev');
  var nextBtn = document.getElementById('carousel-next');

  var currentSub = null;

  var TIER_META = {
    plus: { icon: '⭐', color: 'plus', label: 'HoDe Plus' },
    pro: { icon: '🔥', color: 'pro', label: 'HoDe Pro' },
    master: { icon: '👑', color: 'master', label: 'HoDe Master' }
  };

  var TIER_BENEFITS = {
    plus: [
      '✅ 7 publicaciones extra (10 total)',
      '✅ Apareces en el carrusel "Técnicos Recomendados"',
      '✅ Sello visual ⭐ en tu perfil',
      '✅ Mayor visibilidad en búsquedas'
    ],
    pro: [
      '✅ Todo lo de HoDe Plus',
      '✅ Notificaciones prioritarias de trabajos nuevos',
      '✅ Recibes alertas antes que otros técnicos',
      '✅ Sello visual 🔥 destacado'
    ],
    master: [
      '✅ Todo lo de HoDe Pro',
      '✅ Fotos de trabajos resaltadas con borde premium',
      '✅ Panel de analíticas: vistas, contactos y ranking',
      '✅ Sello visual 👑 exclusivo',
      '✅ Posición prioritaria en resultados de búsqueda'
    ]
  };

  var TIER_PRICES = {
    plus: 149,
    pro: 299,
    master: 549
  };

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem('hode_session') || 'null');
    } catch (e) {
      return null;
    }
  }

  function renderTiers() {
    if (!tiersContainer) return;
    var tiers = ['plus', 'pro', 'master'];
    tiersContainer.innerHTML = tiers.map(function(tier) {
      var meta = TIER_META[tier];
      var benefits = TIER_BENEFITS[tier];
      var price = TIER_PRICES[tier];
      var isActive = currentSub && currentSub.tier === tier;
      var popular = tier === 'pro' ? '<span class="subscription-tier__popular">Más popular</span>' : '';
      return '<div class="subscription-tier subscription-tier--' + meta.color + '">' +
        popular +
        '<div class="subscription-tier__icon">' + meta.icon + '</div>' +
        '<h4 class="subscription-tier__name">' + meta.label + '</h4>' +
        '<div class=\"subscription-tier__price\">$' + price.toLocaleString('es-MX') + ' MXN <small>/mes</small></div>' +
        '<ul class="subscription-tier__benefits">' +
          benefits.map(function(b) { return '<li>' + b + '</li>'; }).join('') +
        '</ul>' +
        '<button type="button" class="btn btn-primary subscription-tier__cta' +
          (isActive ? ' subscription-tier__cta--active' : '') + '" data-subscribe="' + tier + '"' +
          (isActive ? ' disabled' : '') + '>' +
          (isActive ? 'Plan activo ✓' : 'Suscribirme') +
        '</button>' +
      '</div>';
    }).join('');
  }

  function renderCurrent() {
    if (!currentContainer) return;
    if (!currentSub || !currentSub.tier) {
      currentContainer.style.display = 'none';
      return;
    }
    var meta = TIER_META[currentSub.tier];
    if (subCurrentIcon) subCurrentIcon.textContent = meta.icon;
    if (subCurrentName) subCurrentName.textContent = meta.label;
    if (subCurrentDetail) subCurrentDetail.textContent = 'Suscrito · $' + TIER_PRICES[currentSub.tier].toLocaleString('es-MX') + ' MXN/mes';
    currentContainer.style.display = '';

    if (maxSlotsNode) {
      maxSlotsNode.textContent = '10';
    }
  }

  async function loadSubscription() {
    var session = getSession();
    if (!session || session.role !== 'pro' || !window.HodeApi) return;
    try {
      var sub = await window.HodeApi.getMySubscription();
      currentSub = sub && sub.tier ? sub : null;
    } catch (e) {
      currentSub = null;
    }
    renderCurrent();
    renderTiers();
  }

  if (tiersContainer) {
    tiersContainer.addEventListener('click', async function(e) {
      var btn = e.target.closest('[data-subscribe]');
      if (!btn || btn.disabled) return;
      var tier = btn.getAttribute('data-subscribe');
      btn.disabled = true;
      btn.textContent = 'Procesando...';
      try {
        await window.HodeApi.subscribe(tier);
        currentSub = { tier: tier };
        renderCurrent();
        renderTiers();
        loadRecommendedCarousel();
        window.dispatchEvent(new CustomEvent('hode:subscriptionChanged', { detail: { tier: tier } }));
      } catch (err) {
        btn.textContent = err.message || 'Error';
        btn.disabled = false;
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', async function() {
      if (!currentSub) return;
      try {
        await window.HodeApi.cancelSubscription();
        currentSub = null;
        renderCurrent();
        renderTiers();
        if (maxSlotsNode) maxSlotsNode.textContent = '3';
        loadRecommendedCarousel();
        window.dispatchEvent(new CustomEvent('hode:subscriptionChanged', { detail: { tier: null } }));
      } catch (err) {
        // noop
      }
    });
  }

  /* ── Recommended Carousel ── */
  function starString(r) {
    return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
  }

  async function loadRecommendedCarousel() {
    if (!carouselTrack) return;
    var session = getSession();
    var city = (session && session.city) || '';
    try {
      var cached = null;
      try { cached = JSON.parse(localStorage.getItem('hode_geolocation') || 'null'); } catch (e) { /* noop */ }
      if (cached && cached.city) city = cached.city;
    } catch (e) { /* noop */ }

    try {
      var workers = await window.HodeApi.getRecommendedWorkers(city);
      if (!workers || !workers.length) {
        if (carouselSection) carouselSection.style.display = 'none';
        return;
      }
      if (carouselSection) carouselSection.style.display = '';
      carouselTrack.innerHTML = workers.map(function(w) {
        var tierClass = w.subscription ? ' recommended-card--' + w.subscription.tier : '';
        var sealHtml = '';
        if (w.subscription && TIER_META[w.subscription.tier]) {
          var meta = TIER_META[w.subscription.tier];
          sealHtml = '<div class="recommended-card__seal"><span class="worker-seal worker-seal--' + meta.color + '">' +
            meta.icon + ' ' + meta.label + '</span></div>';
        }
        return '<article class="recommended-card' + tierClass + '">' +
          '<div class="recommended-card__avatar">' + escapeHtml(w.name.charAt(0)) + '</div>' +
          sealHtml +
          '<h3 class="recommended-card__name">' + escapeHtml(w.name) + '</h3>' +
          '<p class="recommended-card__specialty">' + escapeHtml(w.specialty) + ' · ' + escapeHtml(w.city) + '</p>' +
          '<div class="recommended-card__rating">' + starString(w.rating || 5) + ' ' + (w.rating || 5).toFixed(1) + '</div>' +
          '<div class="recommended-card__actions">' +
            '<button type="button" class="btn btn-primary" data-rec-contact="' + w.id + '">Contactar</button>' +
            '<button type="button" class="btn btn-secondary" data-rec-profile="' + w.id + '">Perfil</button>' +
          '</div>' +
        '</article>';
      }).join('');
    } catch (e) {
      if (carouselSection) carouselSection.style.display = 'none';
    }
  }

  if (carouselTrack) {
    carouselTrack.addEventListener('click', function(e) {
      var contactBtn = e.target.closest('[data-rec-contact]');
      var profileBtn = e.target.closest('[data-rec-profile]');
      if (contactBtn) {
        var wid = Number(contactBtn.getAttribute('data-rec-contact'));
        var worker = window.HodeWorkers && window.HodeWorkers.findById(wid);
        if (worker) {
          window.dispatchEvent(new CustomEvent('hode:startChat', { detail: { worker: worker } }));
        }
      }
      if (profileBtn) {
        var wid2 = Number(profileBtn.getAttribute('data-rec-profile'));
        var worker2 = window.HodeWorkers && window.HodeWorkers.findById(wid2);
        if (worker2) {
          window.dispatchEvent(new CustomEvent('hode:openPublicProfile', { detail: { worker: worker2 } }));
        }
      }
    });
  }

  // Carousel navigation
  if (prevBtn && carouselTrack) {
    prevBtn.addEventListener('click', function() {
      carouselTrack.scrollBy({ left: -300, behavior: 'smooth' });
    });
  }
  if (nextBtn && carouselTrack) {
    nextBtn.addEventListener('click', function() {
      carouselTrack.scrollBy({ left: 300, behavior: 'smooth' });
    });
  }

  // Event listeners
  window.addEventListener('hode:authCompleted', function() {
    loadSubscription();
    loadRecommendedCarousel();
  });

  window.addEventListener('hode:authLogout', function() {
    currentSub = null;
    if (currentContainer) currentContainer.style.display = 'none';
    renderTiers();
  });

  window.addEventListener('hode:locationReady', function() {
    loadRecommendedCarousel();
  });

  // Bootstrap
  loadRecommendedCarousel();
  var existing = getSession();
  if (existing && existing.role === 'pro') {
    loadSubscription();
  }

  window.HodeSubscriptions = {
    getCurrentTier: function() { return currentSub ? currentSub.tier : null; },
    refresh: loadSubscription,
    refreshCarousel: loadRecommendedCarousel
  };
}
