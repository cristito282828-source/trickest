# TheTrickest — Documentación de Estado del Proyecto

> Documento interno de referencia. Última revisión: 2026-06-19.
> Generado a partir de auditoría del código en producción (rama `master`).

---

## 1. Visión general

**TheTrickest** es una plataforma social + marketplace para la comunidad de skateboarding, construida como una single-page Next.js app con backend en Next.js API routes + PostgreSQL (Supabase) + integraciones externas (WooCommerce, Google OAuth, Supabase Storage, Supabase Realtime).

**Dominio de producción:** `thetrickest.app`
**Stack:** Next.js 14.2.21 (App Router) + TypeScript 5.9 + Prisma 6.19 + PostgreSQL (Supabase) + Tailwind 3.4 + NextUI 2.2 + next-intl 4.8 + NextAuth 4.24 + Framer Motion 11 + Sentry + Vercel hosting.

---

## 2. Funcionalidades implementadas y funcionando

### 2.1 Públicas (sin login)

| Ruta | Función |
|---|---|
| `/` | Home con secciones: hero, partners, challenges orbitales, ranking, mapa, cómo-ganar, contacto |
| `/suppls` | Catálogo de productos Tory Skateshop (WooCommerce GraphQL) con cart orbital flotante y checkout por WhatsApp |
| `/explore` | Exploración pública |
| `/profile/[username]` | Perfil público de skater con stats, dream setup, redes |
| `/spots` | Mapa interactivo (Leaflet) con spots registrados |
| `/teams` y `/teams/[name]` | Listado y detalle de teams con capitán, miembros, logo |
| `/portfolio`, `/about`, `/services`, `/testimonials`, `/coming-soon`, `/contacto` | Landing pages estáticas |
| `/interested` | Captura de leads |
| `/auth/signin` y `/auth/register` | Login con Google o email/password |

**Multi-idioma:** EN/ES, prefijo de locale en URL (`/es/...`, `/en/...`). Configurado en `src/i18n/routing.ts`.

**Middleware** (`src/middleware.ts`): protege `/dashboard/*` y `/admin/*` redirigiendo a `/` si no hay sesión.

### 2.2 Autenticación

- **NextAuth** con 2 providers:
  - **Google OAuth** (`next-auth/providers/google`) — auto-crea usuario en BD si no existe.
  - **Credentials** (`next-auth/providers/credentials`) — email + password con bcrypt.
- JWT sessions, expira a 30 días.
- Modal `SetPasswordModal` para usuarios de Google sin password.
- Auth callbacks en `src/lib/auth.ts` (líneas 78-148) enriquecen el token con `role`, `profileStatus`, `hasPassword`, `username`.

### 2.3 Dashboard del skater (`/dashboard/skaters/*`)

| Ruta | Función |
|---|---|
| `/profile` | Perfil editable: foto, datos personales, redes sociales, dream setup, ubicación |
| `/tricks` | 10 niveles + 1 bonus, cada uno con demo video, dificultad, puntos |
| `/submissions` | Historial de submissions con score, feedback, status |
| `/orders` | Mis pedidos con thumbnail de la guía de envío |
| `/leaderboard` | Ranking individual y por equipos |
| `/teams` | Crear/unirse a teams, ver mi equipo, invitaciones |
| `/logros` | Achievements con badges |
| `/vote` | Votar submissions de la comunidad |
| `/profile/[email]` | Vista admin del perfil de otro skater |

**Toggle de ubicación** (`LocationToggle`): activa/desactiva `showOnMap` del usuario y guarda lat/lng en BD.

### 2.4 Dashboard de jueces (`/dashboard/judges/*`)

- `/judges/evaluate`: cola de submissions pendientes con score 0-100 + feedback.
- Acceso también como skater (puede ver su propio perfil, ranking, teams, tricks).

### 2.5 Dashboard admin (`/dashboard/admin/*`)

| Ruta | Función |
|---|---|
| `/admin` (page.tsx) | Dashboard con stats globales (usuarios, challenges, submissions, orders) |
| `/admin/users` | Listado de usuarios con cambio de rol inline (skater/judge/admin) |
| `/admin/challenges` | CRUD completo de challenges (modal con form) |
| `/admin/submissions` | Re-evaluar submissions (cambiar score y feedback) |
| `/admin/orders` | Lista de órdenes con filtros por status + email |
| `/admin/orders/[id]` | Detalle de orden + **botón "Marcar como enviado"** que sube foto de guía a Supabase Storage y actualiza status a `shipped` con notificación al skater |
| `/admin/settings` | Settings globales (`total_levels` y similares) |

