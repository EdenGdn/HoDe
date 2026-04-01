// Configuración central del frontend
var API_URL = (function () {
  var host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  return 'https://hode.onrender.com';
})();
