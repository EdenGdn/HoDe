// Módulo de mapa de búsqueda avanzada con Leaflet
function initMapSearch() {
  var mapContainer = document.getElementById('hode-map');
  var searchInput = document.getElementById('map-search-input');
  var locateBtn = document.getElementById('map-locate-btn');
  if (!mapContainer) return;

  var map = null;
  var markers = [];

  function waitForLeaflet(cb) {
    if (window.L) { cb(); return; }
    var tries = 0;
    var timer = setInterval(function() {
      tries++;
      if (window.L) { clearInterval(timer); cb(); }
      if (tries > 50) clearInterval(timer);
    }, 200);
  }

  function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function getWorkers() {
    if (window.HodeWorkers && typeof window.HodeWorkers.list === 'function') return window.HodeWorkers.list();
    return [];
  }

  function createPopup(w) {
    return '<div class="map-popup">' +
      '<strong>' + escapeHtml(w.name) + '</strong>' +
      '<p>' + escapeHtml(w.specialty) + ' · ' + escapeHtml(w.city) + '</p>' +
      '<p>' + '★'.repeat(Math.round(w.rating)) + ' ' + w.rating + '</p>' +
      '<div class="map-popup__actions">' +
        '<button class="btn btn-primary btn--sm" data-map-action="contact" data-worker-id="' + w.id + '">Contactar</button>' +
        '<button class="btn btn-secondary btn--sm" data-map-action="profile" data-worker-id="' + w.id + '">Ver perfil</button>' +
      '</div>' +
    '</div>';
  }

  function renderMarkers(filter) {
    markers.forEach(function(m) { map.removeLayer(m); });
    markers = [];
    var workers = getWorkers();
    var q = (filter || '').toLowerCase();

    workers.forEach(function(w) {
      var lat = w.lat || 4.711;
      var lng = w.lng || -74.072;
      var text = (w.name + ' ' + w.specialty + ' ' + w.city).toLowerCase();
      if (q && !text.includes(q)) return;

      var marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(createPopup(w), { maxWidth: 260 });
      markers.push(marker);
    });
  }

  function initMap() {
    map = L.map('hode-map').setView([4.711, -74.0721], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    renderMarkers('');

    // Fix tiles when container transitions from hidden/faded to visible
    setTimeout(function() { map.invalidateSize(); }, 400);
    setTimeout(function() { map.invalidateSize(); }, 1200);

    var visObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          map.invalidateSize();
        }
      });
    });
    visObserver.observe(mapContainer);

    // Delegated click for popup actions
    mapContainer.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-map-action]');
      if (!btn) return;
      var wId = Number(btn.getAttribute('data-worker-id'));
      var worker = window.HodeWorkers && window.HodeWorkers.findById(wId);
      if (!worker) return;
      if (btn.getAttribute('data-map-action') === 'contact') {
        window.dispatchEvent(new CustomEvent('hode:startChat', { detail: { worker: worker } }));
      } else {
        window.dispatchEvent(new CustomEvent('hode:openPublicProfile', { detail: { worker: worker } }));
      }
    });
  }

  waitForLeaflet(initMap);

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      if (map) renderMarkers(searchInput.value);
    });
  }

  if (locateBtn) {
    locateBtn.addEventListener('click', function() {
      if (!navigator.geolocation || !map) return;
      navigator.geolocation.getCurrentPosition(function(pos) {
        map.setView([pos.coords.latitude, pos.coords.longitude], 12);
      });
    });
  }
}
