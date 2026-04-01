import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createReview, listReviews, deleteReview, findUserById } from '../data/store.js';
import { z } from 'zod';

const reviewSchema = z.object({
  text: z.string().min(10).max(500),
  rating: z.coerce.number().int().min(1).max(5)
});

const router = Router();

router.get('/', (_req, res) => {
  return res.json(listReviews());
});

router.post('/', requireAuth, (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', issues: parsed.error.issues });
  }

  const user = findUserById(req.user.sub);
  if (!user) {
    return res.status(401).json({ message: 'Usuario no encontrado' });
  }

  const review = createReview({
    userId: user.id,
    userName: user.name,
    userRole: user.role === 'pro' ? 'Profesional' : 'Cliente',
    text: parsed.data.text,
    rating: parsed.data.rating
  });

  return res.status(201).json(review);
});

router.delete('/:id', requireAuth, (req, res) => {
  const deleted = deleteReview(Number(req.params.id), req.user.sub);
  if (!deleted) {
    return res.status(404).json({ message: 'Reseña no encontrada o no autorizada' });
  }
  return res.status(204).send();
});

export default router;
