# HoDe Backend API

Backend base para autenticación, registro dual (cliente/profesional), trabajadores y chat.

## Ejecutar

1. Copia `.env.example` a `.env`
2. Instala dependencias:
   - `npm.cmd install`
3. Inicia servidor:
   - `npm.cmd run start`

Servidor por defecto: `http://localhost:4000`

## Endpoints

### Auth
- `POST /api/auth/register/client`
- `POST /api/auth/register/pro`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Workers
- `GET /api/workers?search=&tag=`
- `GET /api/workers/:id`

### Chats
- `GET /api/chats`
- `POST /api/chats/open` body: `{ "workerId": number }`
- `GET /api/chats/:chatId/messages`
- `POST /api/chats/:chatId/messages` body: `{ "content": "texto" }`

## Notas

- Esta base usa almacenamiento en memoria.
- Los refresh tokens se envían por cookie `httpOnly`.
- Para producción, conecta una base de datos real y habilita `secure: true` en cookies bajo HTTPS.
