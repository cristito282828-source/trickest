# Auditoría de Arquitectura, Escalado y Rebrand — TheTrickest

> **Fecha:** 2026-06-04
> **Alcance:** Análisis estático del código (la app no levanta hoy por falta de variables de entorno)
> **Método:** 2 agentes especializados (arquitectura/escalado + facilidad de rebrand) sobre el código clonado.

---

## TL;DR

El proyecto está **técnicamente sano pero desprolijo**: stack moderno (Next.js 14, TS strict, Prisma 6), seguridad sólida, DB bien indexada. **No hay que reescribir, hay que refactorizar y consolidar.** La deuda crítica está en relaciones Prisma inconsistentes, organización de componentes y logging.

El **rebrand es moderado (6/10)**: colores, tipografía y logo están centralizados (fácil), pero el nombre de marca y el dominio están hardcodeados en ~16 archivos, y el cuello de botella real es el **bucket de Supabase** (`trickest-spots`), que es una migración operacional, no de código.

---

## PARTE 1 — Arquitectura y Escalado

### Veredicto: 7.5/10 — Recuperable con trabajo moderado

### Stack real

| Componente | Versión | Estado |
|---|---|---|
| Next.js | 14.2.21 (App Router) | ✅ |
| React | 18.3.1 | ✅ |
| TypeScript | 5.9.3 (strict, ES2022) | ✅ |
| Prisma | 6.19.0 | ✅ |
| NextAuth.js | 4.24.7 (Google OAuth + Credentials, JWT 30d) | ✅ |
| next-intl | 4.8.3 (en, es) | ✅ |
| Tailwind + NextUI | 3.4.19 / 2.2.10 | ✅ |
| Supabase | @supabase/ssr 0.10.3 (storage + realtime) | ✅ |
| Zod | 4.3.5 (validación) | ✅ |

### Confianza para lanzamiento

| Escenario | Viabilidad | Notas |
|---|---|---|
| Lanzar MVP hoy | ❌ NO | Relaciones Prisma pueden quebrar post-launch |
| Lanzar en 2 semanas | 🟡 CONDICIONAL | Fix críticos 1-2, aceptar deuda media |
| Lanzar en 1 mes | ✅ SÍ | Tiempo para top 5 issues |
| Lanzar escalado (500+ users) | ❌ NO | Falta paginación + schema Prisma |

### Deuda técnica — Top 10

| # | Severidad | Problema | Archivo(s) | Esfuerzo |
|---|---|---|---|---|
| 1 | 🔴 | Relaciones Prisma inconsistentes (email/username como FK en vez de `id` Int) | `prisma/schema.prisma:58,68,130` | ALTO (2-3d) |
| 2 | 🔴 | Spaghetti de componentes (49 flat, 9.110 líneas; Atomic Design a medias) | `src/components/` | MEDIO (4-5d) |
| 3 | 🔴 | 405 `console.log` sin condicional en prod (exponen emails) | 68 archivos `/api/*` | BAJO (1d) |
| 4 | 🟠 | Falta paginación en endpoints O(n) | `/api/challenges`, `/api/map/skaters`, `/api/spots/[id]/comments` | MEDIO (2-3d) |
| 5 | 🟠 | 40+ usos de `any` | varios `src/` | BAJO-MEDIO (1-2d) |
| 6 | 🟠 | Admin dashboard duplicado | `/(routes)/admin` vs `/(routes)/dashboard/admin` | BAJO (1d) |
| 7 | 🟠 | Testing casi 0% (15 tests; sin cobertura de auth/scoring/submissions) | `src/lib/*`, `/api/submissions` | ALTO (3-5d) |
| 8 | 🟡 | Rate limiting en memoria (se reinicia por invocación serverless) | `src/lib/rate-limit.ts` | MEDIO (1-2d) |
| 9 | 🟡 | Route sobredimensionada (376 líneas, sin paginación) | `/api/spots/[spotId]/comments/route.ts` | MEDIO (2-3d) |
| 10 | 🟡 | Deps subutilizadas (`pino` instalado pero se usa `console.log`); TSParticles/Leaflet sin lazy load (bundle 335KB vs target 250KB) | `src/lib/logger.ts`, homepage | BAJO (1d) |

### Roadmap sugerido

- **Sprint 1 (3-5d):** remapear relaciones Prisma (email→id), remover `console.log`/usar Pino, paginación en `/api/challenges` y `/api/map/skaters`.
- **Sprint 2 (1-2 sem):** refactor Atomic Design, resolver admin duplicado, rate limiting distribuido (Upstash).
- **Sprint 3 (post-MVP):** tests, refactor de spot comments, bundle analysis + lazy loading.

---

## PARTE 2 — Facilidad de Rebrand

### Rebrand Pain Score: 6/10 — Moderado

**Estimación:** ~6-7.5h con migración de Supabase incluida; ~3-4h sin ella (con bucket fallback temporal).

### Qué está fácil ✅

| Elemento | Estado | Esfuerzo |
|---|---|---|
| **Colores** | Centralizados en CSS variables (`globals.css:5-60`) + `tailwind.config.ts` | Editar 2 archivos |
| **Tipografía** | `next/font` en `src/app/layout.tsx:5` (un solo lugar) | Trivial (1 línea) |
| **Logo** | Archivos en `public/logo-*.png`, referenciados puntualmente | 5 min |

### Qué está difícil ❌

