import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getStats, listAllUsers, listAllHirings, listAllPayments, listReviews, db } from '../data/store.js';

const router = Router();

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.sub !== 1 && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
}

router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats', (_req, res) => res.json(getStats()));
router.get('/users', (_req, res) => res.json(listAllUsers().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, city: u.city, createdAt: u.createdAt }))));
router.get('/hirings', (_req, res) => res.json(listAllHirings()));
router.get('/payments', (_req, res) => res.json(listAllPayments()));
router.get('/reviews', (_req, res) => res.json(listReviews()));
router.get('/workers', (_req, res) => res.json(db.workers));

export default router;
