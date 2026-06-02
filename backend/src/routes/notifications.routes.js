import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../data/store.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => res.json(listNotifications(req.user.sub)));

router.patch('/:id/read', (req, res) => {
  const n = markNotificationRead(Number(req.params.id));
  return n ? res.json(n) : res.status(404).json({ message: 'Notificación no encontrada' });
});

router.post('/read-all', (req, res) => {
  markAllNotificationsRead(req.user.sub);
  res.json({ ok: true });
});

export default router;
