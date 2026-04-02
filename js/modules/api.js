// Cliente API central para HoDe
(function () {
  const API_BASE = window.API_URL || 'http://localhost:3000';
  const ACCESS_TOKEN_KEY = 'hode_access_token';
  const REQUEST_TIMEOUT = 15000;

  // ── Toast notification system ──
  var toastContainer = null;
  function ensureToastContainer() {
    if (toastContainer) return toastContainer;
    toastContainer = document.createElement('div');
    toastContainer.id = 'hode-toast-container';
    toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(toastContainer);
    return toastContainer;
  }

  function showToast(message, type) {
    var container = ensureToastContainer();
    var toast = document.createElement('div');
    var bg = type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#22c55e';
    toast.style.cssText = 'pointer-events:auto;padding:12px 20px;border-radius:8px;color:#fff;font:500 0.9rem/1.4 Inter,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.15);transform:translateX(120%);transition:transform .3s ease,opacity .3s ease;max-width:340px;background:' + bg;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(function () { toast.style.transform = 'translateX(0)'; });
    setTimeout(function () {
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 4000);
  }

  function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
  }

  function setAccessToken(token) {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      return;
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  async function request(path, options, auth, retry) {
    const requestOptions = options || {};
    const headers = new Headers(requestOptions.headers || {});

    if (!headers.has('Content-Type') && requestOptions.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (auth) {
      const token = getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT);

    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...requestOptions,
        headers,
        credentials: 'include',
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        showToast('El servidor tardó demasiado en responder.', 'warning');
      } else {
        showToast('No se pudo conectar con el servidor.', 'error');
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    if (response.status === 401 && auth && retry !== false) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return request(path, options, auth, false);
      }
    }

    if (!response.ok) {
      let message = 'Error de servidor';
      let issues = null;
      try {
        const payload = await response.json();
        message = payload.message || message;
        if (Array.isArray(payload.issues)) {
          issues = payload.issues;
        }
      } catch (error) {
        // noop
      }
      if (response.status >= 500) {
        showToast('Error del servidor. Intenta de nuevo más tarde.', 'error');
      }
      var err = new Error(message);
      err.issues = issues;
      err.status = response.status;
      throw err;
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async function refreshToken() {
    try {
      const result = await request('/api/auth/refresh', { method: 'POST' }, false, false);
      setAccessToken(result && result.accessToken ? result.accessToken : '');
      return Boolean(result && result.accessToken);
    } catch (error) {
      setAccessToken('');
      return false;
    }
  }

  window.HodeApi = {
    clearAccessToken: function () {
      setAccessToken('');
    },
    async registerClient(payload) {
      const result = await request('/api/auth/register/client', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, false, false);
      setAccessToken(result.accessToken || '');
      return result;
    },
    async registerPro(payload) {
      const result = await request('/api/auth/register/pro', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, false, false);
      setAccessToken(result.accessToken || '');
      return result;
    },
    async login(payload) {
      const result = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, false, false);
      setAccessToken(result.accessToken || '');
      return result;
    },
    async verifyEmail(payload) {
      return request('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, false, false);
    },
    async resendCode(payload) {
      return request('/api/auth/resend-code', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, false, false);
    },
    async socialLogin(payload) {
      const result = await request('/api/auth/social', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, false, false);
      setAccessToken(result.accessToken || '');
      return result;
    },
    async logout() {
      await request('/api/auth/logout', { method: 'POST' }, false, false);
      setAccessToken('');
    },
    async me() {
      return request('/api/auth/me', { method: 'GET' }, true, true);
    },
    async getProfile() {
      return request('/api/auth/profile', { method: 'GET' }, true, true);
    },
    async updateProfile(payload) {
      return request('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }, true, true);
    },
    async getSettings() {
      return request('/api/auth/settings', { method: 'GET' }, true, true);
    },
    async updateSettings(payload) {
      return request('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      }, true, true);
    },
    async listWorkers(params) {
      const searchParams = new URLSearchParams();
      if (params && params.search) {
        searchParams.set('search', params.search);
      }
      if (params && params.tag) {
        searchParams.set('tag', params.tag);
      }
      const query = searchParams.toString();
      return request(`/api/workers${query ? `?${query}` : ''}`, { method: 'GET' }, false, false);
    },
    async listChats() {
      return request('/api/chats', { method: 'GET' }, true, true);
    },
    async openChat(workerId) {
      return request('/api/chats/open', {
        method: 'POST',
        body: JSON.stringify({ workerId })
      }, true, true);
    },
    async getMessages(chatId) {
      return request(`/api/chats/${chatId}/messages`, { method: 'GET' }, true, true);
    },
    async sendMessage(chatId, content) {
      return request(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      }, true, true);
    },
    async listReviews() {
      return request('/api/reviews', { method: 'GET' }, false, false);
    },
    async createReview(payload) {
      return request('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, true, true);
    },
    async deleteReview(id) {
      return request('/api/reviews/' + id, { method: 'DELETE' }, true, true);
    },
    // Notifications
    async listNotifications() {
      return request('/api/notifications', { method: 'GET' }, true, true);
    },
    async markNotificationRead(id) {
      return request('/api/notifications/' + id + '/read', { method: 'PATCH' }, true, true);
    },
    async markAllNotificationsRead() {
      return request('/api/notifications/read-all', { method: 'POST' }, true, true);
    },
    // Hirings
    async listHirings() {
      return request('/api/hirings', { method: 'GET' }, true, true);
    },
    async createHiring(payload) {
      return request('/api/hirings', { method: 'POST', body: JSON.stringify(payload) }, true, true);
    },
    async updateHiringStatus(id, status) {
      return request('/api/hirings/' + id + '/status', { method: 'PATCH', body: JSON.stringify({ status }) }, true, true);
    },
    // Payments
    async listPayments() {
      return request('/api/hirings/payments', { method: 'GET' }, true, true);
    },
    async createPayment(payload) {
      return request('/api/hirings/payments', { method: 'POST', body: JSON.stringify(payload) }, true, true);
    },
    // Admin
    async adminStats() { return request('/api/admin/stats', { method: 'GET' }, true, true); },
    async adminUsers() { return request('/api/admin/users', { method: 'GET' }, true, true); },
    async adminHirings() { return request('/api/admin/hirings', { method: 'GET' }, true, true); },
    async adminPayments() { return request('/api/admin/payments', { method: 'GET' }, true, true); },
    async adminReviews() { return request('/api/admin/reviews', { method: 'GET' }, true, true); },
    async adminWorkers() { return request('/api/admin/workers', { method: 'GET' }, true, true); },
    // Services
    async listMyServices() { return request('/api/workers/me/services', { method: 'GET' }, true, true); },
    async createService(payload) { return request('/api/workers/me/services', { method: 'POST', body: JSON.stringify(payload) }, true, true); },
    async deleteService(id) { return request('/api/workers/me/services/' + id, { method: 'DELETE' }, true, true); },
    async getWorkerServices(workerId) { return request('/api/workers/' + workerId + '/services', { method: 'GET' }, false, false); },
    // Insurance
    async requestInsurance(payload) { return request('/api/auth/insurance', { method: 'POST', body: JSON.stringify(payload) }, true, true); },
    async getInsurance() { return request('/api/auth/insurance', { method: 'GET' }, true, true); }
  };
})();
