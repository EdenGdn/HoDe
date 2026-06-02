// Módulo de analíticas para trabajadores Master
function initAnalytics() {
  var panel = document.getElementById('analytics-panel');
  var statsNode = document.getElementById('analytics-stats');
  var chartBars = document.getElementById('analytics-chart-bars');
  var rankingNode = document.getElementById('analytics-ranking');
  if (!panel || !statsNode) return;

  function getSession() {
    try { return JSON.parse(localStorage.getItem('hode_session') || 'null'); } catch (e) { return null; }
  }

  async function load() {
    var session = getSession();
    if (!session || session.role !== 'pro') { panel.classList.add('analytics-panel--hidden'); return; }
    /* Check if Master tier */
    if (!window.HodeSubscriptions || window.HodeSubscriptions.getCurrentTier() !== 'master') {
      panel.classList.add('analytics-panel--hidden');
      return;
    }
    panel.classList.remove('analytics-panel--hidden');

    try {
      var data = await window.HodeApi.getMyAnalytics();
      renderStats(data);
      renderChart(data);
      renderRanking(data);
    } catch (e) {
      panel.classList.add('analytics-panel--hidden');
    }
  }

  function renderStats(data) {
    var convRate = data.views > 0 ? ((data.contacts / data.views) * 100).toFixed(1) : '0';
    statsNode.innerHTML =
      '<div class="analytics-stat">' +
        '<span class="analytics-stat__value">' + data.views + '</span>' +
        '<span class="analytics-stat__label">Vistas de perfil</span>' +
      '</div>' +
      '<div class="analytics-stat">' +
        '<span class="analytics-stat__value">' + data.contacts + '</span>' +
        '<span class="analytics-stat__label">Contactos recibidos</span>' +
      '</div>' +
      '<div class="analytics-stat">' +
        '<span class="analytics-stat__value">' + convRate + '%</span>' +
        '<span class="analytics-stat__label">Tasa de conversión</span>' +
      '</div>' +
      '<div class="analytics-stat">' +
        '<span class="analytics-stat__value">#' + data.ranking + '</span>' +
        '<span class="analytics-stat__label">Ranking de ' + data.totalWorkers + '</span>' +
      '</div>';
  }

  function renderChart(data) {
    if (!chartBars) return;
    var viewsByDay = data.viewsByDay || {};
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      var key = d.toISOString().slice(0, 10);
      var label = d.toLocaleDateString('es-MX', { weekday: 'short' });
      days.push({ key: key, label: label, value: viewsByDay[key] || 0 });
    }
    var maxVal = Math.max.apply(null, days.map(function(d) { return d.value; })) || 1;

    chartBars.innerHTML = days.map(function(d) {
      var h = Math.max(4, (d.value / maxVal) * 100);
      return '<div class="analytics-chart-bar" style="height:' + h + '%">' +
        '<span class="analytics-chart-bar__value">' + d.value + '</span>' +
        '<span class="analytics-chart-bar__label">' + d.label + '</span>' +
      '</div>';
    }).join('');
  }

  function renderRanking(data) {
    if (!rankingNode) return;
    rankingNode.innerHTML =
      '<strong>🏆 Posición #' + data.ranking + '</strong>' +
      '<small>de ' + data.totalWorkers + ' profesionales registrados</small>';
  }

  window.addEventListener('hode:authCompleted', function() { setTimeout(load, 500); });
  window.addEventListener('hode:authLogout', function() { panel.classList.add('analytics-panel--hidden'); });
  window.addEventListener('hode:subscriptionChanged', function() { setTimeout(load, 300); });

  // Bootstrap
  var existing = getSession();
  if (existing && existing.role === 'pro') { setTimeout(load, 500); }

  window.HodeAnalytics = { refresh: load };
}
