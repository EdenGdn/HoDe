import { Router } from 'express';
import { findWorkerById, findWorkerByUserId, listWorkers, listServicesByWorker, createService, countServicesByWorker, hasDuplicateService, deleteService } from '../data/store.js';
import { requireAuth } from '../middleware/auth.js';
import { serviceSchema } from '../lib/validators.js';

const router = Router();

router.get('/', (req, res) => {
  const { search = '', tag = '' } = req.query;
  const workers = listWorkers({ search: String(search), tag: String(tag) });
  return res.json(workers);
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
  if (countServicesByWorker(worker.id) >= 3) {
    return res.status(400).json({ message: 'Máximo 3 publicaciones permitidas.' });
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