| Elemento | Problema | Ubicación |
|---|---|---|
| **Bucket Supabase** 🔴 | `trickest-spots` hardcodeado; renombrar = migración operacional (crear bucket + copiar archivos) | `src/app/api/upload/{photo,profile-image,team-logo}/route.ts` |
| **Nombre de marca** | 53 instancias de "Trickest" en código (no solo i18n) | metadatos, profile layout, schema |
| **URLs/emails hardcodeados** | `trickest.com`, `privacy@trickest.com`, `legal@trickest.com` | páginas legales, `schema-ld.ts` |
| **Colores hardcodeados sueltos** | ~340 gradientes + objetos JS con hex (`#F35588`) en mapas | `SpotsMap.tsx`, `UnifiedMap.tsx`, `globals.css:121-178` |
| **i18n incompleta** | "Trickest" como string literal en `messages/{en,es}.json` (no como clave reutilizable) | ~27 ocurrencias c/u |

### Plan de rebrand recomendado

**Idea central: crear `src/config/branding.ts` como fuente única de verdad** antes de tocar nada, y reemplazar los hardcodes por referencias a esa constante.

```typescript
// src/config/branding.ts
export const BRAND = {
  name: "NewBrandName",
  domain: "newbrand.com",
  email: { privacy: "privacy@newbrand.com", legal: "legal@newbrand.com" },
  social: { instagram: "", tiktok: "", youtube: "" },
  supabase: { bucket: "newbrand-spots" },
  urls: { base: "https://www.newbrand.app" },
};
```

---

# ✅ CHECKLIST — Arquitectura / Escalado

## 🔴 Bloqueantes pre-lanzamiento

- [ ] Remapear relaciones Prisma inconsistentes (email/username → `id` Int como FK) — `schema.prisma:58,68,130`
- [ ] Remover los 405 `console.log` de prod / migrar a Pino con flag `NODE_ENV` (exponen emails)

## 🟠 Alto (antes de escalar)

- [ ] Agregar paginación (take/skip o cursor) a `/api/challenges`, `/api/map/skaters`, `/api/spots/[id]/comments`
- [ ] Resolver admin dashboard duplicado (decidir cuál queda, borrar el otro, actualizar links)
- [ ] Eliminar usos de `any` en código propio (no terceros)

## 🟡 Medio (post-MVP)

- [ ] Refactor de componentes a Atomic Design (mover los 49 flat a atoms/molecules/organisms)
- [ ] Rate limiting distribuido (Upstash Redis) en vez de en memoria
- [ ] Partir la route de 376 líneas de spot comments
- [ ] Lazy-load de TSParticles / Leaflet (bajar bundle 335KB → <250KB)
- [ ] Cobertura de tests en auth-helpers, validation, submissions

---

# ✅ CHECKLIST — Rebrand (orden de ejecución)

> **Progreso (2026-06-05):** centralización aplicada en `fix/launch-seo` (PR #1). La identidad (nombre, emails, redes, bucket) y el dominio ahora viven en `src/config/branding.ts` + `src/config/site.ts`. **Un rebrand real ahora = editar esos 2 archivos + colores en `globals.css` + logo + migrar el bucket en Supabase.** Las Fases 3-4 (i18n, manifest, logo, bucket) solo aplican cuando se ejecute un rebrand de verdad. Leyenda: `[x]` hecho · `[~]` parcial · `[ ]` pendiente.

## Fase 1 — Setup

- [x] Crear `src/config/branding.ts` con la constante `BRAND` (+ `BRAND_SAME_AS`) · _PR #1_
- [~] `src/app/globals.css` (`:root`) marcado como fuente única del tema + hex sueltos eliminados; **listo para editar colores** (no se cambió la paleta) · _PR #1_
- [x] Verificado mapeo en `tailwind.config.ts` (apunta a `:root`)

## Fase 2 — Referencias en código (centralizadas, valores sin cambiar)

- [~] `src/app/[locale]/layout.tsx` — `siteName`/`og:url` derivan de `SITE_NAME`/`SITE_URL`; title/desc vienen de i18n · _PR #1_
- [x] `profile/[username]/layout.tsx` — `siteName`/`creator` desde `BRAND`; fallback `trickest.com` corregido a `SITE_URL` · _PR #1_
- [x] `privacy/page.tsx`, `terms/page.tsx`, `cookies/page.tsx` — emails desde `BRAND.email` · _PR #1_
- [x] 3× `src/app/api/upload/{photo,profile-image,team-logo}/route.ts` — bucket desde `BRAND.storage.bucket` · _PR #1_
- [x] `src/lib/schema-ld.ts` — `sameAs` desde `BRAND_SAME_AS`, `contactPoint` desde `BRAND.email`, dominio desde `SITE_URL` · _PR #1_
- [ ] `src/components/ContactForm.tsx` (footer "Enviado desde trickest.com") — pendiente
- [ ] `src/components/Appbar.tsx` (alt del logo) — pendiente
- [ ] Copy con "Trickest" embebido en titles/descriptions (no estructural) — opcional

## Fase 3 — i18n (solo al hacer rebrand real)

- [ ] `messages/en.json` (buscar "Trickest" → clave `common.brandName` o reemplazo)
- [ ] `messages/es.json` (ídem)
- [ ] `public/manifest.json` (`name`, `short_name`)

## Fase 4 — Assets + Supabase (solo al hacer rebrand real, CRÍTICO)

- [ ] Reemplazar `public/logo-main.png` y `public/logo-icon.png`
- [ ] Crear nuevo bucket en Supabase + migrar archivos del viejo `trickest-spots`
- [ ] Actualizar referencias en DB si hay URLs almacenadas
- [ ] Test: uploads funcionan con nuevo bucket
- [ ] Test: metadata SEO con nuevo nombre
- [ ] Deploy

> **Prioridad si hay que recortar:** bucket → metadatos → i18n → colores.

---

_Auditoría generada con agentes de revisión de Nandark — Felipe Vargas._
