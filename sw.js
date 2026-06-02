// HoDe Service Worker – cache-first for static, network-only for API
var CACHE_NAME = 'hode-v1';
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/script.js',
  '/js/polyfills.js',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  // Network-only for API calls
  if (url.pathname.startsWith('/api/')) return;
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        }
        return response;
      });
    }).catch(function() {
      if (event.request.mode === 'navigate') return caches.match('/index.html');
    })
  );
});

// Push notifications
self.addEventListener('push', function(event) {
  var data = { title: 'HoDe', body: 'Tienes una nueva notificación' };
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'HoDe', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png'
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(list) {
      if (list.length) { list[0].focus(); } else { self.clients.openWindow('/'); }
    })
  );
});
