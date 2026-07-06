# 🛹 TheTrickest

Plataforma social + marketplace para la comunidad de skateboarding. Red social de skaters con challenges rankeados, spots geolocalizados, equipos, sistema de pedidos a tienda WooCommerce y panel admin completo.

**Stack:** Next.js 14.2.21 (App Router) · TypeScript · Prisma 6 + PostgreSQL (Supabase) · NextAuth 4 · next-intl 4 · Tailwind 3.4 · NextUI 2.2 · Vercel

**Repo:** `cristito282828-source/trickest` · **Producción:** `thetrickest.app` · **Última actualización:** 2026-06-30

---

## 🎯 Visión general

TheTrickest es un híbrido entre red social de skate + marketplace. Los skaters se registran, suben videos de trucos, los jueces los evalúan, y los mejores rankean en un leaderboard. Además, hay un marketplace integrado con **Tory Skateshop** (WooCommerce) donde los skaters pueden comprar productos de skate directamente desde la plataforma.

**Audiencia objetivo:** comunidad de skate local de Cali, Colombia (escala inicial).

---

## ✅ Funcionalidades implementadas

### Públicas (sin login)

| Ruta | Función |
|---|---|
| `/` | Home con: video promocional modal (autoplay al cargar), challenges teaser "1000 skaters = primer truco", home level section, ranking top 10, top reels (carrusel con likes + comments), mapa de spots, partners, how to win, activity ticker. |
| `/suppls` | Catálogo de productos Tory Skateshop (WooCommerce GraphQL). Las skates rebotan con física custom (`orbital-engine.ts`) en un canvas HTML. Cart orbital flotante que lleva a checkout por WhatsApp. Variants reales (talle) con filtro por marca. |
| `/profile/[username]` | Perfil público del skater con dream setup, redes sociales, ubicación. |
| `/spots` | Mapa interactivo (Leaflet) con spots registrados. |
| `/teams` y `/teams/[name]` | Teams con capitán, miembros, logo. |
| `/search` y `/search/[collection]` | Búsqueda de productos + listado por categoría. |
| `/product/[slug]` | Detalle de producto con variations, stock, add-to-cart. |
| `/politica-*` y `/terminos-*` | Páginas legales. |
| `/interested` | Captura de leads. |

### Multi-idioma

- **EN/ES** con prefijo de locale (`/en/...`, `/es/...`). Configurado en `src/i18n/routing.ts`.
- Mensajes en `messages/es.json` y `messages/en.json`.
- `next-intl` 4.8 con `getTranslations` server-side y `useTranslations` client-side.

### Autenticación

- **NextAuth** con 2 providers:
  - **Google OAuth** (`next-auth/providers/google`).
  - **Credentials** (email + password con bcrypt).
- JWT sessions, expira a 30 días.
- Modal `SetPasswordModal` para usuarios de Google sin password.
- Middleware en `src/middleware.ts` protege `/dashboard/*` y `/admin/*`.

### Dashboard del skater (`/dashboard/skaters/*`)

| Ruta | Función |
|---|---|
| `/profile` | Perfil editable: foto (upload Supabase), datos personales, redes sociales, dream setup, ubicación. |
| `/tricks` | Lista de 10 niveles + 1 bonus, con demo video, dificultad y puntos. |
| `/submissions` | Historial de submissions con score, feedback, status. |
| `/orders` | Mis pedidos con thumbnail de la guía de envío. |
| `/leaderboard` | Ranking individual y por equipos. |
| `/teams` | Crear/unirse a teams, invitaciones. |
| `/logros` | Achievements con badges. |
| `/vote` | Votar submissions de la comunidad. |

### Dashboard de jueces (`/dashboard/judges/*`)

- `/judges/evaluate`: cola de submissions pendientes con score 0-100 + feedback.

### Dashboard admin (`/dashboard/admin/*`)

| Ruta | Función |
|---|---|
| `/admin` | Dashboard con stats globales. |
| `/admin/users` | Listado de usuarios con cambio de rol inline (skater/judge/admin). |
| `/admin/challenges` | CRUD completo de challenges (modal con form). |
| `/admin/submissions` | Re-evaluar submissions. |
| `/admin/orders` | Lista de órdenes + detalle + **botón "Marcar como enviado"** que sube foto de guía a Supabase Storage y notifica al skater. |
| `/admin/settings` | Settings globales (`total_levels` y similares). |

