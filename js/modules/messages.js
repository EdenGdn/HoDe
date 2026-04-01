// Módulo de chat entre usuario y trabajador
function initMessages() {
  const section = document.getElementById('messages');
  const chatDock = document.getElementById('chat-dock');
  const chatDockList = document.getElementById('chat-dock-list');
  const conversation = document.getElementById('chat-messages');
  const threadsContainer = document.getElementById('chat-threads');
  const workerNameNode = document.getElementById('chat-worker-name');
  const workspace = document.getElementById('messages-workspace');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const typingNode = document.getElementById('chat-typing');
  const subtitle = section ? section.querySelector('.messages__subtitle') : null;

  if (!section || !chatDock || !chatDockList || !conversation || !threadsContainer || !workerNameNode || !workspace || !form || !input || !subtitle) {
    return;
  }

  const chatsByWorker = new Map();
  const chatsById = new Map();
  let currentWorker = null;
  let currentChatId = null;

  function showMessagesSection() {
    if (section.classList.contains('messages--hidden')) {
      section.classList.remove('messages--hidden');
      section.classList.add('messages--entering');
      setTimeout(function() { section.classList.remove('messages--entering'); }, 450);
    }
  }

  function scrollToMessages() {
    var headerHeight = document.querySelector('.header') ? document.querySelector('.header').offsetHeight : 0;
    var top = section.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function buildBaseNotifications() {
    const notices = [
      {
        kind: 'system',
        title: 'Actividad de HoDe',
        text: 'Explora profesionales verificados en tu ciudad.'
      },
      {
        kind: window.HodeAuth && window.HodeAuth.isAuthenticated() ? 'profile' : 'system',
        title: window.HodeAuth && window.HodeAuth.isAuthenticated() ? 'Perfil activo' : 'Acceso recomendado',
        text: window.HodeAuth && window.HodeAuth.isAuthenticated()
          ? 'Tu perfil está sincronizado. Revisa tus datos.'
          : 'Inicia sesión para desbloquear conversaciones y preferencias.',
        action: window.HodeAuth && window.HodeAuth.isAuthenticated() ? 'open-profile' : 'open-auth'
      },
      {
        kind: 'settings',
        title: 'Preferencias',
        text: 'Ajusta tema y notificaciones desde configuraciones.',
        action: 'open-settings'
      }
    ];

    return notices;
  }

  function emitChatsUpdate() {
    const chats = Array.from(chatsByWorker.keys()).map(function(workerId) {
      const chat = chatsByWorker.get(workerId) || [];
      const lastMessage = chat.length ? chat[chat.length - 1] : null;
      return {
        workerId: workerId,
        workerName: lastMessage && lastMessage.workerName ? lastMessage.workerName : `Profesional #${workerId}`,
        lastText: lastMessage && lastMessage.text ? lastMessage.text : ''
      };
    });

    window.dispatchEvent(new CustomEvent('hode:chatsUpdated', {
      detail: {
        chats: chats,
        currentWorkerId: currentWorker ? currentWorker.id : null
      }
    }));
  }

  function resolveWorker(workerId, fallbackName) {
    if (window.HodeWorkers && typeof window.HodeWorkers.findById === 'function') {
      const found = window.HodeWorkers.findById(workerId);
      if (found) {
        return found;
      }
    }

    return {
      id: workerId,
      name: fallbackName || `Profesional #${workerId}`,
      specialty: 'Servicio activo',
      welcome: []
    };
  }

  function mapMessages(messages, workerName) {
    return (messages || []).map(function(message) {
      return {
        id: message.id,
        from: message.from === 'user' ? 'me' : 'worker',
        text: message.content,
        workerName: workerName
      };
    });
  }

  function runBubbleAnimation() {
    workspace.classList.remove('is-opening');
    window.requestAnimationFrame(function() {
      workspace.classList.add('is-opening');
      window.setTimeout(function() {
        workspace.classList.remove('is-opening');
      }, 650);
    });
  }

  function renderThreads() {
    const ids = Array.from(chatsByWorker.keys());
    const notifications = buildBaseNotifications();

    if (!ids.length) {
      threadsContainer.innerHTML = '<p class="messages__thread-empty">Todavía no tienes chats guardados.</p>';
      chatDockList.innerHTML = notifications.map(function(notification) {
        return `
          <button type="button" class="chat-dock__item" data-kind="${notification.kind}" ${notification.action ? `data-notification-action="${notification.action}"` : ''}>
            <strong>${notification.title}</strong>
            <small>${notification.text}</small>
          </button>
        `;
      }).join('');
      emitChatsUpdate();
      return;
    }

    threadsContainer.innerHTML = ids.map(function(id) {
      const chat = chatsByWorker.get(id) || [];
      const meta = chat.length ? chat[chat.length - 1] : { workerName: 'Profesional', text: '' };
      const activeClass = currentWorker && currentWorker.id === id ? 'is-active' : '';
      return `
        <button type="button" class="messages__thread ${activeClass}" data-thread-id="${id}">
          <strong>${meta.workerName || 'Profesional'}</strong>
          <small>${meta.text || 'Conversación sin mensajes'}</small>
        </button>
      `;
    }).join('');

    const chatNotifications = ids.map(function(id) {
      const chat = chatsByWorker.get(id) || [];
      const meta = chat.length ? chat[chat.length - 1] : { workerName: 'Profesional', text: '' };
      return `
        <button type="button" class="chat-dock__item" data-kind="chat" data-thread-id="${id}">
          <strong>${meta.workerName || 'Profesional'}</strong>
          <small>${meta.text || 'Conversación sin mensajes'}</small>
        </button>
      `;
    });

    chatDockList.innerHTML = notifications.map(function(notification) {
      return `
        <button type="button" class="chat-dock__item" data-kind="${notification.kind}" ${notification.action ? `data-notification-action="${notification.action}"` : ''}>
          <strong>${notification.title}</strong>
          <small>${notification.text}</small>
        </button>
      `;
    }).join('') + chatNotifications.join('');

    emitChatsUpdate();
  }

  function renderConversation() {
    if (!currentWorker) {
      conversation.innerHTML = '';
      workerNameNode.textContent = 'Selecciona una conversación';
      return;
    }

    const chat = chatsByWorker.get(currentWorker.id) || [];
    workerNameNode.textContent = `Chat con ${currentWorker.name}`;
    conversation.innerHTML = chat.map(message => `
      <article class="messages__bubble messages__bubble--${message.from}">
        ${message.text}
      </article>
    `).join('');

    conversation.scrollTop = conversation.scrollHeight;
  }

  async function ensureChat(worker) {
    if (chatsByWorker.has(worker.id)) {
      return chatsById.get(worker.id) || null;
    }

    const chat = await window.HodeApi.openChat(worker.id);
    chatsById.set(worker.id, chat.id);
    chatsByWorker.set(worker.id, mapMessages(chat.messages, worker.name));
    runBubbleAnimation();
    return chat.id;
  }

  async function openChat(worker, options) {
    const openOptions = options || {};
    currentWorker = worker;
    subtitle.textContent = `Chateando con ${worker.name} · ${worker.specialty}`;

    const chatId = await ensureChat(worker);
    currentChatId = chatId;

    if (chatId) {
      const apiMessages = await window.HodeApi.getMessages(chatId);
      chatsByWorker.set(worker.id, mapMessages(apiMessages, worker.name));
    }

    chatDock.classList.remove('chat-dock--hidden');
    showMessagesSection();
    renderThreads();
    renderConversation();

    if (!openOptions.silent) {
      window.dispatchEvent(new CustomEvent('hode:openMessagesPanel'));
      scrollToMessages();
    }

    input.focus();
  }

  async function sendMessage(text) {
    if (!currentWorker || !currentChatId) {
      return;
    }

    await window.HodeApi.sendMessage(currentChatId, text);
    const apiMessages = await window.HodeApi.getMessages(currentChatId);
    chatsByWorker.set(currentWorker.id, mapMessages(apiMessages, currentWorker.name));
    renderThreads();
    renderConversation();

    // Simulate worker auto-reply after short delay
    simulateWorkerReply(currentWorker, currentChatId);
  }

  function simulateWorkerReply(worker, chatId) {
    var workerLocal = worker;
    var replies = [
      'Entendido, déjame revisarlo y te respondo en breve.',
      '¡Gracias por escribir! ¿Tienes más detalles sobre lo que necesitas?',
      'Perfecto, puedo ayudarte con eso. ¿Cuándo te queda bien?',
      'Anotado. Te envío una cotización en un momento.',
      'Claro, cuéntame más para darte una solución precisa.'
    ];
    if (typingNode) {
      typingNode.textContent = workerLocal.name.split(' ')[0] + ' está escribiendo...';
    }

    setTimeout(function() {
      if (typingNode) typingNode.textContent = '';
      var replyText = replies[Math.floor(Math.random() * replies.length)];
      var localChat = chatsByWorker.get(workerLocal.id) || [];
      localChat.push({ id: Date.now(), from: 'worker', text: replyText, workerName: workerLocal.name });
      chatsByWorker.set(workerLocal.id, localChat);
      renderThreads();
      if (currentWorker && currentWorker.id === workerLocal.id) {
        renderConversation();
      }
    }, 1500 + Math.random() * 1500);
  }

  window.addEventListener('hode:startChat', function(event) {
    const worker = event.detail && event.detail.worker;
    if (!worker) {
      return;
    }

    if (!window.HodeAuth || !window.HodeAuth.isAuthenticated()) {
      window.dispatchEvent(new CustomEvent('hode:authRequired', { detail: { worker: worker } }));
      return;
    }

    openChat(worker);
  });

  window.addEventListener('hode:authCompleted', function(event) {
    const worker = event.detail && event.detail.worker;
    if (worker) {
      openChat(worker);
    }
  });

  threadsContainer.addEventListener('click', async function(event) {
    const button = event.target.closest('[data-thread-id]');
    if (!button) {
      return;
    }

    const workerId = Number(button.getAttribute('data-thread-id'));
    const chat = chatsByWorker.get(workerId);
    if (!chat || !chat.length) {
      return;
    }

    const workerName = chat[0].workerName || `Profesional #${workerId}`;
    const worker = resolveWorker(workerId, workerName);
    await openChat(worker, { silent: true });
    conversation.scrollTop = conversation.scrollHeight;
  });

  chatDockList.addEventListener('click', async function(event) {
    const button = event.target.closest('[data-thread-id]');
    if (button) {
      const workerId = Number(button.getAttribute('data-thread-id'));
      const chat = chatsByWorker.get(workerId);
      if (!chat || !chat.length) {
        return;
      }

      const workerName = chat[0].workerName || `Profesional #${workerId}`;
      const worker = resolveWorker(workerId, workerName);
      await openChat(worker);
      scrollToMessages();
      return;
    }

    const notificationAction = event.target.closest('[data-notification-action]');
    if (!notificationAction) {
      return;
    }

    const action = notificationAction.getAttribute('data-notification-action');
    if (action === 'open-profile') {
      window.dispatchEvent(new CustomEvent('hode:openProfilePanel'));
      return;
    }

    if (action === 'open-settings') {
      window.dispatchEvent(new CustomEvent('hode:openSettingsPanel'));
      return;
    }

    if (action === 'open-auth') {
      if (window.HodeAuth && typeof window.HodeAuth.openLogin === 'function') {
        window.HodeAuth.openLogin('login');
      }
    }
  });

  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      return;
    }
    await sendMessage(value);
    input.value = '';
  });

  // Payment button in chat
  var chatPayBtn = document.getElementById('chat-pay-btn');
  if (chatPayBtn) {
    chatPayBtn.addEventListener('click', function() {
      if (!currentWorker) return;
      window.dispatchEvent(new CustomEvent('hode:chatPayment', { detail: { worker: currentWorker } }));
    });
  }

  (async function bootstrapChats() {
    chatDock.classList.remove('chat-dock--hidden');

    if (!window.HodeAuth || !window.HodeAuth.isAuthenticated()) {
      renderThreads();
      return;
    }

    try {
      const chatList = await window.HodeApi.listChats();
      for (const chat of chatList) {
        const worker = resolveWorker(chat.workerId, chat.lastMessage && chat.lastMessage.workerName ? chat.lastMessage.workerName : null);
        chatsById.set(chat.workerId, chat.id);
        const messages = await window.HodeApi.getMessages(chat.id);
        chatsByWorker.set(chat.workerId, mapMessages(messages, worker.name));
      }

      chatDock.classList.remove('chat-dock--hidden');
      if (chatList.length) {
        showMessagesSection();
      }
      renderThreads();
    } catch (error) {
      chatDock.classList.remove('chat-dock--hidden');
      renderThreads();
    }
  })();
}
