import { Router } from 'express';
import { findWorkerById, findWorkerByUserId, listWorkers, listServicesByWorker, createService, countServicesByWorker, hasDuplicateService, deleteService, getMaxServiceSlots, getWorkerSubscription, subscribeWorker, cancelWorkerSubscription, getSubscriptionTiers, listRecommendedWorkers, trackWorkerView, trackWorkerContact, getWorkerAnalytics } from '../data/store.js';
import { requireAuth } from '../middleware/auth.js';
import { serviceSchema } from '../lib/validators.js';

const router = Router();

router.get('/', (req, res) => {
  const { search = '', tag = '' } = req.query;
  const workers = listWorkers({ search: String(search), tag: String(tag) });
  const enriched = workers.map(w => {
    const sub = getWorkerSubscription(w.id);
    return { ...w, subscription: sub ? { tier: sub.tier, seal: sub.seal } : null };
  });
  return res.json(enriched);
});

/* ── Services (publicaciones de servicios) — must be before /:id ── */
router.get('/me/services', requireAuth, (req, res) => {
  const worker = findWorkerByUserId(req.user.sub);
  if (!worker) {
    return res.status(403).json({ message: 'No tienes perfil de profesional.' });
  }
  return res.json(listServicesByWorker(worker.id));
});

router.post('/me/services', requireAuth, (req, res) => {
  const worker = findWorkerByUserId(req.user.sub);
  if (!worker) {
    return res.status(403).json({ message: 'No tienes perfil de profesional.' });
  }
  if (countServicesByWorker(worker.id) >= getMaxServiceSlots(worker.id)) {
    const max = getMaxServiceSlots(worker.id);
    return res.status(400).json({ message: `Máximo ${max} publicaciones permitidas. Mejora tu suscripción para más.` });
  }
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', issues: parsed.error.issues });
  }
  if (hasDuplicateService(worker.id, parsed.data.title, parsed.data.category)) {
    return res.status(409).json({ message: 'Ya tienes un servicio con ese título y categoría.' });
  }
  const svc = createService({ workerId: worker.id, ...parsed.data });
  return res.status(201).json(svc);
});

router.delete('/me/services/:serviceId', requireAuth, (req, res) => {
  const worker = findWorkerByUserId(req.user.sub);
  if (!worker) {
    return res.status(403).json({ message: 'No tienes perfil de profesional.' });
  }
  const removed = deleteService(Number(req.params.serviceId), worker.id);
  if (!removed) {
    return res.status(404).json({ message: 'Servicio no encontrado.' });
  }
  return res.status(204).send();
});

/* ── Subscriptions — must be before /:id ── */
router.get('/subscriptions/tiers', (_req, res) => {
  return res.json(getSubscriptionTiers());
});

router.get('/subscriptions/recommended', (req, res) => {
  const city = String(req.query.city || '');
  return res.json(listRecommendedWorkers(city));
});

router.get('/me/subscription', requireAuth, (req, res) => {
  const worker = findWorkerByUserId(req.user.sub);
  if (!worker) {
    return res.status(403).json({ message: 'No tienes perfil de profesional.' });
  }
  const sub = getWorkerSubscription(worker.id);
  return res.json(sub || { tier: null });
});

router.post('/me/subscription', requireAuth, (req, res) => {
  const worker = findWorkerByUserId(req.user.sub);
  if (!worker) {
    return res.status(403).json({ message: 'No tienes perfil de profesional.' });
  }
  const { tier } = req.body || {};
  if (!tier || !['plus', 'pro', 'master'].includes(tier)) {
    return res.status(400).json({ message: 'Nivel de suscripción inválido.' });
  }
  const result = subscribeWorker(worker.id, tier);
  if (!result) {
    return res.status(400).json({ message: 'No se pudo activar la suscripción.' });
  }
  return res.json(result);
});

router.delete('/me/subscription', requireAuth, (req, res) => {
  const worker = findWorkerByUserId(req.user.sub);
  if (!worker) {
    return res.status(403).json({ message: 'No tienes perfil de profesional.' });
  }
  cancelWorkerSubscription(worker.id);
  return res.status(204).send();
});

/* ── Analytics (Master tier) ── */
router.get('/me/analytics', requireAuth, (req, res) => {
  const worker = findWorkerByUserId(req.user.sub);
  if (!worker) return res.status(403).json({ message: 'No tienes perfil de profesional.' });
  const sub = getWorkerSubscription(worker.id);
  if (!sub || sub.tier !== 'master') return res.status(403).json({ message: 'Necesitas suscripción Master para acceder a analíticas.' });
  return res.json(getWorkerAnalytics(worker.id));
});

/* ── Track view/contact ── */
router.post('/:id/track-view', (req, res) => {
  trackWorkerView(Number(req.params.id));
  return res.json({ ok: true });
});

router.post('/:id/track-contact', (req, res) => {
  trackWorkerContact(Number(req.params.id));
  return res.json({ ok: true });
});

router.get('/:id', (req, res) => {
  const worker = findWorkerById(Number(req.params.id));
  if (!worker) {
    return res.status(404).json({ message: 'Profesional no encontrado' });
  }
  return res.json(worker);
});

router.get('/:id/services', (req, res) => {
  const worker = findWorkerById(Number(req.params.id));
  if (!worker) {
    return res.status(404).json({ message: 'Profesional no encontrado' });
  }
  return res.json(listServicesByWorker(worker.id));
});

export default router;
