// Módulo de panel lateral en diferenciadores y mini sidebar animada
function initUiPanels() {
  const differentiators = Array.from(document.querySelectorAll('.differentiator[data-diff-key]'));
  const detailPanel = document.getElementById('diff-detail-panel');
  const detailTitle = document.getElementById('diff-detail-title');
  const detailText = document.getElementById('diff-detail-text');
  const detailClose = document.getElementById('diff-detail-close');
  const miniNav = document.getElementById('mini-nav');
  const miniNavItems = miniNav ? Array.from(miniNav.querySelectorAll('.mini-nav__item')) : [];
  const profileModal = document.getElementById('profile-modal');
  const profileModalContent = document.getElementById('profile-modal-content');
  const messagesPanel = document.getElementById('messages-panel');
  const messagesPanelContent = document.getElementById('messages-panel-content');
  const settingsPanel = document.getElementById('settings-panel');
  const enableThemeButton = document.getElementById('theme-enable');
  const disableThemeButton = document.getElementById('theme-disable');
  const notifChat = document.getElementById('notif-chat');
  const notifSupport = document.getElementById('notif-support');
  const notifMarketing = document.getElementById('notif-marketing');
  const supportModal = document.getElementById('support-modal');
  const supportForm = document.getElementById('support-form');
  const supportStatus = document.getElementById('support-status');
  const openSupportBtn = document.getElementById('open-support-modal');

  if (
    !detailPanel ||
    !detailTitle ||
    !detailText ||
    !detailClose ||
    !miniNav ||
    !differentiators.length ||
    !miniNavItems.length ||
    !profileModal ||
    !profileModalContent ||
    !messagesPanel ||
    !messagesPanelContent ||
    !settingsPanel ||
    !enableThemeButton ||
    !disableThemeButton
  ) {
    return;
  }

  const THEME_STORAGE_KEY = 'hode_theme';
  let cachedSettings = {
    theme: 'light',
    notifications: {
      chat: true,
      marketing: false,
      support: true
    }
  };

  const detailByKey = {
    verification: {
      title: 'Verificación completa',
      text: 'Validamos identidad, antecedentes y experiencia profesional en varias etapas. Así reduces riesgos y eliges con datos confiables desde el primer contacto.'
    },
    reputation: {
      title: 'Sistema de reputación',
      text: 'Cada servicio deja huella: reseñas verificadas, promedio histórico y consistencia por categoría. Te mostramos contexto real, no solo una calificación aislada.'
    },
    speed: {
      title: 'Contratación inmediata',
      text: 'Priorizamos disponibilidad activa y respuesta rápida para que recibas opciones en minutos. El flujo está optimizado para contactar sin fricción.'
    },
    security: {
      title: 'Seguridad garantizada',
      text: 'Mantenemos trazabilidad de conversaciones y acuerdos, con mecanismos de protección para ambas partes y una experiencia más segura en toda la contratación.'
    }
  };

  function openDetail(key) {
    const content = detailByKey[key];
    if (!content) {
      return;
    }

    detailTitle.textContent = content.title;
    detailText.textContent = content.text;
    detailPanel.classList.add('is-open');
    detailPanel.setAttribute('aria-hidden', 'false');
  }

  function closeDetail() {
    detailPanel.classList.remove('is-open');
    detailPanel.setAttribute('aria-hidden', 'true');
  }

  function closeSidePanel(panel) {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
  }

  function openSidePanel(panel) {
    [messagesPanel, settingsPanel].forEach(function(item) {
      if (item !== panel) {
        closeSidePanel(item);
      }
    });
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
  }

  async function openProfileModal() {
    closeProfileModal();
    profileModal.classList.add('is-open');
    profileModal.setAttribute('aria-hidden', 'false');
    await renderProfilePanel();
  }

  function closeProfileModal() {
    profileModal.classList.remove('is-open');
    profileModal.setAttribute('aria-hidden', 'true');
  }

  var AVATAR_STORAGE_KEY = 'hode_profile_avatar';

  function getSavedAvatar() {
    return localStorage.getItem(AVATAR_STORAGE_KEY) || '';
  }

  function saveAvatar(dataUrl) {
    localStorage.setItem(AVATAR_STORAGE_KEY, dataUrl);
  }

  async function renderProfilePanel() {
    const session = window.HodeAuth && typeof window.HodeAuth.getSession === 'function'
      ? window.HodeAuth.getSession()
      : null;

    if (!session) {
      profileModalContent.innerHTML = `
        <div class="profile-unauth">
          <div class="profile-unauth__icon">👤</div>
          <h4 class="profile-unauth__title">Regístrate para ver tu perfil</h4>
          <p class="profile-unauth__text">Inicia sesión o crea una cuenta para ver y personalizar tu información.</p>
          <button type="button" class="btn btn-primary" data-open-auth="login">Abrir acceso</button>
        </div>
      `;
      return;
    }

    let profile = session;
    try {
      if (window.HodeApi && typeof window.HodeApi.getProfile === 'function') {
        profile = await window.HodeApi.getProfile();
      }
    } catch (error) {
      profile = session;
    }

    var avatarSrc = getSavedAvatar() || '';
    var avatarDisplay = avatarSrc
      ? '<img class="profile-avatar__img" src="' + avatarSrc + '" alt="Foto de perfil">'
      : '<img class="profile-avatar__img" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'40\' r=\'22\' fill=\'%23b0b8c8\'/%3E%3Cellipse cx=\'50\' cy=\'90\' rx=\'35\' ry=\'26\' fill=\'%23b0b8c8\'/%3E%3C/svg%3E" alt="Sin foto">';

    var escapedName = (profile.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var escapedEmail = (profile.email || 'Sin correo').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var escapedPhone = (profile.phone || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var escapedCity = (profile.city || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var escapedBio = (profile.bio || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    profileModalContent.innerHTML =
      '<div class="profile-avatar">' +
        '<div class="profile-avatar__wrapper" title="Haz clic para cambiar tu foto de perfil">' +
          avatarDisplay +
          '<div class="profile-avatar__overlay">📷</div>' +
          '<span class="profile-avatar__badge">📷</span>' +
          '<input type="file" class="profile-avatar__input" accept="image/*">' +
        '</div>' +
        '<span class="profile-avatar__name">' + escapedName + '</span>' +
        '<span class="profile-avatar__role">' + (profile.role === 'pro' ? 'Profesional' : 'Cliente') + '</span>' +
      '</div>' +
      '<div class="profile-info">' +
        '<div class="profile-info__row"><span class="profile-info__label">Correo</span><span class="profile-info__value">' + escapedEmail + '</span></div>' +
        '<div class="profile-info__row"><span class="profile-info__label">ID</span><span class="profile-info__value">' + (profile.id || 'N/D') + '</span></div>' +
      '</div>' +
      '<div class="profile-form-section">' +
        '<h4>Editar perfil</h4>' +
        '<form class="profile-form" id="profile-form">' +
          '<label>Nombre</label>' +
          '<input type="text" name="name" value="' + escapedName + '" required>' +
          '<label>Teléfono</label>' +
          '<input type="text" name="phone" value="' + escapedPhone + '">' +
          '<label>Ciudad</label>' +
          '<input type="text" name="city" value="' + escapedCity + '">' +
          '<label>Biografía</label>' +
          '<textarea name="bio" placeholder="Cuéntanos sobre ti...">' + escapedBio + '</textarea>' +
          '<button type="submit" class="btn btn-primary">Guardar cambios</button>' +
        '</form>' +
      '</div>';
  }

  function renderMessagesPanel(payload) {
    const chats = payload && Array.isArray(payload.chats) ? payload.chats : [];

    if (!chats.length) {
      messagesPanelContent.innerHTML = '<article class="messages-panel__empty">No tienes chats aún. Contacta un profesional para iniciar.</article>';
      return;
    }

    messagesPanelContent.innerHTML = `
      <div class="messages-panel__list">
        ${chats.map(function(chat) {
          return `
            <button type="button" class="messages-panel__item" data-thread-id="${chat.workerId}">
              <strong>${chat.workerName || `Profesional #${chat.workerId}`}</strong>
              <small>${chat.lastText || 'Conversación sin mensajes'}</small>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function applyTheme(mode) {
    if (mode === 'dark') {
      document.body.classList.add('theme-dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      return;
    }

    document.body.classList.remove('theme-dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
  }

  async function persistSettings(nextSettings) {
    cachedSettings = {
      ...cachedSettings,
      ...nextSettings,
      notifications: {
        ...(cachedSettings.notifications || {}),
        ...((nextSettings && nextSettings.notifications) || {})
      }
    };

    if (!window.HodeAuth || !window.HodeAuth.isAuthenticated()) {
      return;
    }

    if (!window.HodeApi || typeof window.HodeApi.updateSettings !== 'function') {
      return;
    }

    try {
      const updated = await window.HodeApi.updateSettings(cachedSettings);
      if (updated) {
        cachedSettings = updated;
      }
    } catch (error) {
      // noop
    }
  }

  differentiators.forEach(function (card) {
    function onActivate() {
      const key = card.getAttribute('data-diff-key');
      openDetail(key);
    }

    card.addEventListener('click', onActivate);
    card.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onActivate();
      }
    });
  });

  detailClose.addEventListener('click', closeDetail);

  document.querySelectorAll('[data-close-side]').forEach(function(button) {
    button.addEventListener('click', function() {
      const key = button.getAttribute('data-close-side');
      if (key === 'messages') {
        closeSidePanel(messagesPanel);
      }
      if (key === 'settings') {
        closeSidePanel(settingsPanel);
      }
    });
  });

  document.querySelectorAll('[data-close-profile]').forEach(function(button) {
    button.addEventListener('click', function() {
      closeProfileModal();
    });
  });

  document.addEventListener('click', function (event) {
    if (!detailPanel.classList.contains('is-open')) {
      return;
    }

    const clickedDifferentiator = event.target.closest('.differentiator[data-diff-key]');
    const clickedPanel = event.target.closest('#diff-detail-panel');
    if (!clickedDifferentiator && !clickedPanel) {
      closeDetail();
    }
  });

  function setActiveItem(item) {
    miniNavItems.forEach(function (entry) {
      entry.classList.toggle('is-active', entry === item);
    });
  }

  function navigateFromItem(item) {
    const target = item.getAttribute('data-mini-target');

    if (target === 'home') {
      closeProfileModal();
      closeSidePanel(messagesPanel);
      closeSidePanel(settingsPanel);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (target === 'profile') {
      openProfileModal();
      return;
    }

    if (target === 'messages') {
      openSidePanel(messagesPanel);
      return;
    }

    if (target === 'settings') {
      openSidePanel(settingsPanel);
    }
  }

  miniNavItems.forEach(function (item) {
    item.addEventListener('mouseenter', function () {
      setActiveItem(item);
    });

    item.addEventListener('focus', function () {
      setActiveItem(item);
    });

    item.addEventListener('click', function () {
      setActiveItem(item);
      navigateFromItem(item);
    });
  });

  messagesPanelContent.addEventListener('click', function(event) {
    const button = event.target.closest('[data-thread-id]');
    if (!button) {
      return;
    }

    const threadId = button.getAttribute('data-thread-id');
    const chatDockItem = document.querySelector(`#chat-dock-list [data-thread-id="${threadId}"]`);
    if (chatDockItem) {
      chatDockItem.click();
    }
    closeSidePanel(messagesPanel);
  });

  profileModalContent.addEventListener('click', function(event) {
    const authButton = event.target.closest('[data-open-auth]');
    if (authButton) {
      closeProfileModal();
      if (window.HodeAuth && typeof window.HodeAuth.openLogin === 'function') {
        window.HodeAuth.openLogin(authButton.getAttribute('data-open-auth') || 'login');
      }
      return;
    }

    var avatarWrapper = event.target.closest('.profile-avatar__wrapper');
    if (avatarWrapper) {
      var fileInput = avatarWrapper.querySelector('.profile-avatar__input');
      if (fileInput) fileInput.click();
    }
  });

  profileModalContent.addEventListener('change', function(event) {
    var fileInput = event.target.closest('.profile-avatar__input');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;

    var file = fileInput.files[0];
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      saveAvatar(e.target.result);
      var imgEl = profileModalContent.querySelector('.profile-avatar__img');
      if (imgEl) {
        imgEl.src = e.target.result;
        imgEl.alt = 'Foto de perfil';
      }
    };
    reader.readAsDataURL(file);
  });

  profileModalContent.addEventListener('submit', async function(event) {
    const form = event.target.closest('#profile-form');
    if (!form) {
      return;
    }

    event.preventDefault();
    if (!window.HodeApi || typeof window.HodeApi.updateProfile !== 'function') {
      return;
    }

    const payload = {
      name: String(form.name.value || '').trim(),
      phone: String(form.phone.value || '').trim(),
      city: String(form.city.value || '').trim(),
      bio: String(form.bio.value || '').trim()
    };

    try {
      const updated = await window.HodeApi.updateProfile(payload);
      localStorage.setItem('hode_session', JSON.stringify(updated));
      await renderProfilePanel();
    } catch (error) {
      // noop
    }
  });

  window.addEventListener('hode:chatsUpdated', function(event) {
    renderMessagesPanel(event.detail || {});
  });

  window.addEventListener('hode:openMessagesPanel', function() {
    const messagesItem = miniNav.querySelector('[data-mini-target="messages"]');
    if (messagesItem) {
      setActiveItem(messagesItem);
    }
    openSidePanel(messagesPanel);
  });

  window.addEventListener('hode:openProfilePanel', function() {
    const profileItem = miniNav.querySelector('[data-mini-target="profile"]');
    if (profileItem) {
      setActiveItem(profileItem);
    }
    openProfileModal();
  });

  window.addEventListener('hode:openSettingsPanel', function() {
    const settingsItem = miniNav.querySelector('[data-mini-target="settings"]');
    if (settingsItem) {
      setActiveItem(settingsItem);
    }
    openSidePanel(settingsPanel);
  });

  window.addEventListener('hode:authCompleted', function() {
    renderProfilePanel();
  });

  enableThemeButton.addEventListener('click', async function() {
    applyTheme('dark');
    await persistSettings({ theme: 'dark' });
  });

  disableThemeButton.addEventListener('click', async function() {
    applyTheme('light');
    await persistSettings({ theme: 'light' });
  });

  // ── Support modal ──
  function openSupportModal() {
    if (!supportModal) return;
    supportModal.classList.add('is-open');
    supportModal.setAttribute('aria-hidden', 'false');
    if (supportStatus) supportStatus.textContent = '';

    // Pre-fill email if logged in
    var session = window.HodeAuth && typeof window.HodeAuth.getSession === 'function'
      ? window.HodeAuth.getSession() : null;
    if (session) {
      var nameInput = supportModal.querySelector('[name="name"]');
      var emailInput = supportModal.querySelector('[name="email"]');
      if (nameInput && session.name) nameInput.value = session.name;
      if (emailInput && session.email) emailInput.value = session.email;
    }
  }

  function closeSupportModal() {
    if (!supportModal) return;
    supportModal.classList.remove('is-open');
    supportModal.setAttribute('aria-hidden', 'true');
  }

  if (openSupportBtn) {
    openSupportBtn.addEventListener('click', openSupportModal);
  }

  if (supportModal) {
    supportModal.querySelectorAll('[data-close-support]').forEach(function(btn) {
      btn.addEventListener('click', closeSupportModal);
    });
  }

  if (supportForm) {
    supportForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (supportStatus) {
        supportStatus.textContent = '✅ Mensaje enviado correctamente. Te responderemos pronto.';
        supportStatus.className = 'support-form__status support-form__status--success';
      }
      supportForm.reset();
      setTimeout(closeSupportModal, 2000);
    });
  }

  (async function bootstrapSettings() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (window.HodeAuth && window.HodeAuth.isAuthenticated() && window.HodeApi && typeof window.HodeApi.getSettings === 'function') {
      try {
        const backendSettings = await window.HodeApi.getSettings();
        if (backendSettings) {
          cachedSettings = backendSettings;
        }
      } catch (error) {
        // noop
      }
    }

    const theme = cachedSettings.theme || (savedTheme === 'dark' ? 'dark' : 'light');
    applyTheme(theme === 'dark' ? 'dark' : 'light');

    var notifs = cachedSettings.notifications || {};
    if (notifChat) notifChat.checked = notifs.chat !== false;
    if (notifSupport) notifSupport.checked = notifs.support !== false;
    if (notifMarketing) notifMarketing.checked = !!notifs.marketing;
  })();

  renderProfilePanel();
  renderMessagesPanel({ chats: [] });

  function handleNotifToggle() {
    persistSettings({
      notifications: {
        chat: notifChat ? notifChat.checked : true,
        support: notifSupport ? notifSupport.checked : true,
        marketing: notifMarketing ? notifMarketing.checked : false
      }
    });
  }

  if (notifChat) notifChat.addEventListener('change', handleNotifToggle);
  if (notifSupport) notifSupport.addEventListener('change', handleNotifToggle);
  if (notifMarketing) notifMarketing.addEventListener('change', handleNotifToggle);

  document.addEventListener('click', function(event) {
    const isInsideSidePanel = event.target.closest('.side-panel');
    const isMiniNavClick = event.target.closest('#mini-nav');
    if (isInsideSidePanel || isMiniNavClick) {
      return;
    }

    closeSidePanel(messagesPanel);
    closeSidePanel(settingsPanel);
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      if (profileModal.classList.contains('is-open')) {
        closeProfileModal();
      }
      if (supportModal && supportModal.classList.contains('is-open')) {
        closeSupportModal();
      }
    }
  });

  document.addEventListener('mousemove', function (event) {
    let nearestItem = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    miniNavItems.forEach(function (item) {
      const bounds = item.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
      const proximity = Math.max(0, 1 - distance / 210);

      item.style.setProperty('--glow', proximity.toFixed(3));
      item.style.setProperty('--lift', `${(-5 * proximity).toFixed(2)}px`);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestItem = item;
      }
    });

    if (nearestItem && nearestDistance < 250) {
      setActiveItem(nearestItem);
    }
  });
}
