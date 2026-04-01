import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import workerRoutes from './routes/workers.routes.js';
import chatRoutes from './routes/chat.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import hiringRoutes from './routes/hirings.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.use(cors({
  origin: env.clientOrigin,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hode-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hirings', hiringRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ message: 'Error interno', detail: err.message });
});

app.listen(env.port, () => {
  console.log(`HoDe backend running on http://localhost:${env.port}`);
});
