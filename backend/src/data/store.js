import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/* Store data.json outside the watched src/ tree so node --watch
   and Live Server do not pick up changes and trigger restarts/reloads. */
const DATA_DIR = join(__dirname, '..', '..', '.data');
const DATA_FILE = join(DATA_DIR, 'data.json');

const now = () => new Date().toISOString();

export const db = {
  users: [],
  refreshTokens: new Map(),
  verificationCodes: new Map(),
  reviews: [],
  notifications: [],
  hirings: [],
  payments: [],
  notificationQueue: [],
  workerAnalytics: {},
  needResponses: [],
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
  insuranceRequests: [],
  clientNeeds: []
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
let clientNeedSeq = 1;
let needResponseSeq = 1;

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

/* ── Client Needs (publicaciones de clientes) ── */
export function createClientNeed({ userId, userName, city, title, description, category, budget }) {
  const need = { id: clientNeedSeq++, userId, userName, city, title, description, category, budget, status: 'open', createdAt: now() };
  db.clientNeeds.push(need);
  return need;
}

export function listClientNeeds({ search = '', category = '' } = {}) {
  const q = search.trim().toLowerCase();
  return db.clientNeeds.filter((n) => {
    if (n.status !== 'open') return false;
    const text = `${n.title} ${n.description} ${n.category} ${n.city} ${n.userName}`.toLowerCase();
    const bySearch = q ? text.includes(q) : true;
    const byCategory = category ? n.category.toLowerCase() === category.toLowerCase() : true;
    return bySearch && byCategory;
  }).reverse();
}

export function listClientNeedsByUser(userId) {
  return db.clientNeeds.filter((n) => n.userId === userId).reverse();
}

export function deleteClientNeed(needId, userId) {
  const idx = db.clientNeeds.findIndex((n) => n.id === needId && n.userId === userId);
  if (idx === -1) return false;
  db.clientNeeds.splice(idx, 1);
  return true;
}

export function countClientNeedsByUser(userId) {
  return db.clientNeeds.filter((n) => n.userId === userId).length;
}

/* ── Subscriptions ── */
const SUBSCRIPTION_TIERS = {
  plus: { name: 'HoDe Plus', extraSlots: 7, carousel: true, seal: 'plus', priorityNotif: false, highlightPhotos: false, analytics: false, price: 149 },
  pro: { name: 'HoDe Pro', extraSlots: 7, carousel: true, seal: 'pro', priorityNotif: true, highlightPhotos: false, analytics: false, price: 299 },
  master: { name: 'HoDe Master', extraSlots: 7, carousel: true, seal: 'master', priorityNotif: true, highlightPhotos: true, analytics: true, price: 549 }
};

export function getSubscriptionTiers() {
  return SUBSCRIPTION_TIERS;
}

export function subscribeWorker(workerId, tier) {
  if (!SUBSCRIPTION_TIERS[tier]) return null;
  const worker = findWorkerById(workerId);
  if (!worker) return null;
  worker.subscription = { tier, subscribedAt: now() };
  return { ...SUBSCRIPTION_TIERS[tier], tier };
}

export function cancelWorkerSubscription(workerId) {
  const worker = findWorkerById(workerId);
  if (!worker || !worker.subscription) return false;
  worker.subscription = null;
  return true;
}

export function getWorkerSubscription(workerId) {
  const worker = findWorkerById(workerId);
  if (!worker || !worker.subscription) return null;
  const tier = worker.subscription.tier;
  return { tier, ...SUBSCRIPTION_TIERS[tier], subscribedAt: worker.subscription.subscribedAt };
}

export function getMaxServiceSlots(workerId) {
  const sub = getWorkerSubscription(workerId);
  return 3 + (sub ? sub.extraSlots : 0);
}

export function listRecommendedWorkers(city) {
  const cityLower = (city || '').toLowerCase();
  return db.workers.filter(w => {
    if (!w.subscription) return false;
    if (cityLower && w.city && w.city.toLowerCase() !== cityLower) return false;
    return true;
  }).sort((a, b) => {
    const tierOrder = { master: 0, pro: 1, plus: 2 };
    return (tierOrder[a.subscription.tier] || 9) - (tierOrder[b.subscription.tier] || 9);
  });
}

/* ── Client Subscriptions ── */
const CLIENT_SUB_TIERS = {
  preferente: { name: 'HoDe Preferente', price: 99, badge: false, recommendedPros: true, boostNeeds: true, aiDraft: false, prioritySupport: false },
  elite: { name: 'HoDe Elite', price: 199, badge: true, recommendedPros: true, boostNeeds: true, aiDraft: true, prioritySupport: true }
};

export function getClientSubscriptionTiers() {
  return CLIENT_SUB_TIERS;
}

export function subscribeClient(userId, tier) {
  if (!CLIENT_SUB_TIERS[tier]) return null;
  const user = findUserById(userId);
  if (!user) return null;
  user.clientSubscription = { tier, subscribedAt: now() };
  return { ...CLIENT_SUB_TIERS[tier], tier };
}

export function cancelClientSubscription(userId) {
  const user = findUserById(userId);
  if (!user || !user.clientSubscription) return false;
  user.clientSubscription = null;
  return true;
}

export function getClientSubscription(userId) {
  const user = findUserById(userId);
  if (!user || !user.clientSubscription) return null;
  const tier = user.clientSubscription.tier;
  return { tier, ...CLIENT_SUB_TIERS[tier], subscribedAt: user.clientSubscription.subscribedAt };
}

export function getMaxClientNeeds(userId) {
  const sub = getClientSubscription(userId);
  return sub ? 10 : 3;
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

/* ── Need Responses (workers respond to client needs) ── */
export function createNeedResponse({ needId, workerId, workerName, message }) {
  const r = { id: needResponseSeq++, needId, workerId, workerName, message, createdAt: now() };
  db.needResponses.push(r);
  return r;
}

export function listResponsesByNeed(needId) {
  return db.needResponses.filter(r => r.needId === needId).reverse();
}

export function listResponsesByWorker(workerId) {
  return db.needResponses.filter(r => r.workerId === workerId).reverse();
}

export function countResponsesByNeed(needId) {
  return db.needResponses.filter(r => r.needId === needId).length;
}

export function findClientNeedById(id) {
  return db.clientNeeds.find(n => n.id === id) || null;
}

/* ── Priority notification queue ── */
export function queueNotification({ userId, type, title, body, delayMs }) {
  const deliverAt = new Date(Date.now() + (delayMs || 0)).toISOString();
  db.notificationQueue.push({ userId, type, title, body, deliverAt, delivered: false });
}

export function deliverDueNotifications() {
  const nowMs = Date.now();
  const due = db.notificationQueue.filter(q => !q.delivered && new Date(q.deliverAt).getTime() <= nowMs);
  due.forEach(q => {
    createNotification({ userId: q.userId, type: q.type, title: q.title, body: q.body });
    q.delivered = true;
  });
  return due.length;
}

/* Notify workers of a new client need with priority timing */
export function notifyWorkersOfNeed(need) {
  db.workers.forEach(w => {
    if (!w.userId) return;
    const sub = getWorkerSubscription(w.id);
    let delayMs = 15 * 60 * 1000; // default 15 min
    if (sub) {
      if (sub.tier === 'master') delayMs = 0;
      else if (sub.tier === 'pro') delayMs = 2 * 60 * 1000; // 2 min
      else if (sub.tier === 'plus') delayMs = 5 * 60 * 1000; // 5 min
    }
    queueNotification({
      userId: w.userId,
      type: 'new_need',
      title: '📋 Nueva necesidad de cliente',
      body: `${need.userName} busca: ${need.title}`,
      delayMs
    });
  });
}

/* Notify client of a response to their need */
export function notifyClientOfResponse(need, workerName) {
  const user = findUserById(need.userId);
  if (!user) return;
  const clientSub = getClientSubscription(need.userId);
  let delayMs = 10 * 60 * 1000;
  if (clientSub) {
    if (clientSub.tier === 'elite') delayMs = 0;
    else if (clientSub.tier === 'preferente') delayMs = 3 * 60 * 1000;
  }
  queueNotification({
    userId: need.userId,
    type: 'need_response',
    title: '💬 Un profesional respondió tu necesidad',
    body: `${workerName} quiere ayudarte con: ${need.title}`,
    delayMs
  });
}

/* ── Worker Analytics ── */
export function trackWorkerView(workerId) {
  if (!db.workerAnalytics[workerId]) {
    db.workerAnalytics[workerId] = { views: 0, contacts: 0, viewsByDay: {}, contactsByDay: {} };
  }
  db.workerAnalytics[workerId].views++;
  const day = new Date().toISOString().slice(0, 10);
  db.workerAnalytics[workerId].viewsByDay[day] = (db.workerAnalytics[workerId].viewsByDay[day] || 0) + 1;
}

export function trackWorkerContact(workerId) {
  if (!db.workerAnalytics[workerId]) {
    db.workerAnalytics[workerId] = { views: 0, contacts: 0, viewsByDay: {}, contactsByDay: {} };
  }
  db.workerAnalytics[workerId].contacts++;
  const day = new Date().toISOString().slice(0, 10);
  db.workerAnalytics[workerId].contactsByDay[day] = (db.workerAnalytics[workerId].contactsByDay[day] || 0) + 1;
}

export function getWorkerAnalytics(workerId) {
  const a = db.workerAnalytics[workerId] || { views: 0, contacts: 0, viewsByDay: {}, contactsByDay: {} };
  // Calculate ranking among all workers
  const allWorkers = db.workers.filter(w => w.userId);
  const sortedByViews = allWorkers.map(w => ({
    id: w.id,
    views: (db.workerAnalytics[w.id] || { views: 0 }).views
  })).sort((x, y) => y.views - x.views);
  const rank = sortedByViews.findIndex(w => w.id === workerId) + 1;
  return { ...a, ranking: rank || allWorkers.length, totalWorkers: allWorkers.length };
}

/* ── Identity Validation ── */
export function submitIdentityValidation(userId, { fullName, documentId, documentType, selfieUrl }) {
  const user = findUserById(userId);
  if (!user) return null;
  user.identityValidation = {
    fullName,
    documentId,
    documentType: documentType || 'ine',
    selfieUrl: selfieUrl || '',
    status: 'pending',
    submittedAt: now()
  };
  return user.identityValidation;
}

export function getIdentityValidation(userId) {
  const user = findUserById(userId);
  if (!user || !user.identityValidation) return null;
  return user.identityValidation;
}

export function approveIdentityValidation(userId) {
  const user = findUserById(userId);
  if (!user || !user.identityValidation) return null;
  user.identityValidation.status = 'approved';
  user.identityValidation.approvedAt = now();
  // If worker, mark as verified
  const worker = findWorkerByUserId(userId);
  if (worker) worker.verified = true;
  return user.identityValidation;
}

export function rejectIdentityValidation(userId) {
  const user = findUserById(userId);
  if (!user || !user.identityValidation) return null;
  user.identityValidation.status = 'rejected';
  user.identityValidation.rejectedAt = now();
  return user.identityValidation;
}

/* ── Data Persistence (JSON file) ── */
export function persistData() {
  try { mkdirSync(DATA_DIR, { recursive: true }); } catch (_) { /* already exists */ }
  const snapshot = {
    users: db.users.map(u => ({ ...u })),
    workers: db.workers,
    reviews: db.reviews,
    notifications: db.notifications,
    hirings: db.hirings,
    payments: db.payments,
    chats: db.chats,
    services: db.services,
    insuranceRequests: db.insuranceRequests,
    clientNeeds: db.clientNeeds,
    needResponses: db.needResponses,
    workerAnalytics: db.workerAnalytics,
    notificationQueue: db.notificationQueue,
    sequences: { userSeq, chatSeq, messageSeq, reviewSeq, notificationSeq, hiringSeq, paymentSeq, workerSeq, serviceSeq, clientNeedSeq, needResponseSeq }
  };
  try {
    writeFileSync(DATA_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error persisting data:', e.message);
  }
}

export function loadPersistedData() {
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    const snapshot = JSON.parse(raw);
    if (snapshot.users) { db.users.length = 0; snapshot.users.forEach(u => db.users.push(u)); }
    if (snapshot.workers) { db.workers.length = 0; snapshot.workers.forEach(w => db.workers.push(w)); }
    if (snapshot.reviews) { db.reviews.length = 0; snapshot.reviews.forEach(r => db.reviews.push(r)); }
    if (snapshot.notifications) { db.notifications.length = 0; snapshot.notifications.forEach(n => db.notifications.push(n)); }
    if (snapshot.hirings) { db.hirings.length = 0; snapshot.hirings.forEach(h => db.hirings.push(h)); }
    if (snapshot.payments) { db.payments.length = 0; snapshot.payments.forEach(p => db.payments.push(p)); }
    if (snapshot.chats) { db.chats.length = 0; snapshot.chats.forEach(c => db.chats.push(c)); }
    if (snapshot.services) { db.services.length = 0; snapshot.services.forEach(s => db.services.push(s)); }
    if (snapshot.insuranceRequests) { db.insuranceRequests.length = 0; snapshot.insuranceRequests.forEach(i => db.insuranceRequests.push(i)); }
    if (snapshot.clientNeeds) { db.clientNeeds.length = 0; snapshot.clientNeeds.forEach(n => db.clientNeeds.push(n)); }
    if (snapshot.needResponses) { db.needResponses.length = 0; snapshot.needResponses.forEach(r => db.needResponses.push(r)); }
    if (snapshot.workerAnalytics) { Object.assign(db.workerAnalytics, snapshot.workerAnalytics); }
    if (snapshot.notificationQueue) { db.notificationQueue.length = 0; snapshot.notificationQueue.forEach(q => db.notificationQueue.push(q)); }
    if (snapshot.sequences) {
      const s = snapshot.sequences;
      if (s.userSeq) userSeq = s.userSeq;
      if (s.chatSeq) chatSeq = s.chatSeq;
      if (s.messageSeq) messageSeq = s.messageSeq;
      if (s.reviewSeq) reviewSeq = s.reviewSeq;
      if (s.notificationSeq) notificationSeq = s.notificationSeq;
      if (s.hiringSeq) hiringSeq = s.hiringSeq;
      if (s.paymentSeq) paymentSeq = s.paymentSeq;
      if (s.workerSeq) workerSeq = s.workerSeq;
      if (s.serviceSeq) serviceSeq = s.serviceSeq;
      if (s.clientNeedSeq) clientNeedSeq = s.clientNeedSeq;
      if (s.needResponseSeq) needResponseSeq = s.needResponseSeq;
    }
    console.log(`Data loaded from ${DATA_FILE} (${db.users.length} users, ${db.workers.length} workers)`);
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('Error loading persisted data:', e.message);
  }
}

/* Auto-save every 30 seconds */
let _saveTimer = null;
export function startAutoSave() {
  if (_saveTimer) return;
  _saveTimer = setInterval(persistData, 30000);
}

export function stopAutoSave() {
  if (_saveTimer) { clearInterval(_saveTimer); _saveTimer = null; }
}
