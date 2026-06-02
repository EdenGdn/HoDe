// Módulo de validación de identidad
function initIdentity() {
  var panel = document.getElementById('identity-panel');
  var form = document.getElementById('identity-form');
  var statusBadge = document.getElementById('identity-status-badge');
  var formStatus = document.getElementById('identity-form-status');
  if (!panel || !form) return;

  function getSession() {
    try { return JSON.parse(localStorage.getItem('hode_session') || 'null'); } catch (e) { return null; }
  }

  async function load() {
    var session = getSession();
    if (!session) { panel.style.display = 'none'; return; }
    panel.style.display = '';

    try {
      var data = await window.HodeApi.getIdentity();
      renderStatus(data);
    } catch (e) {
      renderStatus({ status: null });
    }
  }

  function renderStatus(data) {
    if (!data || !data.status) {
      if (statusBadge) statusBadge.innerHTML = '';
      form.style.display = '';
      return;
    }

    var labels = {
      pending: { text: '⏳ Verificación en proceso', css: 'pending' },
      approved: { text: '✅ Identidad verificada', css: 'approved' },
      rejected: { text: '❌ Verificación rechazada — puedes intentar de nuevo', css: 'rejected' }
    };
    var label = labels[data.status] || labels.pending;

    if (statusBadge) {
      statusBadge.innerHTML = '<span class="identity-panel__status identity-panel__status--' + label.css + '">' + label.text + '</span>';
    }

    if (data.status === 'approved') {
      form.style.display = 'none';
    } else if (data.status === 'pending') {
      form.style.display = 'none';
    } else {
      form.style.display = '';
    }
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (formStatus) formStatus.textContent = '';
    var fd = new FormData(form);
    var payload = {
      fullName: String(fd.get('fullName') || '').trim(),
      documentId: String(fd.get('documentId') || '').trim(),
      documentType: String(fd.get('documentType') || 'ine').trim()
    };

    try {
      var result = await window.HodeApi.submitIdentity(payload);
      if (formStatus) { formStatus.textContent = '✅ Documentos enviados para verificación.'; formStatus.className = 'identity-form__status--ok'; }
      renderStatus(result);
      form.reset();
    } catch (err) {
      if (formStatus) { formStatus.textContent = err.message || 'Error al enviar.'; formStatus.className = 'identity-form__status--error'; }
    }
  });

  window.addEventListener('hode:authCompleted', load);
  window.addEventListener('hode:authLogout', function() { panel.style.display = 'none'; });

  // Bootstrap
  var existing = getSession();
  if (existing) load();

  window.HodeIdentity = { refresh: load };
}