### 2.6 Sistema de órdenes (`/suppls` → checkout)

- Cart orbital flotante con animación física de 30 productos (motor custom en `src/components/orbital/orbital-engine.ts`).
- **Variations** reales del producto: al anclar un producto Tory en el orbital, aparece un selector con los talles parseados (`US 7.0 / EUR 38 / 25 cm`). Filtra `IN_STOCK` solo.
- Backend: `POST /api/orders` con Zod validation (`orderItemSchema` con `variation` opcional JSONB).
- Checkout manual por WhatsApp: el cliente envía el pedido y vos lo confirmás por chat. **No hay pasarela de pago real** (Stripe, MercadoPago, etc.) — es un MVP.

### 2.7 Sistema de notificaciones

- Tabla `Notification` (PostgreSQL) con tipo, link, metadata, read state.
- Suscripción Realtime vía `SupabaseRealtimeProvider` (`src/providers/SupabaseRealtimeProvider.tsx`).
- **Triggers** (vía API server-side, no SQL triggers):
  - `order_created` → a TODOS los admins
  - `order_{status}` → al skater dueño de la orden
  - `submission_evaluated` → al skater que envió
  - `team_invitation` → al invitado
  - `team_accepted` → al que invitó
  - `comment_reply`, `new_spot_comment` → al dueño del spot/comentario
  - `new_follower` → al seguido
  - `vote_received` → al dueño de la submission
  - `community_approved` → al skater
- UI: campana con badge de count en `Appbar`, dropdown con últimas 10, mark-all-as-read, mark-individual.

### 2.8 Integraciones externas

- **Supabase**: PostgreSQL (DB) + Storage (fotos perfil, spots, shipping guides, logos teams) + Realtime (notificaciones).
- **WooCommerce GraphQL** (`toryskateshop.com/graphqltory`): productos destacados + variations + attributes.
- **Google OAuth**: login.
- **Vercel**: hosting + deploys automáticos.
- **Sentry**: error tracking (config en `.config/sentry*`, no hay dashboard custom).

### 2.9 APIs (60+ endpoints en `src/app/api/`)

| Grupo | Endpoints clave |
|---|---|
| Auth | `auth/[...nextauth]`, `auth/register`, `auth/set-password` |
| Users | `users/[email]/profile`, `users/me`, `users/profile/[username]`, `users/score`, `users/search`, `users/check-username` |
| Follow | `follow` |
| Spots | `spots` (CRUD), `spots/[spotId]` (CRUD), `spots/nearby`, `spots/register`, `spots/[spotId]/validate`, `spots/[spotId]/photos`, `spots/[spotId]/comments/*`, `spots/[spotId]/top-comment` |
| Challenges | `challenges`, `dynamic-challenges/progress`, `admin/challenges` |
| Submissions | `submissions` (CRUD), `submissions/user`, `submissions/pending`, `submissions/evaluated`, `submissions/to-vote`, `submissions/auto-approve`, `submissions/evaluate`, `submissions/[id]/vote` |
| Teams | `teams` (CRUD), `teams/[id]` (CRUD), `teams/my-team`, `teams/invitations*`, `teams/[id]/join`, `teams/[id]/leave` |
| Leaderboards | `leaderboards/users`, `leaderboards/teams` |
| Skate profiles | `skate_profiles/*` (CRUD + sub-recursos) |
| Notifications | `notifications` (CRUD), `notifications/[id]/read`, `notifications/read-all` |
| Orders | `orders` (CRUD), `orders/[id]` (CRUD) |
| Upload | `upload/photo`, `upload/profile-image`, `upload/team-logo` |
| External | `external-products`, `external-image` (proxy de imágenes Tory con CORS) |
| Admin | `admin/*` (users, challenges, submissions, stats) |
| Other | `settings`, `map/skaters`, `activity/recent`, `interested` |

---

## 3. Modelo de datos (Prisma)

### 3.1 Conteos actuales (junio 2026)

| Modelo | Cantidad |
|---|---|
| `User` | 10 |
| `Order` | 3 |
| `OrderItem` | 3 |
| `Submission` | 2 |
| `Spot` | 0 |
| `Team` | 1 |
| `Notification` | 13 |
| `Challenge` | 2 (debería haber 11 según seed) |
| `SocialMedia` | 1 |
| `TeamInvitation` | 1 |
| `Vote` | 0 |

### 3.2 Modelos principales (resumen)

