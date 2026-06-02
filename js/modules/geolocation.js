// Módulo de geolocalización para HoDe
function initGeolocation() {
  var STORAGE_KEY = 'hode_geolocation';
  var banner = document.getElementById('geoloc-banner');
  var bannerBtn = document.getElementById('geoloc-banner-btn');
  var bannerDismiss = document.getElementById('geoloc-banner-dismiss');
  var dashGeoBtn = document.getElementById('dashboard-geoloc-btn');
  var dashLocText = document.getElementById('dashboard-location-text');

  var cachedLocation = null;

  function loadCached() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) cachedLocation = JSON.parse(raw);
    } catch (e) { /* noop */ }
    return cachedLocation;
  }

  function saveLocation(data) {
    cachedLocation = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function reverseGeocode(lat, lon, cb) {
    var url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' +
      encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon) + '&addressdetails=1&accept-language=es';
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var addr = data && data.address ? data.address : {};
        var city = addr.city || addr.town || addr.village || addr.state || '';
        var country = addr.country || '';
        cb({ city: city, country: country, lat: lat, lon: lon });
      })
      .catch(function() { cb({ city: '', country: '', lat: lat, lon: lon }); });
  }

  function requestLocation(cb) {
    if (!navigator.geolocation) {
      cb(null, 'Geolocalización no soportada en este navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        reverseGeocode(pos.coords.latitude, pos.coords.longitude, function(loc) {
          saveLocation(loc);
          cb(loc, null);
        });
      },
      function(err) {
        var msg = 'No se pudo obtener la ubicación.';
        if (err.code === 1) msg = 'Permiso de ubicación denegado.';
        cb(null, msg);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  function updateUI(loc) {
    if (!loc) return;
    var label = loc.city ? (loc.city + (loc.country ? ', ' + loc.country : '')) : 'Ubicación detectada';
    if (dashLocText) dashLocText.textContent = '📍 ' + label;
    if (dashGeoBtn) dashGeoBtn.textContent = '✓ Ubicación activa';
    if (banner) banner.classList.add('is-hidden');

    window.dispatchEvent(new CustomEvent('hode:locationReady', { detail: loc }));
  }

  function handleGeoloc() {
    if (dashGeoBtn) {
      dashGeoBtn.textContent = '⏳ Obteniendo…';
      dashGeoBtn.disabled = true;
    }
    requestLocation(function(loc, err) {
      if (dashGeoBtn) {
        dashGeoBtn.disabled = false;
      }
      if (err) {
        if (dashLocText) dashLocText.textContent = err;
        if (dashGeoBtn) dashGeoBtn.textContent = '📍 Reintentar';
        return;
      }
      updateUI(loc);
    });
  }

  if (bannerBtn) {
    bannerBtn.addEventListener('click', function() {
      handleGeoloc();
    });
  }

  if (bannerDismiss) {
    bannerDismiss.addEventListener('click', function() {
      if (banner) banner.classList.add('is-hidden');
    });
  }

  if (dashGeoBtn) {
    dashGeoBtn.addEventListener('click', handleGeoloc);
  }

  // Auto-load cached location
  var cached = loadCached();
  if (cached && cached.city) {
    updateUI(cached);
  }

  // Listen for geolocation resolved from auth forms
  window.addEventListener('hode:geolocationResolved', function(e) {
    var detail = e.detail || {};
    if (detail.lat && detail.lon) {
      saveLocation({ city: detail.city || '', country: '', lat: detail.lat, lon: detail.lon });
      updateUI(cachedLocation);
    }
  });

  // Expose for other modules
  window.HodeGeolocation = {
    getLocation: function() { return cachedLocation; },
    request: handleGeoloc
  };
}
