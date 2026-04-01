import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import {
  createHiring, listHiringsByUser, updateHiringStatus, findHiringById,
  createPayment, listPaymentsByUser, createNotification, findWorkerById
} from '../data/store.js';

const router = Router();
router.use(requireAuth);

const hiringSchema = z.object({
  workerId: z.number().int().positive(),
  description: z.string().min(1).max(500),
  amount: z.number().positive()
});

const paymentSchema = z.object({
  hiringId: z.number().int().positive(),
  method: z.enum(['paypal', 'stripe', 'mercadopago', 'wise', 'bank_transfer']),
  amount: z.number().positive()
});

// List hirings
router.get('/', (req, res) => res.json(listHiringsByUser(req.user.sub)));

// Create hiring
router.post('/', (req, res) => {
  const parsed = hiringSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos', issues: parsed.error.issues });

  const worker = findWorkerById(parsed.data.workerId);
  if (!worker) return res.status(404).json({ message: 'Profesional no encontrado' });

  const h = createHiring({ userId: req.user.sub, ...parsed.data });
  createNotification({ userId: req.user.sub, type: 'hiring', title: 'Contratación creada', body: `Has contratado a ${worker.name}` });
  return res.status(201).json(h);
});

// Update status
router.patch('/:id/status', (req, res) => {
  const status = req.body.status;
  if (!['active', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ message: 'Estado inválido' });
  const h = updateHiringStatus(Number(req.params.id), status);
  return h ? res.json(h) : res.status(404).json({ message: 'Contratación no encontrada' });
});

// List payments
router.get('/payments', (req, res) => res.json(listPaymentsByUser(req.user.sub)));

// Create payment
router.post('/payments', (req, res) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos', issues: parsed.error.issues });

  const hiring = findHiringById(parsed.data.hiringId);
  if (!hiring || hiring.userId !== req.user.sub) return res.status(404).json({ message: 'Contratación no encontrada' });

  const p = createPayment({ userId: req.user.sub, ...parsed.data });
  updateHiringStatus(hiring.id, 'completed');
  createNotification({ userId: req.user.sub, type: 'payment', title: 'Pago realizado', body: `Pago de $${parsed.data.amount} vía ${parsed.data.method}` });
  return res.status(201).json(p);
});

export default router;