### Sistema de órdenes (`/suppls` → checkout)

- Cart orbital flotante con animación física de productos (motor custom en `src/components/orbital/orbital-engine.ts`).
- **Variations** reales del producto: al anclar un producto Tory, selector con talles parseados (`US 7.0 / EUR 38 / 25 cm`). Filtra solo `IN_STOCK`.
- Backend: `POST /api/orders` con Zod validation (`orderItemSchema` con `variation` opcional JSONB).
- Checkout manual por WhatsApp (`https://wa.me/...`).
- **NO hay pasarela de pago real** (Stripe, MercadoPago) — es un MVP.

### Sistema de notificaciones

- Tabla `Notification` (PostgreSQL) con tipo, link, metadata, read state.
- Suscripción Realtime vía `SupabaseRealtimeProvider` (`src/providers/SupabaseRealtimeProvider.tsx`).
- Triggers: nuevo follower, team invitation, submission evaluada, voto recibido, order creada (admin), order status changed (skater), comment_reply, new_spot_comment.
- UI: campana con badge de count en `Appbar`, dropdown con últimas 10, mark-all-as-read, mark-individual.

### Top Reels (nuevo)

- Sección en home con carrusel horizontal de las mejores submissions rankeadas.
- **Likes** (reusando tabla `Vote` con `voteType='upvote'`).
- **Comments** con replies anidados (tablas `ReelComment` + `ReelCommentVote`).
- **Filtrado por marca** clickeable en panel lateral derecho.
- Placeholder inteligente si no hay productos / filtro no tiene matches (siempre muestra panel de marcas).
- Modal estilo Instagram Reels con overlay lateral de acciones (avatar + like + comments).

### Modal de video promocional (nuevo)

- Modal automático al cargar la home con video de presentación (`public/2026-06-27 00_16_48.MP4`).
- Botón "Registrarse ahora" (rosa `bg-brand-pink`) que abre el `RegisterEmailForm`.
- No aparece para usuarios logueados (`useSession().status === 'authenticated'`).
- ESC, click en backdrop, click en X → cierra.
- Body scroll lock cuando está abierto.

### Integraciones externas

- **Supabase**: PostgreSQL (DB) + Storage (fotos perfil, spots, shipping guides, logos teams) + Realtime (notificaciones).
- **WooCommerce GraphQL** (`toryskateshop.com/graphqltory`): productos destacados + variations + attributes.
- **Google OAuth**: login.
- **Vercel**: hosting + deploys automáticos.
- **Sentry**: error tracking (config en `.config/sentry*`).
- **Microsoft Clarity** + **Google Tag Manager** + **Google Analytics** (configurados en layout).

### APIs (60+ endpoints en `src/app/api/`)

Auth (`auth/[...nextauth]`, `auth/register`, `auth/set-password`), users (`users/[email]/profile`, `users/me`, `users/profile/[username]`, `users/score`, `users/search`, `users/check-username`, `users/count`), follow, spots (CRUD completo + comments + replies + votes + photos + validate + register + nearby), challenges, submissions (CRUD + evaluate + auto-approve + vote), teams, leaderboards, skate_profiles, notifications, orders, upload (photo/profile-image/team-logo), external-products, external-image (proxy de imágenes con CORS), settings, admin, reels (`/api/reels` + `/api/reels/[id]/like` + `/api/reels/[id]/comments/*`), top-reels, marketing, etc.

---

## 📊 Modelo de datos (Prisma)

### Conteos actuales (junio 2026)

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
| `ReelComment` | 0 |

### Modelos principales

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

ReelComment (Top Reels feature)
├── submission (N:1)
├── user (N:1)
├── parentComment (self-ref, replies)
└── votes (ReelCommentVote 1:N)

