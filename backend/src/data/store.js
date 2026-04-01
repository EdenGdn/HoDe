const now = () => new Date().toISOString();

export const db = {
  users: [],
  refreshTokens: new Map(),
  verificationCodes: new Map(),
  reviews: [],
  notifications: [],
  hirings: [],
  payments: [],
  workers: [
    { id: 1, name: 'María González', specialty: 'Desarrolladora Web', city: 'Bogotá', tags: ['Web', 'E-commerce', 'SEO'], rating: 4.9, lat: 4.711, lng: -74.0721, bio: 'Desarrollo sitios y tiendas online con foco en rendimiento.', experience: 5, verified: true },
    { id: 2, name: 'Carlos Rodríguez', specialty: 'Electricista', city: 'Medellín', tags: ['Hogar', 'Comercial', 'Urgencias'], rating: 4.8, lat: 6.2442, lng: -75.5812, bio: 'Especialista en instalaciones residenciales y comerciales.', experience: 8, verified: true },
    { id: 3, name: 'Ana López', specialty: 'Diseñadora Gráfica', city: 'Cali', tags: ['Branding', 'Social Media', 'UI'], rating: 4.9, lat: 3.4516, lng: -76.532, bio: 'Diseño identidad visual y piezas de alto impacto.', experience: 6, verified: true },
    { id: 4, name: 'Santiago Herrera', specialty: 'Plomero', city: 'Bogotá', tags: ['Hogar', 'Urgencias', 'Mantenimiento'], rating: 4.7, lat: 4.628, lng: -74.065, bio: 'Atiendo fugas, instalaciones y mantenimiento preventivo.', experience: 10, verified: true },
    { id: 5, name: 'Paula Ríos', specialty: 'Marketing Digital', city: 'Barranquilla', tags: ['Ads', 'SEO', 'Contenido'], rating: 4.8, lat: 10.9685, lng: -74.7813, bio: 'Creo estrategias para captar clientes con campañas medibles.', experience: 4, verified: true },
    { id: 6, name: 'Diego Cárdenas', specialty: 'Técnico de Aire Acondicionado', city: 'Medellín', tags: ['Mantenimiento', 'Comercial', 'Instalación'], rating: 4.8, lat: 6.251, lng: -75.563, bio: 'Instalación y mantenimiento de equipos residenciales.', experience: 7, verified: false }
  ],
  chats: [],
  services: [],
  insuranceRequests: []
};

let userSeq = 1;
let chatSeq = 1;
let messageSeq = 1;
let reviewSeq = 1;
let notificationSeq = 1;
let hiringSeq = 1;
let paymentSeq = 1;
let workerSeq = 7;
let serviceSeq = 1;

export function createUser(payload) {
  const user = {
    id: userSeq++,
    createdAt: now(),
    settings: {
      theme: 'light',
      notifications: {
        chat: true,
        marketing: false,
        support: true
      }
    },
    ...payload
  };
  db.users.push(user);
  return user;
}

