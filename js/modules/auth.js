// Módulo de autenticación y registro
function initAuth() {
  const overlay = document.getElementById('auth-overlay');
  const overlayPanel = overlay ? overlay.querySelector('.auth-overlay__panel') : null;
  const openButtons = document.querySelectorAll('[data-open-auth]');
  const closeButtons = overlay ? overlay.querySelectorAll('[data-close-auth]') : [];
  const tabs = overlay ? overlay.querySelectorAll('.auth-overlay__tab') : [];
  const panels = overlay ? overlay.querySelectorAll('[data-auth-panel]') : [];
  const loginForm = document.getElementById('login-form');
  const clientForm = document.getElementById('register-client-form');
  const proForm = document.getElementById('register-pro-form');
  const statusNode = document.getElementById('auth-status');
  const gateMessage = document.getElementById('auth-gate-message');
  const forgotBtn = document.getElementById('forgot-password-btn');
  const forgotSection = document.getElementById('forgot-password-section');
  const forgotBackBtn = document.getElementById('forgot-back-btn');
  const forgotForm = document.getElementById('forgot-password-form');
  const verifyForm = document.getElementById('verify-email-form');
  const verifyEmailDisplay = document.getElementById('verify-email-display');
  const verifyHint = document.getElementById('verify-hint');
  const resendCodeBtn = document.getElementById('resend-code-btn');
  var codeInputs = overlay ? Array.from(overlay.querySelectorAll('#verify-code-group input')) : [];

  if (!overlay || !overlayPanel || !loginForm || !clientForm || !proForm || !statusNode || !gateMessage) {
    return;
  }

  const STORAGE_SESSION = 'hode_session';
  let pendingWorker = null;
  let pendingVerifyEmail = '';
  let pendingVerifyUserId = null;

  /* ── Field-level error helpers ── */
  var FIELD_LABELS = {
    email: 'Correo electrónico',
    password: 'Contraseña',
    passwordConfirm: 'Confirmar contraseña',
    name: 'Nombre',
    phone: 'Teléfono',
    city: 'Ciudad / Ubicación',
    need: 'Tipo de necesidad',
    specialty: 'Especialidad',
    experience: 'Experiencia',
    document: 'Documento',
    bio: 'Descripción'
  };

  function clearFieldErrors(form) {
    form.querySelectorAll('.auth-form__error').forEach(function(span) {
      span.textContent = '';
      span.style.display = 'none';
    });
    form.querySelectorAll('.auth-form__input-error').forEach(function(input) {
      input.classList.remove('auth-form__input-error');
    });
  }

  function showFieldError(form, field, message) {
    var span = form.querySelector('[data-field-error="' + field + '"]');
    if (span) {
      span.textContent = message;
      span.style.display = '';
    }
    var input = form.querySelector('[name="' + field + '"]');
    if (input) {
      input.classList.add('auth-form__input-error');
    }
  }

  function parseIssues(issues, form) {
    if (!Array.isArray(issues) || !issues.length) return;
    issues.forEach(function(issue) {
      var path = issue.path && issue.path[0] ? issue.path[0] : '';
      var label = FIELD_LABELS[path] || path;
      var msg = '';
      if (issue.code === 'too_small') {
        msg = label + ' debe tener al menos ' + issue.minimum + ' caracteres.';
      } else if (issue.code === 'too_big') {
        msg = label + ' excede el largo máximo.';
      } else if (issue.code === 'invalid_string' || issue.code === 'invalid_type') {
        msg = label + ' no es válido.';
      } else {
        msg = issue.message || (label + ' es inválido.');
      }
      showFieldError(form, path, msg);
    });
  }

  function showGeneralError(message, issues, form) {
    clearFieldErrors(form);
    if (issues && issues.length) {
      parseIssues(issues, form);
      setStatus('');
      return;
    }
    setStatus(message || 'Ocurrió un error inesperado.');
  }

  /* ── File-upload label updater ── */
  document.querySelectorAll('.auth-form__upload input[type="file"]').forEach(function(input) {
    input.addEventListener('change', function() {
      var label = document.querySelector('[data-upload-label="' + input.id + '"]');
      if (!label) return;
      label.textContent = input.files && input.files[0] ? input.files[0].name : 'Seleccionar archivo';
      if (input.files && input.files[0]) {
        label.classList.add('auth-form__upload-placeholder--has-file');
      } else {
        label.classList.remove('auth-form__upload-placeholder--has-file');
      }
    });
  });

  /* ═══════════════════════════════════════
     PASSWORD STRENGTH METER
     ═══════════════════════════════════════ */
  function calcPasswordStrength(pw) {
    if (!pw) return { level: '', label: '' };
    var score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 'weak', label: 'Débil' };
    if (score === 2) return { level: 'fair', label: 'Regular' };
    if (score === 3) return { level: 'good', label: 'Buena' };
    return { level: 'strong', label: 'Fuerte' };
  }

  document.querySelectorAll('[data-password-meter]').forEach(function(meter) {
    var inputId = meter.getAttribute('data-password-meter');
    var input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', function() {
      var result = calcPasswordStrength(input.value);
      meter.setAttribute('data-level', result.level);
      var text = meter.querySelector('.password-strength__text');
      if (text) text.textContent = result.level ? result.label : '';
    });
  });

  /* ═══════════════════════════════════════
     STEPPER LOGIC
     ═══════════════════════════════════════ */
  function initStepper(container) {
    var dots = Array.from(container.querySelectorAll('.auth-stepper__dot'));
    var bars = Array.from(container.querySelectorAll('.auth-stepper__fill'));
    var stepPanels = Array.from(container.querySelectorAll('.auth-stepper__panel'));
    var currentStep = 1;
    var totalSteps = stepPanels.length;

    function goToStep(n) {
      if (n < 1 || n > totalSteps) return;
      currentStep = n;
      stepPanels.forEach(function(panel) {
        panel.classList.toggle('is-active', Number(panel.getAttribute('data-stepper-panel')) === n);
      });
      dots.forEach(function(dot, i) {
        var stepNum = i + 1;
        dot.classList.toggle('is-active', stepNum <= n);
        dot.classList.toggle('is-current', stepNum === n);
        dot.classList.toggle('is-completed', stepNum < n);
      });
      bars.forEach(function(bar, i) {
        bar.style.width = (i + 1 < n) ? '100%' : '0%';
      });
    }

    function validateCurrentStep() {
      var panel = stepPanels[currentStep - 1];
      if (!panel) return true;
      var inputs = Array.from(panel.querySelectorAll('input[required], select[required], textarea[required]'));
      var valid = true;
      var form = container.closest('form') || container.querySelector('form');
      if (form) clearFieldErrors(form);
      inputs.forEach(function(input) {
        if (!input.value.trim()) {
          valid = false;
          if (form) showFieldError(form, input.name, (FIELD_LABELS[input.name] || input.name) + ' es obligatorio.');
        } else if (input.type === 'email' && !input.value.includes('@')) {
          valid = false;
          if (form) showFieldError(form, input.name, 'Ingresa un correo válido.');
        }
      });
      return valid;
    }

    container.addEventListener('click', function(e) {
      var nextBtn = e.target.closest('.auth-stepper__next');
      var prevBtn = e.target.closest('.auth-stepper__prev');
      if (nextBtn) {
        if (validateCurrentStep()) goToStep(currentStep + 1);
      }
      if (prevBtn) {
        goToStep(currentStep - 1);
      }
    });

    return { goToStep: goToStep, reset: function() { goToStep(1); } };
  }

  var clientStepper = initStepper(document.querySelector('[data-stepper="client"]'));
  var proStepper = initStepper(document.querySelector('[data-stepper="pro"]'));

  /* ═══════════════════════════════════════
     GEOLOCATION BUTTONS IN FORMS
     ═══════════════════════════════════════ */
  document.querySelectorAll('.auth-form__geoloc').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var targetId = btn.getAttribute('data-geoloc-target');
      var input = document.getElementById(targetId);
      if (!input) return;
      if (!navigator.geolocation) {
        input.value = '';
        input.placeholder = 'Geolocalización no soportada';
        return;
      }
      btn.classList.add('is-loading');
      btn.textContent = '⏳';
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          btn.classList.remove('is-loading');
          btn.textContent = '📍';
          reverseGeocode(pos.coords.latitude, pos.coords.longitude, function(city) {
            input.value = city;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          });
        },
        function() {
          btn.classList.remove('is-loading');
          btn.textContent = '📍';
          input.placeholder = 'No se pudo obtener ubicación';
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    });
  });

  function reverseGeocode(lat, lon, cb) {
    var url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' +
      encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon) + '&addressdetails=1&accept-language=es';
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var addr = data && data.address ? data.address : {};
        var city = addr.city || addr.town || addr.village || addr.state || '';
        cb(city);
        window.dispatchEvent(new CustomEvent('hode:geolocationResolved', {
          detail: { lat: lat, lon: lon, city: city, address: addr }
        }));
      })
      .catch(function() { cb(''); });
  }

  /* ═══════════════════════════════════════
     CORE AUTH HELPERS
     ═══════════════════════════════════════ */
  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_SESSION) || 'null');
    } catch (error) {
      return null;
    }
  }

  function saveSession(session) {
    localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
  }

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function setAuthView(view) {
    tabs.forEach(function(tab) {
      tab.classList.toggle('is-active', tab.getAttribute('data-auth-view') === view);
    });
    panels.forEach(function(panel) {
      panel.classList.toggle('auth-card--hidden', panel.getAttribute('data-auth-panel') !== view);
    });
    if (forgotSection) forgotSection.style.display = 'none';
    if (loginForm) loginForm.style.display = '';
  }

  function openOverlay(view) {
    if (view) setAuthView(view);
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    overlayPanel.classList.remove('auth-transition-exit');
    overlayPanel.classList.add('auth-transition-enter');
  }

  function closeOverlay() {
    overlayPanel.classList.remove('auth-transition-enter');
    overlayPanel.classList.add('auth-transition-exit');
    window.setTimeout(function() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
    }, 330);
  }

  function openAuthGate(message) {
    gateMessage.textContent = message;
    gateMessage.classList.remove('auth__gate-message--hidden');
    openOverlay('login');
  }

  function closeAuthGate() {
    gateMessage.classList.add('auth__gate-message--hidden');
    gateMessage.textContent = '';
  }

  function completeAccess() {
    closeAuthGate();
    var session = readSession();
    if (!session) return;
    setStatus('Sesión activa como ' + (session.role === 'pro' ? 'profesional' : 'cliente') + ': ' + session.name);
    closeOverlay();

    if (pendingWorker) {
      window.dispatchEvent(new CustomEvent('hode:authCompleted', { detail: { worker: pendingWorker } }));
      pendingWorker = null;
    } else {
      window.dispatchEvent(new CustomEvent('hode:authCompleted', { detail: { session: session } }));
    }
  }

  /* ═══════════════════════════════════════
     EMAIL VERIFICATION
     ═══════════════════════════════════════ */
  function showVerifyStep(email, userId) {
    pendingVerifyEmail = email;
    pendingVerifyUserId = userId;
    if (verifyEmailDisplay) verifyEmailDisplay.textContent = email;
    if (verifyHint) verifyHint.textContent = '';
    codeInputs.forEach(function(inp) { inp.value = ''; });
    setAuthView('verify');
    if (codeInputs[0]) codeInputs[0].focus();
  }

  /* Code input auto-advance */
  codeInputs.forEach(function(inp, idx) {
    inp.addEventListener('input', function() {
      var val = inp.value.replace(/\D/g, '');
      inp.value = val.slice(0, 1);
      if (val && idx < codeInputs.length - 1) {
        codeInputs[idx + 1].focus();
      }
    });
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && !inp.value && idx > 0) {
        codeInputs[idx - 1].focus();
      }
    });
    inp.addEventListener('paste', function(e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      for (var i = 0; i < codeInputs.length; i++) {
        codeInputs[i].value = text[i] || '';
      }
      var focusIdx = Math.min(text.length, codeInputs.length - 1);
      codeInputs[focusIdx].focus();
    });
  });

  if (verifyForm) {
    verifyForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var code = codeInputs.map(function(inp) { return inp.value; }).join('');
      if (code.length !== 6) {
        if (verifyHint) verifyHint.textContent = 'Ingresa los 6 dígitos.';
        return;
      }
      try {
        var result = await window.HodeApi.verifyEmail({ email: pendingVerifyEmail, code: code });
        if (result && result.user) {
          saveSession(result.user);
        }
        setStatus('Correo verificado correctamente.');
        completeAccess();
      } catch (error) {
        if (verifyHint) verifyHint.textContent = error.message || 'Código incorrecto. Intenta de nuevo.';
      }
    });
  }

  if (resendCodeBtn) {
    resendCodeBtn.addEventListener('click', async function() {
      if (!pendingVerifyEmail) return;
      try {
        var res = await window.HodeApi.resendCode({ email: pendingVerifyEmail });
        if (verifyHint) verifyHint.textContent = 'Código reenviado. Revisa tu correo.' + (res && res.code ? ' (Demo: ' + res.code + ')' : '');
      } catch (error) {
        if (verifyHint) verifyHint.textContent = error.message || 'Error al reenviar.';
      }
    });
  }

  /* ═══════════════════════════════════════
     AUTH ACTIONS
     ═══════════════════════════════════════ */
  function validatePasswords(form, password, confirm) {
    if (password !== confirm) {
      showFieldError(form, 'passwordConfirm', 'Las contraseñas no coinciden.');
      return false;
    }
    return true;
  }

  async function login(email, password) {
    clearFieldErrors(loginForm);
    var errors = [];
    if (!email || !email.includes('@')) errors.push({ path: ['email'], message: 'Ingresa un correo válido.' });
    if (!password || password.length < 6) errors.push({ path: ['password'], message: 'La contraseña debe tener al menos 6 caracteres.' });
    if (errors.length) {
      errors.forEach(function(e) { showFieldError(loginForm, e.path[0], e.message); });
      return false;
    }
    try {
      var result = await window.HodeApi.login({ email: email, password: password });
      saveSession(result.user);
      setStatus('Bienvenido de nuevo, ' + result.user.name + '.');
      if (window.Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Sesión iniciada como ' + result.user.name,
          timer: 2000,
          showConfirmButton: false
        });
      }
      completeAccess();
      return true;
    } catch (error) {
      var msg = error.message || '';
      if (window.Swal) {
        Swal.fire({
          icon: 'error',
          title: 'Error al iniciar sesión',
          text: msg || 'Verifica tus credenciales e intenta de nuevo.'
        });
      }
      if (msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('contraseña')) {
        showGeneralError(msg, error.issues, loginForm);
      } else {
        showGeneralError(msg, error.issues, loginForm);
      }
      return false;
    }
  }

  async function registerClient(payload) {
    clearFieldErrors(clientForm);
    try {
      var result = await window.HodeApi.registerClient(payload);
      saveSession(result.user);
      setStatus('Cuenta creada. Verifica tu correo electrónico.');
      if (window.Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Cuenta creada!',
          text: 'Revisa tu correo para verificar tu cuenta.',
          timer: 2500,
          showConfirmButton: false
        });
      }
      if (result.verificationCode) {
        if (verifyHint) verifyHint.textContent = '(Demo: tu código es ' + result.verificationCode + ')';
      }
      showVerifyStep(payload.email, result.user.id);
      return true;
    } catch (error) {
      var msg = error.message || '';
      if (window.Swal) {
        Swal.fire({
          icon: 'error',
          title: 'Error al registrar',
          text: msg || 'No se pudo crear la cuenta.'
        });
      }
      if (msg.includes('correo ya está registrado')) {
        showFieldError(clientForm, 'email', 'Este correo ya está en uso. Intenta iniciar sesión.');
        setStatus('');
      } else {
        showGeneralError(msg, error.issues, clientForm);
      }
      return false;
    }
  }

  async function registerPro(payload, insuranceData) {
    clearFieldErrors(proForm);
    try {
      var result = await window.HodeApi.registerPro(payload);
      saveSession(result.user);

      // Submit insurance request if opted in
      if (insuranceData) {
        try {
          await window.HodeApi.requestInsurance(insuranceData);
        } catch (insErr) {
          // Insurance is optional, don't block registration
        }
      }

      setStatus('Cuenta creada. Verifica tu correo electrónico.');
      if (window.Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Cuenta profesional creada!',
          text: 'Revisa tu correo para verificar tu cuenta.',
          timer: 2500,
          showConfirmButton: false
        });
      }
      if (result.verificationCode) {
        if (verifyHint) verifyHint.textContent = '(Demo: tu código es ' + result.verificationCode + ')';
      }
      showVerifyStep(payload.email, result.user.id);
      return true;
    } catch (error) {
      var msg = error.message || '';
      if (window.Swal) {
        Swal.fire({
          icon: 'error',
          title: 'Error al registrar',
          text: msg || 'No se pudo crear la cuenta.'
        });
      }
      if (msg.includes('correo ya está registrado')) {
        showFieldError(proForm, 'email', 'Este correo ya está en uso. Intenta iniciar sesión.');
        setStatus('');
      } else {
        showGeneralError(msg, error.issues, proForm);
      }
      return false;
    }
  }

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    var data = new FormData(loginForm);
    await login(String(data.get('email') || ''), String(data.get('password') || ''));
  });

  clientForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    var data = new FormData(clientForm);
    var pw = String(data.get('password') || '');
    var pwc = String(data.get('passwordConfirm') || '');
    clearFieldErrors(clientForm);
    if (!validatePasswords(clientForm, pw, pwc)) return;
    await registerClient({
      name: String(data.get('name') || ''),
      email: String(data.get('email') || ''),
      phone: String(data.get('phone') || ''),
      city: String(data.get('city') || ''),
      need: String(data.get('need') || ''),
      password: pw
    });
  });

  proForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    var data = new FormData(proForm);
    var pw = String(data.get('password') || '');
    var pwc = String(data.get('passwordConfirm') || '');
    clearFieldErrors(proForm);
    if (!validatePasswords(proForm, pw, pwc)) return;

    // Collect insurance data if opted in
    var insuranceToggle = document.getElementById('pro-insurance-toggle');
    var insuranceData = null;
    if (insuranceToggle && insuranceToggle.checked) {
      var insName = String(data.get('insuranceFullName') || '').trim();
      var insDoc = String(data.get('insuranceDocId') || '').trim();
      var insBirth = String(data.get('insuranceBirth') || '').trim();
      var insPhone = String(data.get('insurancePhone') || '').trim();
      var insPlan = String(data.get('insurancePlan') || 'basic');
      if (insName && insDoc && insBirth && insPhone) {
        insuranceData = {
          fullName: insName,
          documentId: insDoc,
          birthDate: insBirth,
          phone: insPhone,
          plan: insPlan
        };
      }
    }

    await registerPro({
      name: String(data.get('name') || ''),
      email: String(data.get('email') || ''),
      specialty: String(data.get('specialty') || ''),
      experience: String(data.get('experience') || ''),
      city: String(data.get('city') || ''),
      document: String(data.get('document') || ''),
      bio: String(data.get('bio') || ''),
      password: pw
    }, insuranceData);
  });

  /* ═══════════════════════════════════════
     SOCIAL LOGIN
     ═══════════════════════════════════════ */
  document.querySelectorAll('[data-social]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var provider = btn.getAttribute('data-social');
      setStatus('Conectando con ' + provider + '…');
      try {
        var result = await window.HodeApi.socialLogin({ provider: provider });
        saveSession(result.user);
        setStatus('Sesión iniciada con ' + provider + '.');
        completeAccess();
      } catch (error) {
        setStatus(error.message || 'Error con ' + provider + '.');
      }
    });
  });

  /* ── Forgot password flow ── */
  if (forgotBtn && forgotSection && forgotBackBtn) {
    forgotBtn.addEventListener('click', function() {
      loginForm.style.display = 'none';
      forgotSection.style.display = '';
    });
    forgotBackBtn.addEventListener('click', function() {
      forgotSection.style.display = 'none';
      loginForm.style.display = '';
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = String(new FormData(forgotForm).get('email') || '');
      if (!email.includes('@')) {
        setStatus('Ingresa un correo válido.');
        return;
      }
      setStatus('Si el correo existe, recibirás instrucciones para restablecer tu contraseña.');
      forgotForm.reset();
    });
  }

  /* ── Event listeners ── */
  /* Insurance toggle */
  var insuranceToggle = document.getElementById('pro-insurance-toggle');
  var insuranceInfo = document.getElementById('pro-insurance-info');
  if (insuranceToggle && insuranceInfo) {
    insuranceToggle.addEventListener('change', function() {
      insuranceInfo.style.display = insuranceToggle.checked ? '' : 'none';
    });
  }

  window.addEventListener('hode:authRequired', function(event) {
    pendingWorker = event.detail && event.detail.worker ? event.detail.worker : null;
    openAuthGate('Debes iniciar sesión para contactar al profesional.');
  });

  openButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      var view = button.getAttribute('data-open-auth');
      var normalized = view === 'client' || view === 'pro' || view === 'login' ? view : 'login';
      openOverlay(normalized);
    });
  });

  closeButtons.forEach(function(button) {
    button.addEventListener('click', closeOverlay);
  });

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      setAuthView(tab.getAttribute('data-auth-view'));
    });
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeOverlay();
    }
  });

  (async function bootstrapSession() {
    var existingSession = readSession();
    if (existingSession) {
      setStatus('Sesión activa como ' + (existingSession.role === 'pro' ? 'profesional' : 'cliente') + ': ' + existingSession.name);
      window.dispatchEvent(new CustomEvent('hode:authCompleted', { detail: { session: existingSession } }));
    }
    try {
      var user = await window.HodeApi.me();
      if (user) {
        saveSession(user);
        if (!existingSession) {
          window.dispatchEvent(new CustomEvent('hode:authCompleted', { detail: { session: user } }));
        }
      }
    } catch (error) {
      localStorage.removeItem(STORAGE_SESSION);
      if (window.HodeApi) window.HodeApi.clearAccessToken();
    }
  })();

  window.HodeAuth = {
    isAuthenticated: function() { return Boolean(readSession()); },
    getSession: function() { return readSession(); },
    logout: async function() {
      try { await window.HodeApi.logout(); } catch (error) { /* noop */ }
      localStorage.removeItem(STORAGE_SESSION);
      setStatus('Sesión cerrada.');
      window.dispatchEvent(new CustomEvent('hode:authLogout'));
    },
    openLogin: function(view) { openOverlay(view || 'login'); }
  };
}
