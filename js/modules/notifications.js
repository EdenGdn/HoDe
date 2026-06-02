// Módulo de notificaciones push e in-app
function initNotifications() {
  var badge = document.getElementById('notif-badge');
  var readAllBtn = document.getElementById('notif-read-all');
  var pushBanner = document.getElementById('push-banner');
  var pushEnable = document.getElementById('push-enable');
  var pushDismiss = document.getElementById('push-dismiss');
  var dockList = document.getElementById('chat-dock-list');

  var pollTimer = null;

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function timeAgo(dateStr) {
    var diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return Math.floor(diff / 60) + ' min';
    if (diff < 86400) return Math.floor(diff / 3600) + ' h';
    return Math.floor(diff / 86400) + ' d';
  }

  function updateBadge(count) {
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  function renderNotifications(notifications) {
    if (!dockList) return;
    if (!notifications || !notifications.length) {
      dockList.innerHTML = '<p class="chat-dock__empty">Sin notificaciones nuevas.</p>';
      return;
    }
    dockList.innerHTML = notifications.map(function(n) {
      return '<button type="button" class="chat-dock__item' + (n.read ? '' : ' chat-dock__item--unread') + '" data-notif-id="' + n.id + '">' +
        '<strong>' + escapeHtml(n.title) + '</strong>' +
        '<small>' + escapeHtml(n.body) + '</small>' +
        '<span class="chat-dock__time">' + timeAgo(n.createdAt) + '</span>' +
        '</button>';
    }).join('');
  }

  async function fetchNotifications() {
    if (!window.HodeAuth || !window.HodeAuth.isAuthenticated()) return;
    try {
      var list = await window.HodeApi.listNotifications();
      var unread = list.filter(function(n) { return !n.read; }).length;
      updateBadge(unread);
      renderNotifications(list);
    } catch (e) { /* noop */ }
  }

  function startPolling() {
    fetchNotifications();
    pollTimer = setInterval(fetchNotifications, 15000);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    updateBadge(0);
    if (dockList) dockList.innerHTML = '';
  }

  // Mark single notification read
  if (dockList) {
    dockList.addEventListener('click', async function(e) {
      var btn = e.target.closest('[data-notif-id]');
      if (!btn) return;
      var id = Number(btn.getAttribute('data-notif-id'));
      try { await window.HodeApi.markNotificationRead(id); } catch (ex) { /* noop */ }
      btn.classList.remove('chat-dock__item--unread');
      fetchNotifications();
    });
  }

  // Mark all read
  if (readAllBtn) {
    readAllBtn.addEventListener('click', async function() {
      try { await window.HodeApi.markAllNotificationsRead(); } catch (ex) { /* noop */ }
      fetchNotifications();
    });
  }

  // Push permission banner
  function showPushBanner() {
    if (!pushBanner || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      pushBanner.classList.remove('push-banner--hidden');
    }
  }

  if (pushEnable) {
    pushEnable.addEventListener('click', function() {
      Notification.requestPermission().then(function() {
        pushBanner.classList.add('push-banner--hidden');
      });
    });
  }
  if (pushDismiss) {
    pushDismiss.addEventListener('click', function() {
      pushBanner.classList.add('push-banner--hidden');
    });
  }

  // Desktop notification helper
  function showDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: body, icon: 'icons/icon-192.png' });
    }
  }

  window.addEventListener('hode:authCompleted', function() {
    startPolling();
    showPushBanner();
  });
  window.addEventListener('hode:authLogout', stopPolling);
  window.addEventListener('hode:pushNotification', function(e) {
    var d = e.detail || {};
    showDesktopNotification(d.title || 'HoDe', d.body || '');
    fetchNotifications();
  });

  // Bootstrap
  if (window.HodeAuth && window.HodeAuth.isAuthenticated()) {
    startPolling();
    showPushBanner();
  }
}
