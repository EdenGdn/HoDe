import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import workerRoutes from './routes/workers.routes.js';
import chatRoutes from './routes/chat.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import hiringRoutes from './routes/hirings.routes.js';
import adminRoutes from './routes/admin.routes.js';
import clientNeedsRoutes from './routes/client-needs.routes.js';
import { loadPersistedData, startAutoSave, persistData, deliverDueNotifications } from './data/store.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = join(__dirname, '..', '..');

/* Load persisted data from disk */
loadPersistedData();

const allowedOrigins = [
  env.clientOrigin,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501'
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

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
app.use('/api/client-needs', clientNeedsRoutes);

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'No se encontró el recurso' });
  }
  return res.sendFile(join(PUBLIC_DIR, 'index.html'));
});

app.use((err, _req, res, _next) => {
  res.status(500).json({ message: 'Error interno', detail: err.message });
});

app.listen(env.port, () => {
  console.log(`HoDe backend running on http://localhost:${env.port}`);
  startAutoSave();
  /* Process notification queue every 10 seconds */
  setInterval(deliverDueNotifications, 10000);
});

/* Save data on shutdown */
process.on('SIGINT', () => { persistData(); process.exit(0); });
process.on('SIGTERM', () => { persistData(); process.exit(0); });