Notification (userId, type, title, message, link, metadata JSONB, isRead)
```

**Schema completo:** `prisma/schema.prisma` · **Migraciones:** `prisma/migrations/`

---

## 🏗️ Hosting y deploy

- **Vercel**: hosting de producción. Deploy automático en cada push a `master` (repo `cristito282828-source/trickest`).
- **Supabase** (`znyukjpgbiqjiarnvvck`): PostgreSQL + Storage + Realtime. Plan free tier.
- **WooCommerce** de Tory Skateshop: externo, vía GraphQL público (`toryskateshop.com/graphqltory`).
- **Dominio propio**: `thetrickest.app`.
- **Costos operativos** (free tier actual): $0/mes, escalando a ~$25/mes cuando se pase de límites de Supabase + Vercel Pro si crece.

**Variables de entorno críticas** (en `.env`):
- `DATABASE_URL` (Supabase pooler)
- `DIRECT_URL` (Supabase session mode, para migraciones)
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `SHOPIFY_STORE_DOMAIN` / `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (legado, no se usa activamente)

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (routes)/              # Rutas con prefijo de locale
│   │   │   ├── dashboard/         # Dashboards de skater/judge/admin
│   │   │   ├── suppls/           # Catálogo de productos
│   │   │   ├── product/[slug]/   # Detalle de producto
│   │   │   ├── teams/            # Teams
│   │   │   ├── spots/            # Spots
│   │   │   └── ...
│   │   ├── layout.tsx            # Layout root (con providers, i18n, analytics)
│   │   └── page.tsx              # Home
│   └── api/                       # 60+ endpoints
│       ├── auth/                  # NextAuth + register
│       ├── users/                 # CRUD usuarios
│       ├── challenges/
│       ├── submissions/
│       ├── spots/                 # CRUD + comments + votes
│       ├── teams/
│       ├── orders/                # Órdenes a tienda
│       ├── notifications/
│       ├── upload/                # Foto/profile/team-logo
│       ├── reels/                 # Top Reels (likes + comments)
│       ├── graphql/               # Proxy CORS a WPGraphQL
│       └── ...
├── components/
│   ├── atoms/                     # Componentes UI primitivos (Button, Input, etc.)
│   ├── molecules/                 # CommentItem, CommentForm, CommentThread
│   ├── organisms/                 # SpotComments, NotificationBell, SpotModal
│   ├── custom/                    # Componentes específicos (FeaturedProducts, Hero, etc.)
│   ├── layout/                    # Navbar, Footer
│   └── PromoVideoModal.tsx        # Modal de video promocional
├── lib/
│   ├── woocommerce/                # Cliente GraphQL + types + queries
│   ├── auth.ts                    # Configuración NextAuth
│   ├── prisma.ts                  # Singleton de Prisma client
│   ├── youtube.ts                 # Helpers para YouTube (thumbnails, embed)
│   ├── validation/                # Schemas Zod
│   └── ...
├── providers/
│   ├── CartProvider.tsx
│   ├── SupabaseRealtimeProvider.tsx
│   └── ...
├── i18n/
│   ├── routing.ts                 # next-intl routing
│   └── request.ts                 # Server-side messages
├── middleware.ts                  # Auth + locale
└── messages/
    ├── es.json
    └── en.json
```

---

## 🛠️ Comandos útiles

```bash
# Desarrollo
npm run dev                          # Dev server (HMR)
npm run build                        # Build de producción
npm run start                        # Sirve el build en :3000

# Prisma
npx prisma generate                  # Regenera el client
npx prisma migrate dev               # Crea/aplica migración local
npx prisma migrate deploy            # Aplica migraciones en prod
npx prisma studio                    # GUI para ver la BD