```
User (auth, perfil, score, role: skater|judge|admin)
├── submissions (1:N)
├── evaluations (1:N como judge)
├── ownedTeams (1:N como owner)
├── team (N:1 como miembro)
├── orders (1:N)
├── socialMedia (1:1)
├── WishSkate (1:1)
├── votes (1:N)
└── notifications (1:N)

Challenge (10 niveles + 1 bonus)
└── submissions (1:N)

Order
├── items (1:N, con variation JSONB)
└── user (N:1)

Submission
├── challenge (N:1)
├── user (N:1)
└── judge (N:1, nullable)

Team
├── owner (N:1)
├── members (1:N via User.team)
└── invitations (1:N)

Notification (userId, type, title, message, link, metadata JSONB, isRead)
```

**Schema completo:** `prisma/schema.prisma`. **Migraciones:** `prisma/migrations/`.

---

## 4. Hosting y deploy

- **Vercel**: hosting de producción. Deploy automático en cada push a `master` (repo `cristito282828-source/trickest`).
- **Supabase** (`znyukjpgbiqjiarnvvck`): PostgreSQL + Storage + Realtime. Plan free tier.
- **WooCommerce** de Tory Skateshop: externo, vía GraphQL público.
- **Variables de entorno** en `.env` (ver `package.json:34` para `next-auth` y supabase keys; `prisma/schema.prisma` para `DATABASE_URL`).

**Estado del build:** `npm run build` compila sin errores. Errores preexistentes en rutas legacy (`/api/users/check-username`, `/api/activity/recent`, `/admin/interested`) son warnings no bloqueantes.

---

## 5. Datos que captura

| Categoría | Datos |
|---|---|
| **Identidad** | email, username, name, photo, role, profileStatus |
| **Geolocalización** | lat, lng, showOnMap, address, departamento, ciudad |
| **Social** | redes sociales (1:1), follows |
| **Actividad skate** | dreamSetup, score total, submissions, evaluations recibidas/dadas |
| **Comercio** | orders con items + variations, shippingGuideUrl, status, customerName/Email/Phone/Address |
| **Contenido** | spots (lat/lng + fotos), comments con replies anidados, votes |
| **Notificaciones** | type, title, message, link, metadata, isRead |
| **Audit parcial** | status history en `Order` y `Spot` |

**Lo que NO captura (gap importante):**
- Duración de sesión, tiempo en página, eventos de UI (clicks, scrolls).
- Funnel de conversión (vista de producto → cart → checkout → orden).
- Crash reports de Sentry (llegan al backend pero no hay dashboard armado).
- Métricas de engagement por usuario.
- Búsquedas de los usuarios (query + resultados clickeados).
- A/B tests.

---

## 6. Lo que NO tiene aún (roadmap de 2-3 meses)

### 6.1 Críticas para escalar

1. **Analytics/tracking** (Plausible, PostHog o GA4 completo) — medir todo lo demás.
2. **Email transaccional** (Resend) — confirmaciones de orden, invitaciones, reset password.
3. **Pagos reales** (Stripe o MercadoPago) — el checkout es manual por WhatsApp.
4. **Tests automatizados** (unit + e2e con Playwright) — prácticamente no hay.
5. **CI/CD** (GitHub Actions con typecheck, lint, test) — no hay.
6. **Documentación técnica** (cómo deployar, agregar features) — mínima.
7. **Política de privacidad + Términos** legalmente sólidos.
8. **Backups automatizados** de la BD (Supabase PITR + restore probado).

### 6.2 Features de producto

9. Sistema de comentarios en submissions (no solo spots).
10. Follows UI completa (tabla existe, falta integración en perfil).
11. Repost/share de submissions en redes sociales.
12. Búsqueda global de skaters/challenges/spots.
13. Filtros avanzados en spots (skill, validación, recientes).
14. Push notifications (PWA con service worker).
15. Toggle de modo oscuro en UI.
16. i18n expandido (PT/FR para mercado EU).
17. API pública documentada (OpenAPI/Swagger).
18. Webhooks (a Tory, a sistemas externos).

### 6.3 Comunidad y engagement

19. Torneos/eventos con brackets.
20. Reglas automáticas de otorgamiento de achievements.
21. Direct messages entre skaters.
22. Stories/reels cortos verticales.
23. Streaming en vivo de trucos (Livepeer).

### 6.4 Admin/operaciones

24. Dashboard de revenue/métricas de negocio.
25. Sistema de moderación (reportes, ban temporal).
26. Audit log completo.
27. Status page público.

