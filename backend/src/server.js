import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..', '..');
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import workerRoutes from './routes/workers.routes.js';
import chatRoutes from './routes/chat.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import hiringRoutes from './routes/hirings.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

const allowedOrigins = [
  'https://hode.onrender.com',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];
if (env.clientOrigin && !allowedOrigins.includes(env.clientOrigin)) {
  allowedOrigins.push(env.clientOrigin);
}

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use(express.static(ROOT_DIR));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hode-backend' });
});

app.get('/api/status', (_req, res) => {
  res.json({ status: 'online', service: 'hode-backend', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hirings', hiringRoutes);
app.use('/api/admin', adminRoutes);

app.get('*', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('Error:', err.message);
  const status = err.status || 500;
  res.status(status).json({ message: status === 500 ? 'Error interno del servidor' : err.message });
});

mongoose.connect(env.mongoUri)
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err.message));

app.listen(env.port, () => {
  console.log(`HoDe backend running on http://localhost:${env.port}`);
});
