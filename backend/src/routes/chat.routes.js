import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { addMessage, findChatById, findWorkerById, listChatsByUser, openChat } from '../data/store.js';
import { sendMessageSchema } from '../lib/validators.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const chats = listChatsByUser(req.user.sub).map((chat) => ({
    id: chat.id,
    workerId: chat.workerId,
    createdAt: chat.createdAt,
    lastMessage: chat.messages[chat.messages.length - 1] || null
  }));
  return res.json(chats);
});

router.post('/open', (req, res) => {
  const workerId = Number(req.body.workerId);
  if (!workerId) {
    return res.status(400).json({ message: 'workerId es requerido' });
  }

  const worker = findWorkerById(workerId);
  if (!worker) {
    return res.status(404).json({ message: 'Profesional no encontrado' });
  }

  const chat = openChat({ userId: req.user.sub, workerId });
  return res.status(201).json(chat);
});

router.get('/:chatId/messages', (req, res) => {
  const chat = findChatById(Number(req.params.chatId));
  if (!chat || chat.userId !== req.user.sub) {
    return res.status(404).json({ message: 'Chat no encontrado' });
  }

  return res.json(chat.messages);
});

router.post('/:chatId/messages', (req, res) => {
  const chat = findChatById(Number(req.params.chatId));
  if (!chat || chat.userId !== req.user.sub) {
    return res.status(404).json({ message: 'Chat no encontrado' });
  }

  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Mensaje inválido', issues: parsed.error.issues });
  }

  const message = addMessage({ chatId: chat.id, from: 'user', content: parsed.data.content });
  return res.status(201).json(message);
});

export default router;
