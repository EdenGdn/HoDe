// Configuración central del frontend
function getApiUrl() {
  var host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  return 'https://hode.onrender.com';
}

var API_URL = getApiUrl();
