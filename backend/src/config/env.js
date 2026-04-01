import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5500',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'access_dev_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_dev_secret',
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
};