# Testing
npm run test                         # Jest (no está configurado aún)
```

---

## 🚧 Lo que NO tiene aún (roadmap 2-3 meses)

### Críticas para escalar

1. **Email transaccional** (Resend) — confirmaciones de orden, invitaciones, reset password.
2. **Analytics/tracking** (Plausible, ~$9/mes) — medir todo lo demás.
3. **Tests automatizados** (unit + e2e con Playwright) — prácticamente no hay.
4. **CI/CD** (GitHub Actions con typecheck, lint, test) — no hay.
5. **Sistema de pagos** (Stripe o MercadoPago) — el checkout es manual por WhatsApp.
6. **Push notifications** (PWA con service worker) — retention.
7. **Backups automatizados** de la BD (Supabase PITR + restore probado).

### Features de producto

8. Sistema de comentarios en submissions (no solo spots).
9. Follows UI completa.
10. Repost/share de submissions en redes.
11. Búsqueda global.
12. Filtros avanzados en spots.
13. Toggle de modo oscuro.
14. i18n expandido (PT/FR).
15. API pública documentada (OpenAPI).
16. Webhooks.

### Comunidad y admin

17. Torneos/eventos con brackets.
18. Reglas automáticas de otorgamiento de achievements.
19. Direct messages.
20. Stories/reels cortos.
21. Streaming en vivo de trucos.
22. Dashboard de revenue.
23. Sistema de moderación.
24. Status page público.

### Crecimiento

25. App nativa (React Native).
26. Múltiples ciudades/regiones (hoy solo Cali).
27. Marketplace C2C de productos usados.

---

## ⚠️ Deuda técnica conocida

- **Migración de BD desincronizada**: shadow database de Prisma no puede replicar el estado real. Las migraciones `20260605_add_orders` y `20260605_add_user_address` se aplicaron por SQL directo (no por `prisma migrate dev`).
- **Cero tests automatizados**: cada cambio en el carrito, orders o admin puede romper algo sin aviso.
- **Checkout manual por WhatsApp**: depende de vos contestar mensajes. No escala.
- **Sentry configurado pero sin alertas activas**: errores en producción pueden pasar desapercibidos.
- **Sin rate limiting en APIs públicas** (excepto submitTrick y orders).
- **Sin CSRF protection explícito** (NextAuth lo trae por default pero hay que verificar el resto).
- **Bundle de home 1.3 MB**: la home carga muchos componentes. Hace falta code splitting más agresivo.
- **Auth via JWT en cookies**: el middleware valida pero no verifica roles. Un skater puede navegar rutas admin si conoce la URL.

---

## 🔗 Integraciones externas activas

| Servicio | Uso | Plan |
|---|---|---|
| **Supabase** (PostgreSQL + Storage + Realtime) | DB, fotos, notificaciones en vivo | Free tier |
| **WooCommerce** (Tory Skateshop) | Catálogo de productos + variations | - |
| **Google OAuth** | Login | Free |
| **Vercel** | Hosting + deploys automáticos | Hobby (free) |
| **Sentry** | Error tracking | Free |
| **Microsoft Clarity** | Analytics de UX | Free |
| **Google Tag Manager** + **Google Analytics** | Tracking | Free |

---

## 🤝 Personas clave

- **Jonathan Vargas** (`jonathanfelipe0111@hotmail.com`) — admin principal, dev senior.
- **Cristian** (`cristiansk8@trickest.dev`) — admin secundario (vos), dev.
- **Tory Skateshop** — partner comercial (productos vía WooCommerce GraphQL).
- **DeepFC**, **Nandark** — partners secundarios (logos en home).

---

## 📝 Convenciones

- **Estilo**: TypeScript estricto. ESLint con config default de Next.
- **Componentes**: 2 niveles — `src/components/atoms,molecules,organisms/` (reusables) + `src/components/*.tsx` (feature).
- **Server components** por default. Solo `'use client'` cuando hay estado, eventos o browser APIs.
- **i18n**: todas las strings de UI van a `messages/{es,en}.json`. Namespace por feature.
- **API routes**: en `src/app/api/{recurso}/route.ts`. Usan Zod validation en `src/lib/validation.ts` + helpers `errorResponse`/`successResponse`.
- **DB access**: solo en API routes y server components. Client nunca toca Prisma directo.
- **Mutations críticas**: notificaciones + update de status van en transacciones donde es posible.

---

## 🚀 Deploy

```bash
git add .
git commit -m "..."
git push origin master
```

Vercel detecta el push y deploya automáticamente. Verificá en el dashboard que el último deploy esté en "Ready" antes de cerrar la sesión.

---

## 📂 Documentos relacionados

- [ESTADO_PROYECTO.md](ESTADO_PROYECTO.md) — Estado detallado del proyecto con conteos de BD y deuda técnica.
- [MIGRATION_CHECKLIST.md](.claude/projects/c--Users-User-mania-store/memory/MIGRATION_CHECKLIST.md) — Checklist de migración (si la necesitás).
- `~/.claude/plans/lexical-snuggling-mango.md` — Plan file de features grandes.

---

_Generado automáticamente. Última revisión: 2026-06-30. Para actualizarlo, ejecutar auditoría de código y regenerar._
