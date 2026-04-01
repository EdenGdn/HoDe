import { Router } from 'express';
import { comparePassword, hashPassword } from '../lib/password.js';
import { loginSchema, registerClientSchema, registerProSchema, insuranceSchema } from '../lib/validators.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
  getUserSettings,
  updateUserSettings,
  setVerificationCode,
  getVerificationCode,
  markUserVerified,
  createWorkerFromUser,
  findWorkerByUserId,
  createInsuranceRequest,
  getInsuranceByUser,
  db
} from '../data/store.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function toPublicUser(user) {
  const workerEntry = user.role === 'pro' ? findWorkerByUserId(user.id) : null;
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    phone: user.phone || '',
    city: user.city || '',
    specialty: user.specialty || '',
    need: user.need || '',
    bio: user.bio || '',
    experience: user.experience || 0,
    workerId: workerEntry ? workerEntry.id : null
  };
}

function issueTokens(user) {
  const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user.id });
  db.refreshTokens.set(refreshToken, user.id);
  return { accessToken, refreshToken };
}

function setRefreshCookie(res, token) {
  res.cookie('hode_refresh_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

router.post('/register/client', async (req, res) => {
  const parsed = registerClientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', issues: parsed.error.issues });
  }

  if (findUserByEmail(parsed.data.email)) {
    return res.status(409).json({ message: 'El correo ya está registrado', issues: [{ path: ['email'], message: 'Este correo ya está en uso' }] });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = createUser({ role: 'client', ...parsed.data, passwordHash });
  const { accessToken, refreshToken } = issueTokens(user);
  setRefreshCookie(res, refreshToken);
  const code = generateCode();
  setVerificationCode(parsed.data.email, code);

  return res.status(201).json({
    accessToken,
    user: toPublicUser(user),
    verificationCode: code
  });
});

router.post('/register/pro', async (req, res) => {
  const parsed = registerProSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', issues: parsed.error.issues });
  }

  if (findUserByEmail(parsed.data.email)) {
    return res.status(409).json({ message: 'El correo ya está registrado', issues: [{ path: ['email'], message: 'Este correo ya está en uso' }] });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = createUser({ role: 'pro', ...parsed.data, passwordHash });
  const worker = createWorkerFromUser(user);
  const { accessToken, refreshToken } = issueTokens(user);
  setRefreshCookie(res, refreshToken);
  const code = generateCode();
  setVerificationCode(parsed.data.email, code);

  return res.status(201).json({
    accessToken,
    user: toPublicUser(user),
    verificationCode: code
  });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', issues: parsed.error.issues });
  }

  const user = findUserByEmail(parsed.data.email);
  if (!user) {
    return res.status(401).json({ message: 'No se encontró una cuenta con ese correo.', issues: [{ path: ['email'], message: 'Correo no registrado' }] });
  }

  const match = await comparePassword(parsed.data.password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ message: 'Contraseña incorrecta.', issues: [{ path: ['password'], message: 'La contraseña no coincide' }] });
  }

  const { accessToken, refreshToken } = issueTokens(user);
  setRefreshCookie(res, refreshToken);

  return res.json({
    accessToken,
    user: toPublicUser(user)
  });
});

router.post('/refresh', (req, res) => {
  const token = req.cookies.hode_refresh_token;
  if (!token) {
    return res.status(401).json({ message: 'Refresh token requerido' });
  }

  if (!db.refreshTokens.has(token)) {
    return res.status(401).json({ message: 'Refresh token inválido' });
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Usuario inválido' });
    }

    db.refreshTokens.delete(token);
    const { accessToken, refreshToken } = issueTokens(user);
    setRefreshCookie(res, refreshToken);
    return res.json({ accessToken });
  } catch (error) {
    db.refreshTokens.delete(token);
    return res.status(401).json({ message: 'Refresh token expirado o inválido' });
  }
});

router.post('/logout', (req, res) => {
  const token = req.cookies.hode_refresh_token;
  if (token) {
    db.refreshTokens.delete(token);
  }

  res.clearCookie('hode_refresh_token', { path: '/api/auth/refresh' });
  return res.status(204).send();
});

