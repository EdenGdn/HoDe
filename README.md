# HoDe

Plataforma web que conecta clientes con profesionales verificados del hogar y servicios digitales. El proyecto incluye un **frontend** estático (HTML/CSS/JS vanilla) y un **backend** REST con Node.js + Express. El almacenamiento es en memoria (sin base de datos externa), ideal para desarrollo y demos.

---

## Tabla de contenidos

- [Características](#características)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución](#ejecución)
- [Endpoints de la API](#endpoints-de-la-api)
- [Tecnologías](#tecnologías)
- [Navegadores soportados](#navegadores-soportados)
- [Notas de producción](#notas-de-producción)
- [Licencia](#licencia)

---

## Características

| Capa | Detalle |
|------|---------|
| **Frontend** | Landing page responsive, cursor luminoso, parallax, PWA con Service Worker, mapa interactivo (Leaflet), sistema de mensajería, panel de administración, historial de contrataciones, pagos, perfil público, notificaciones push. |
| **Backend** | Autenticación JWT (access + refresh token en cookie `httpOnly`), registro dual (cliente/profesional), CRUD de contrataciones y pagos, chat en tiempo real, reseñas, notificaciones, panel admin, validación con Zod. |

---

## Estructura del proyecto

```
HoDe/
├── index.html                  # SPA – página principal
├── manifest.json               # Manifiesto PWA
├── sw.js                       # Service Worker (cache-first)
├── css/
│   ├── styles.css              # Punto de entrada CSS (@import)
│   ├── variables.css           # Tokens de diseño (OKLCH)
│   ├── reset.css               # Reset moderno
│   └── components/             # Un archivo por componente visual
├── js/
│   ├── polyfills.js            # Compatibilidad con navegadores antiguos
│   ├── script.js               # Orquestador – inicializa todos los módulos
│   └── modules/                # Un módulo por funcionalidad
│       ├── auth.js
│       ├── dashboard.js
│       ├── messages.js
│       ├── workers.js
│       ├── payments.js
│       ├── map-search.js
│       ├── notifications.js
│       └── ...
├── icons/                      # Íconos SVG para PWA
└── backend/
    ├── package.json
    ├── .env.example            # Plantilla de variables de entorno
    └── src/
        ├── server.js           # Entrada Express
        ├── config/
        │   └── env.js          # Lectura y defaults de env vars
        ├── data/
        │   └── store.js        # Almacenamiento en memoria
        ├── lib/
        │   ├── jwt.js          # Firma y verificación de tokens
        │   ├── password.js     # Hashing con bcryptjs
        │   └── validators.js   # Esquemas Zod
        ├── middleware/
        │   └── auth.js         # Guard requireAuth (Bearer token)
        └── routes/
            ├── auth.routes.js
            ├── workers.routes.js
            ├── chat.routes.js
            ├── reviews.routes.js
            ├── notifications.routes.js
            ├── hirings.routes.js
            └── admin.routes.js
```

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| **Node.js** | 18 LTS o superior |
| **npm** | 9+ (incluido con Node) |

El frontend es estático y solo necesita un servidor de archivos. Se recomienda la extensión **Live Server** de VS Code (puerto por defecto `5500`).

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd HoDe

# 2. Instalar dependencias del backend
cd backend
npm install
```

El frontend no tiene dependencias que instalar.

---

## Variables de entorno

El backend lee sus variables desde `backend/.env`. Se incluye una plantilla de ejemplo:

```bash
# Copiar la plantilla
cp backend/.env.example backend/.env
```

Contenido de `.env.example` y descripción de cada variable:

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `PORT` | `4000` | Puerto en el que escucha el servidor Express. |
| `CLIENT_ORIGIN` | `http://127.0.0.1:5500` | Origen permitido por CORS. Debe coincidir con la URL donde sirves el frontend (ej. Live Server). |
| `JWT_ACCESS_SECRET` | `change_this_access_secret` | Clave secreta para firmar los tokens de acceso. **Cambiar en producción.** |
| `JWT_REFRESH_SECRET` | `change_this_refresh_secret` | Clave secreta para firmar los tokens de refresco. **Cambiar en producción.** |
| `ACCESS_TOKEN_EXPIRES_IN` | `15m` | Tiempo de vida del access token (formato `ms`-compatible: `15m`, `1h`). |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | Tiempo de vida del refresh token. |

> **Importante:** nunca subas el archivo `.env` al repositorio. Verifica que esté listado en `.gitignore`.

---

## Ejecución

### 1. Backend (API REST)

```bash
cd backend

# Desarrollo (hot-reload con --watch)
npm run dev

# Producción
npm start
```

El servidor estará disponible en **`http://localhost:4000`**. Puedes verificar que funciona con:

```bash
curl http://localhost:4000/health
# Respuesta esperada: {"status":"ok","service":"hode-backend"}
```

### 2. Frontend (cliente)

Opción A — **VS Code Live Server** (recomendado):

1. Abre la carpeta raíz `HoDe/` en VS Code.
2. Haz clic derecho sobre `index.html` → *Open with Live Server*.
3. Se abrirá en `http://127.0.0.1:5500` (el origen que espera el backend por defecto).

Opción B — **Cualquier servidor de archivos estáticos**:

```bash
# Desde la raíz del proyecto
npx serve .

# O con Python
python -m http.server 5500
```

> Si usas un puerto distinto a `5500`, actualiza `CLIENT_ORIGIN` en `backend/.env` para que CORS funcione correctamente.

### Resumen rápido

| Servicio | Comando | URL |
|----------|---------|-----|
| Backend | `cd backend && npm run dev` | `http://localhost:4000` |
| Frontend | Live Server o `npx serve .` | `http://127.0.0.1:5500` |

---

## Endpoints de la API

Todos los endpoints están bajo el prefijo `/api`. Las rutas protegidas requieren el header `Authorization: Bearer <access_token>`.

### Auth (`/api/auth`)

| Método | Ruta | Protegido | Descripción |
|--------|------|:---------:|-------------|
| `POST` | `/register/client` | No | Registro de cliente |
| `POST` | `/register/pro` | No | Registro de profesional |
| `POST` | `/login` | No | Inicio de sesión → access + refresh token |
| `POST` | `/refresh` | No | Renueva access token (cookie refresh) |
| `POST` | `/logout` | No | Cierra sesión (elimina refresh token) |
| `GET` | `/me` | Sí | Datos del usuario autenticado |
| `GET` | `/profile` | Sí | Perfil completo |
| `PATCH` | `/profile` | Sí | Actualizar perfil |
| `GET` | `/settings` | Sí | Configuraciones del usuario |
| `PUT` | `/settings` | Sí | Guardar configuraciones |
| `POST` | `/verify-email` | No | Verificar código de email |
| `POST` | `/resend-code` | No | Reenviar código de verificación |

### Workers (`/api/workers`)

| Método | Ruta | Protegido | Descripción |
|--------|------|:---------:|-------------|
| `GET` | `/` | No | Listar profesionales (`?search=&tag=`) |
| `GET` | `/:id` | No | Detalle de un profesional |
| `GET` | `/me/services` | Sí | Servicios publicados por el profesional |
| `POST` | `/me/services` | Sí | Crear publicación de servicio (máx. 3) |

### Chats (`/api/chats`)

| Método | Ruta | Protegido | Descripción |
|--------|------|:---------:|-------------|
| `GET` | `/` | Sí | Listar conversaciones del usuario |
| `POST` | `/open` | Sí | Abrir chat con un profesional |
| `GET` | `/:chatId/messages` | Sí | Mensajes de una conversación |
| `POST` | `/:chatId/messages` | Sí | Enviar mensaje |

### Reviews (`/api/reviews`)

| Método | Ruta | Protegido | Descripción |
|--------|------|:---------:|-------------|
| `GET` | `/` | No | Listar reseñas |
| `POST` | `/` | Sí | Crear reseña |

### Notifications (`/api/notifications`)

| Método | Ruta | Protegido | Descripción |
|--------|------|:---------:|-------------|
| `GET` | `/` | Sí | Listar notificaciones |
| `PATCH` | `/:id/read` | Sí | Marcar notificación como leída |
| `POST` | `/read-all` | Sí | Marcar todas como leídas |

### Hirings (`/api/hirings`)

| Método | Ruta | Protegido | Descripción |
|--------|------|:---------:|-------------|
| `GET` | `/` | Sí | Historial de contrataciones |
| `POST` | `/` | Sí | Crear contratación |
| `PATCH` | `/:id/status` | Sí | Cambiar estado de contratación |
| `GET` | `/payments` | Sí | Listar pagos del usuario |
| `POST` | `/payments` | Sí | Registrar pago |

### Admin (`/api/admin`) — requiere rol `admin`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/stats` | Estadísticas generales |
| `GET` | `/users` | Listar usuarios |
| `GET` | `/hirings` | Todas las contrataciones |
| `GET` | `/payments` | Todos los pagos |
| `GET` | `/reviews` | Todas las reseñas |
| `GET` | `/workers` | Todos los profesionales |

---

## Tecnologías

### Frontend

- HTML5 semántico
- CSS3 — Variables, Grid, Flexbox, OKLCH, `@supports` fallbacks
- JavaScript ES6+ (vanilla, sin frameworks)
- Leaflet.js — Mapa interactivo de búsqueda
- Service Worker + Web App Manifest (PWA)

### Backend

- **Node.js** 18+
- **Express** 4 — Servidor HTTP y enrutamiento
- **jsonwebtoken** — Autenticación JWT
- **bcryptjs** — Hashing de contraseñas
- **Zod** — Validación de esquemas
- **cookie-parser** — Manejo de cookies `httpOnly`
- **cors** — Control de origen cruzado
- **dotenv** — Variables de entorno

---

## Navegadores soportados

| Navegador | Versión mínima |
|-----------|----------------|
| Chrome | 60+ |
| Firefox | 55+ |
| Safari | 12+ |
| Edge | 79+ |
| IE 11 | Funcionalidad básica (polyfills) |

---

## Notas de producción

- Reemplazar el almacenamiento en memoria (`store.js`) por una base de datos persistente (PostgreSQL, MongoDB, etc.).
- Generar secretos JWT seguros y únicos (`openssl rand -base64 32`).
- Habilitar `secure: true` y `sameSite: 'strict'` en las cookies bajo HTTPS.
- Servir el frontend con un CDN o servidor web como Nginx.
- Configurar rate limiting y helmet para headers de seguridad.
- Reemplazar los íconos SVG placeholder por los activos finales.

---

## Licencia

Este proyecto es para fines demostrativos. Adaptar según necesidades comerciales.