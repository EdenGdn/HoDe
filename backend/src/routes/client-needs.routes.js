import { Router } from 'express';
import { listClientNeeds, listClientNeedsByUser, createClientNeed, deleteClientNeed, countClientNeedsByUser, getMaxClientNeeds, getClientSubscriptionTiers, getClientSubscription, subscribeClient, cancelClientSubscription, findUserById, createNeedResponse, listResponsesByNeed, countResponsesByNeed, findClientNeedById, notifyWorkersOfNeed, notifyClientOfResponse, findWorkerByUserId } from '../data/store.js';
import { requireAuth } from '../middleware/auth.js';
import { clientNeedSchema } from '../lib/validators.js';

const router = Router();

/* Public: list all open needs */
router.get('/', (req, res) => {
  const { search = '', category = '' } = req.query;
  const needs = listClientNeeds({ search: String(search), category: String(category) });
  const enriched = needs.map(n => ({ ...n, responseCount: countResponsesByNeed(n.id) }));
  return res.json(enriched);
});

/* Auth: my needs */
router.get('/me', requireAuth, (req, res) => {
  return res.json(listClientNeedsByUser(req.user.sub));
});

router.post('/me', requireAuth, (req, res) => {
  const user = findUserById(req.user.sub);
  if (!user || user.role !== 'client') {
    return res.status(403).json({ message: 'Solo clientes pueden publicar necesidades.' });
  }

  const max = getMaxClientNeeds(req.user.sub);
  if (countClientNeedsByUser(req.user.sub) >= max) {
    return res.status(400).json({ message: `Máximo ${max} publicaciones permitidas. Mejora tu suscripción para más.` });
  }

  const parsed = clientNeedSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', issues: parsed.error.issues });
  }

  const need = createClientNeed({
    userId: req.user.sub,
    userName: user.name,
    city: user.city || '',
    ...parsed.data
  });
  /* Notify workers with priority timing based on subscription */
  notifyWorkersOfNeed(need);
  return res.status(201).json(need);
});

router.delete('/me/:needId', requireAuth, (req, res) => {
  const removed = deleteClientNeed(Number(req.params.needId), req.user.sub);
  if (!removed) {
    return res.status(404).json({ message: 'Publicación no encontrada.' });
  }
  return res.status(204).send();
});

/* ── Responses to client needs ── */
router.get('/:needId/responses', (req, res) => {
  const responses = listResponsesByNeed(Number(req.params.needId));
  return res.json(responses);
});

router.post('/:needId/responses', requireAuth, (req, res) => {
  const user = findUserById(req.user.sub);
  if (!user || user.role !== 'pro') {
    return res.status(403).json({ message: 'Solo profesionales pueden responder.' });
  }
  const need = findClientNeedById(Number(req.params.needId));
  if (!need) return res.status(404).json({ message: 'Publicación no encontrada.' });

  const message = String(req.body.message || '').trim();
  if (!message || message.length < 5 || message.length > 500) {
    return res.status(400).json({ message: 'El mensaje debe tener entre 5 y 500 caracteres.' });
  }

  const worker = findWorkerByUserId(req.user.sub);
  const r = createNeedResponse({
    needId: need.id,
    workerId: worker ? worker.id : 0,
    workerName: user.name,
    message
  });
  notifyClientOfResponse(need, user.name);
  return res.status(201).json(r);
});

/* Client subscriptions */
router.get('/subscriptions/tiers', (_req, res) => {
  return res.json(getClientSubscriptionTiers());
});

router.get('/me/subscription', requireAuth, (req, res) => {
  const sub = getClientSubscription(req.user.sub);
  return res.json(sub || { tier: null });
});

router.post('/me/subscription', requireAuth, (req, res) => {
  const { tier } = req.body || {};
  if (!tier || !['preferente', 'elite'].includes(tier)) {
    return res.status(400).json({ message: 'Nivel de suscripción inválido.' });
  }
  const result = subscribeClient(req.user.sub, tier);
  if (!result) {
    return res.status(400).json({ message: 'No se pudo activar la suscripción.' });
  }
  return res.json(result);
});

router.delete('/me/subscription', requireAuth, (req, res) => {
  cancelClientSubscription(req.user.sub);
  return res.status(204).send();
});

export default router;