export function findUserByEmail(email) {
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

export function setVerificationCode(email, code) {
  db.verificationCodes.set(email.toLowerCase(), { code, createdAt: now() });
}

export function getVerificationCode(email) {
  return db.verificationCodes.get(email.toLowerCase()) || null;
}

export function markUserVerified(email) {
  const user = findUserByEmail(email);
  if (!user) return null;
  user.emailVerified = true;
  return user;
}

export function findUserById(id) {
  return db.users.find((user) => user.id === id) || null;
}

export function updateUserProfile(userId, payload) {
  const user = findUserById(userId);
  if (!user) {
    return null;
  }

  const next = {
    ...user,
    ...payload,
    updatedAt: now()
  };

  const index = db.users.findIndex((item) => item.id === userId);
  db.users[index] = next;
  return next;
}

export function getUserSettings(userId) {
  const user = findUserById(userId);
  if (!user) {
    return null;
  }

  return user.settings || {
    theme: 'light',
    notifications: {
      chat: true,
      marketing: false,
      support: true
    }
  };
}

export function updateUserSettings(userId, payload) {
  const user = findUserById(userId);
  if (!user) {
    return null;
  }

  const currentSettings = getUserSettings(userId);
  const merged = {
    ...currentSettings,
    ...payload,
    notifications: {
      ...currentSettings.notifications,
      ...(payload.notifications || {})
    }
  };

  const next = {
    ...user,
    settings: merged,
    updatedAt: now()
  };

  const index = db.users.findIndex((item) => item.id === userId);
  db.users[index] = next;
  return merged;
}

export function listWorkers({ search = '', tag = '' }) {
  const q = search.trim().toLowerCase();
  return db.workers.filter((worker) => {
    const searchable = `${worker.name} ${worker.specialty} ${worker.city} ${worker.tags.join(' ')}`.toLowerCase();
    const bySearch = q ? searchable.includes(q) : true;
    const byTag = tag ? worker.tags.includes(tag) : true;
    return bySearch && byTag;
  });
}

export function findWorkerById(id) {
  return db.workers.find((worker) => worker.id === id) || null;
}

export function openChat({ userId, workerId }) {
  const existing = db.chats.find((chat) => chat.userId === userId && chat.workerId === workerId);
  if (existing) {
    return existing;
  }

  const chat = {
    id: chatSeq++,
    userId,
    workerId,
    createdAt: now(),
    messages: [
      {
        id: messageSeq++,
        from: 'worker',
        content: 'Hola, gracias por contactarme. Cuéntame en qué te puedo ayudar.',
        createdAt: now()
      }
    ]
  };

  db.chats.push(chat);
  return chat;
}

export function listChatsByUser(userId) {
  return db.chats.filter((chat) => chat.userId === userId);
}

export function findChatById(chatId) {
  return db.chats.find((chat) => chat.id === chatId) || null;
}

export function addMessage({ chatId, from, content }) {
  const chat = findChatById(chatId);
  if (!chat) {
    return null;
  }

  const msg = {
    id: messageSeq++,
    from,
    content,
    createdAt: now()
  };

  chat.messages.push(msg);
  return msg;
}

/* ── Reviews / Testimonials ── */
export function createReview({ userId, userName, userRole, text, rating }) {
  const review = {
    id: reviewSeq++,
    userId,
    userName,
    userRole,
    text,
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    createdAt: now()
  };
  db.reviews.push(review);
  return review;
}

export function listReviews() {
  return db.reviews.slice().reverse();
}

export function deleteReview(reviewId, userId) {
  const idx = db.reviews.findIndex((r) => r.id === reviewId && r.userId === userId);
  if (idx === -1) return false;
  db.reviews.splice(idx, 1);
  return true;
}

/* ── Notifications ── */
export function createNotification({ userId, type, title, body }) {
  const n = { id: notificationSeq++, userId, type: type || 'info', title, body, read: false, createdAt: now() };
  db.notifications.push(n);
  return n;
}

export function listNotifications(userId) {
  return db.notifications.filter((n) => n.userId === userId).reverse();
}

export function markNotificationRead(id) {
  const n = db.notifications.find((x) => x.id === id);
  if (n) n.read = true;
  return n;
}

export function markAllNotificationsRead(userId) {
  db.notifications.filter((n) => n.userId === userId).forEach((n) => { n.read = true; });
}

/* ── Hirings ── */
export function createHiring({ userId, workerId, description, amount }) {
  const h = { id: hiringSeq++, userId, workerId, description, amount, status: 'pending', createdAt: now() };
  db.hirings.push(h);
  return h;
}

export function listHiringsByUser(userId) {
  return db.hirings.filter((h) => h.userId === userId).reverse();
}

export function updateHiringStatus(id, status) {
  const h = db.hirings.find((x) => x.id === id);
  if (h) { h.status = status; h.updatedAt = now(); }
  return h;
}

export function findHiringById(id) {
  return db.hirings.find((x) => x.id === id) || null;
}

/* ── Payments ── */
export function createPayment({ hiringId, userId, method, amount }) {
  const p = { id: paymentSeq++, hiringId, userId, method, amount, status: 'completed', createdAt: now() };
  db.payments.push(p);
  return p;
}

export function listPaymentsByUser(userId) {
  return db.payments.filter((p) => p.userId === userId).reverse();
}

/* ── Workers from pro registration ── */
export function createWorkerFromUser(user) {
  const worker = {
    id: workerSeq++,
    userId: user.id,
    name: user.name,
    specialty: user.specialty || '',
    city: user.city || '',
    tags: user.specialty ? [user.specialty] : [],
    rating: 5.0,
    lat: 0,
    lng: 0,
    bio: user.bio || '',
    experience: user.experience || 0,
    verified: false,
    avatar: '',
    createdAt: now()
  };
  db.workers.push(worker);
  return worker;
}

export function findWorkerByUserId(userId) {
  return db.workers.find((w) => w.userId === userId) || null;
}

export function updateWorkerAvatar(workerId, avatar) {
  const w = db.workers.find((x) => x.id === workerId);
  if (w) w.avatar = avatar;
  return w;
}

/* ── Services (publicaciones) ── */
export function createService({ workerId, title, description, category, price }) {
  const s = { id: serviceSeq++, workerId, title, description, category, price, createdAt: now() };
  db.services.push(s);
  return s;
}

export function listServicesByWorker(workerId) {
  return db.services.filter((s) => s.workerId === workerId);
}

export function countServicesByWorker(workerId) {
  return db.services.filter((s) => s.workerId === workerId).length;
}

export function hasDuplicateService(workerId, title, category) {
  const t = title.trim().toLowerCase();
  const c = category.trim().toLowerCase();
  return db.services.some((s) => s.workerId === workerId && s.title.trim().toLowerCase() === t && s.category.trim().toLowerCase() === c);
}

export function deleteService(serviceId, workerId) {
  const idx = db.services.findIndex((s) => s.id === serviceId && s.workerId === workerId);
  if (idx === -1) return false;
  db.services.splice(idx, 1);
  return true;
}

/* ── Insurance requests ── */
export function createInsuranceRequest({ userId, fullName, documentId, birthDate, phone, plan }) {
  const req = { id: db.insuranceRequests.length + 1, userId, fullName, documentId, birthDate, phone, plan, status: 'pending', createdAt: now() };
  db.insuranceRequests.push(req);
  return req;
}

export function getInsuranceByUser(userId) {
  return db.insuranceRequests.find((r) => r.userId === userId) || null;
}

/* ── Admin helpers ── */
export function listAllUsers() { return db.users; }
export function listAllHirings() { return db.hirings; }
export function listAllPayments() { return db.payments; }
export function getStats() {
  return {
    users: db.users.length,
    workers: db.workers.length,
    hirings: db.hirings.length,
    payments: db.payments.length,
    revenue: db.payments.reduce((s, p) => s + p.amount, 0),
    reviews: db.reviews.length
  };
}