### 6.5 Crecimiento de plataforma

28. App nativa (React Native) consumiendo la API.
29. Múltiples ciudades/regiones (hoy solo Cali, Colombia).
30. Marketplace C2C de productos usados entre skaters.

---

## 7. Prioridades recomendadas

1. **Email transaccional** (Resend) — habilita escalar usuarios.
2. **Analytics** (Plausible, ~$9/mes) — medir antes de invertir más.
3. **Tests e2e críticos** (checkout + login + admin) — confianza para deployar rápido.
4. **Sistema de pagos** (Stripe) — convertir WhatsApp a revenue real.
5. **Push notifications** (PWA) — retention.
6. **CI/CD** con GitHub Actions — deploys seguros.

El resto son features de crecimiento que se pueden sumar con tracción validada.

---

## 8. Riesgos y deuda técnica conocidos

- **Migración de BD desincronizada**: la shadow database de Prisma no puede replicar el estado real. Las migraciones `20260605_add_orders` y `20260605_add_user_address` se aplicaron por SQL directo (no por `prisma migrate dev`).
- **Cero tests automatizados**: cada cambio en el carrito, orders o admin puede romper algo sin aviso.
- **Checkout manual por WhatsApp**: depende de vos contestar mensajes. No escala.
- **Sentry configurado pero sin alertas activas**: errores en producción pueden pasar desapercibidos.
- **Sin rate limiting en APIs públicas** (excepto submitTrick y orders).
- **Sin CSRF protection explícito** (NextAuth lo trae por default pero hay que verificar el resto).
- **Tamaños de bundle**: algunas páginas (home con todos los componentes) llegan a 1.3 MB. Hace falta code splitting más agresivo.
- **Auth via JWT en cookies**: el middleware valida pero no verifica roles (un skater puede navegar rutas admin si conoce la URL — la API sí valida con `session.user.role !== 'admin'`).

---

## 9. Convenciones del proyecto

- **Estilo**: TypeScript estricto. ESLint con config default de Next.
- **Componentes**: 2 niveles — `src/components/{atoms,molecules,organisms}/` (átomos reusables) + `src/components/*.tsx` (componentes de feature).
- **Server components** por default. Solo `'use client'` cuando hay estado, eventos o browser APIs.
- **i18n**: todas las strings de UI van a `messages/{es,en}.json`. Namespace por feature.
- **API routes**: en `src/app/api/{recurso}/route.ts`. Usan Zod validation en `src/lib/validation.ts` + helpers `errorResponse`/`successResponse`.
- **DB access**: solo en API routes y server components. Client nunca toca Prisma directo.
- **Mutations críticas**: notificaciones + update de status van en transacciones donde es posible.

---

## 10. Comandos útiles

```bash
# Desarrollo
npm run dev                          # Dev server (HMR)
npm run build                        # Build de producción
npm run start                        # Sirve el build de prod en :3000

# Prisma
npx prisma generate                  # Regenera el client (después de cambiar schema)
npx prisma migrate dev               # Crea/aplica migración local
npx prisma migrate deploy            # Aplica migraciones en prod (no en local)
npx prisma studio                    # GUI para ver la BD

# Verificación
npx prisma migrate status            # Ver estado de migraciones
git log --oneline -10                # Historial reciente
```

---

## 11. Personas clave (contactos)

- **Jonathan Vargas** (`jonathanfelipe0111@hotmail.com`): admin principal, dev senior.
- **Cristian** (`cristiansk8@trickest.dev`): admin secundario (vos), dev.
- **Tory Skateshop**: partner comercial (productos vía WooCommerce GraphQL).
- **DeepFC, Nandark**: partners secundarios (logos en home).

---

## 12. Glosario de términos internos

- **Trickest**: el nombre de la app. Mezcla de "trick" (truco de skate) + "-est" (sufijo de "the best").
- **Submission**: video que un skater sube de un truco realizado, esperando evaluación.
- **Challenge**: nivel de dificultad (1-10 + bonus), con puntos asociados.
- **Trick**: sinónimo de challenge en el contexto de la app.
- **Skater**: usuario registrado (rol por default).
- **Judge**: usuario con permisos para evaluar submissions.
- **Spot**: lugar geográfico donde se puede skatar (mapa).
- **Variation**: talle/color de un producto Tory Skateshop (WooCommerce).
- **Snitch**: la bolita flotante del home (referencia a Harry Potter).

---

_Generado automáticamente. Para actualizarlo, ejecutar la auditoría de nuevo._