router.get('/me', requireAuth, (req, res) => {
  const user = findUserById(req.user.sub);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  return res.json(toPublicUser(user));
});

router.get('/profile', requireAuth, (req, res) => {
  const user = findUserById(req.user.sub);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  return res.json(toPublicUser(user));
});

router.patch('/profile', requireAuth, (req, res) => {
  const payload = req.body || {};
  const profileUpdate = {
    name: typeof payload.name === 'string' ? payload.name.trim() : undefined,
    phone: typeof payload.phone === 'string' ? payload.phone.trim() : undefined,
    city: typeof payload.city === 'string' ? payload.city.trim() : undefined
  };

  if (!profileUpdate.name && !profileUpdate.phone && !profileUpdate.city) {
    return res.status(400).json({ message: 'No hay cambios válidos para actualizar' });
  }

  const updated = updateUserProfile(req.user.sub, profileUpdate);
  if (!updated) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  return res.json(toPublicUser(updated));
});

router.get('/settings', requireAuth, (req, res) => {
  const settings = getUserSettings(req.user.sub);
  if (!settings) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  return res.json(settings);
});

router.put('/settings', requireAuth, (req, res) => {
  const payload = req.body || {};
  const allowedTheme = payload.theme === 'dark' || payload.theme === 'light' ? payload.theme : undefined;
  const allowedNotifications = typeof payload.notifications === 'object' && payload.notifications
    ? {
      chat: payload.notifications.chat === undefined ? undefined : Boolean(payload.notifications.chat),
      marketing: payload.notifications.marketing === undefined ? undefined : Boolean(payload.notifications.marketing),
      support: payload.notifications.support === undefined ? undefined : Boolean(payload.notifications.support)
    }
    : {};

  const updated = updateUserSettings(req.user.sub, {
    ...(allowedTheme ? { theme: allowedTheme } : {}),
    notifications: allowedNotifications
  });

  if (!updated) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  return res.json(updated);
});

/* ── Email verification ── */
router.post('/verify-email', (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ message: 'Correo y código son requeridos.' });
  }

  const stored = getVerificationCode(email);
  if (!stored || stored.code !== String(code)) {
    return res.status(400).json({ message: 'Código incorrecto o expirado.' });
  }

  const user = markUserVerified(email);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  return res.json({ verified: true, user: toPublicUser(user) });
});

router.post('/resend-code', (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: 'Correo es requerido.' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  const code = generateCode();
  setVerificationCode(email, code);
  return res.json({ sent: true, code: code });
});

/* ── Social login (demo) ── */
router.post('/social', async (req, res) => {
  const { provider } = req.body || {};
  if (!provider) {
    return res.status(400).json({ message: 'Proveedor es requerido.' });
  }

  const demoEmail = provider + '_demo@hode.app';
  let user = findUserByEmail(demoEmail);

  if (!user) {
    const passwordHash = await hashPassword('social_' + provider + '_demo');
    user = createUser({
      role: 'client',
      name: 'Usuario ' + provider.charAt(0).toUpperCase() + provider.slice(1),
      email: demoEmail,
      phone: '',
      city: '',
      need: 'Hogar',
      passwordHash,
      emailVerified: true,
      socialProvider: provider
    });
  }

  const { accessToken, refreshToken } = issueTokens(user);
  setRefreshCookie(res, refreshToken);

  return res.json({
    accessToken,
    user: toPublicUser(user)
  });
});

/* ── Insurance ── */
router.post('/insurance', requireAuth, (req, res) => {
  const user = findUserById(req.user.sub);
  if (!user || user.role !== 'pro') {
    return res.status(403).json({ message: 'Solo profesionales pueden solicitar seguro.' });
  }
  const existing = getInsuranceByUser(req.user.sub);
  if (existing) {
    return res.status(409).json({ message: 'Ya tienes una solicitud de seguro.', insurance: existing });
  }
  const parsed = insuranceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', issues: parsed.error.issues });
  }
  const ins = createInsuranceRequest({ userId: req.user.sub, ...parsed.data });
  return res.status(201).json(ins);
});

router.get('/insurance', requireAuth, (req, res) => {
  const ins = getInsuranceByUser(req.user.sub);
  return res.json(ins || null);
});

export default router;
