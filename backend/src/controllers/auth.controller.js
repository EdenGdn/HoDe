import User from '../models/User.js';
import { signAccessToken, signRefreshToken } from '../lib/jwt.js';
import { env } from '../config/env.js';

function setRefreshCookie(res, token) {
  res.cookie('hode_refresh_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export async function register(req, res) {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'username, email y password son requeridos.' });
  }

  const allowedRoles = ['admin', 'worker', 'user'];
  const finalRole = allowedRoles.includes(role) ? role : 'user';

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: 'El correo ya está registrado.' });
  }

  const user = await User.create({
    username,
    email,
    password,
    role: finalRole
  });

  const payload = { sub: user._id, email: user.email, role: user.role, name: user.username };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user._id });

  setRefreshCookie(res, refreshToken);

  return res.status(201).json({
    accessToken,
    user: user.toJSON()
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y password son requeridos.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Credenciales inválidas.' });
  }

  const payload = { sub: user._id, email: user.email, role: user.role, name: user.username };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user._id });

  setRefreshCookie(res, refreshToken);

  return res.json({
    accessToken,
    user: user.toJSON()
  });
}
