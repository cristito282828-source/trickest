# GEO + SEO Audit — TheTrickest

> **Fecha:** 2026-06-04
> **URL auditada:** https://www.thetrickest.app/en (sitio en vivo)
> **Alcance:** Área pública, foco en lanzamiento inminente y visibilidad en AI search
> **Método:** Auditoría con 5 subagentes especializados (AI visibility, plataformas, técnico, contenido, schema) contra el sitio en producción.

---

## TL;DR

El sitio nació de un **fork de un template de agencia web ("Watermelon Code" / Loopple)** que se migró a medias. Esa migración incompleta es la causa raíz del ~80% de los problemas GEO/SEO. Dos cicatrices aparecen en todos los ejes:

1. **Dominio fantasma `trickest.vercel.app`** referenciado en robots, sitemap y todo el schema, en vez del real `www.thetrickest.app`.
2. **Páginas zombie del template** (`/about`, `/services`, `/portfolio`, `/testimonials`) que todavía muestran contenido de la agencia web.

Bonus crítico de marca: **"Trickest" (sin "The") ya es una empresa de ciberseguridad consolidada** (Serbia, con Wikipedia/Crunchbase/LinkedIn). La marca citable debe ser siempre **"TheTrickest" + qualifier "skateboarding platform LATAM"**.

**La buena noticia:** el techo es alto. El SSR es real (las IAs leen el contenido sin ejecutar JS), la seguridad es fuerte. Los scores bajos son por **configuración rota**, no por arquitectura. Arreglando las dos cicatrices, varios scores suben solos.

---

## Scores por eje

| Eje | Score | Estado |
|---|---|---|
| AI Visibility (citability + crawlers + brand mentions + llms.txt) | 26/100 | 🔴 Pobre |
| Optimización por plataforma (ChatGPT, Perplexity, Gemini, AIO, Copilot) | 27/100 | 🔴 Pobre |
| SEO Técnico | 58/100 | 🟡 Fair (1 bloqueante) |
| Contenido / E-E-A-T | 31/100 | 🔴 Crítico |
| Structured Data (Schema.org) | 38/100 | 🔴 Pobre |

---

## 1. AI Visibility — 26/100

| Componente | Score | Notas |
|---|---|---|
| Citability | 38/100 | `/contacto` es la mejor (~62, claims citables tipo "First skate competition platform in LATAM"). `/services` y `/portfolio` envenenan la entidad (contenido de agencia web). |
| Brand Mentions | 4/100 | Cero huella externa (Reddit, YouTube, Wikipedia). Esperable pre-lanzamiento, pero es el factor que más hunde el score. |
| Crawler Access | 75/100 | `Allow: /` para todos los bots AI (GPTBot, ClaudeBot, PerplexityBot, Google-Extended). El sitemap mal apuntado baja el score. |
| llms.txt | 0/100 | Ausente (404). Generado y listo para deployar (ver Anexo). |

**Colisión de marca:** los LLMs resuelven ambigüedad de entidad por autoridad existente. Hoy "Trickest" = ciberseguridad. Hay que desambiguar en todo el sitio con "TheTrickest" + "skateboarding LATAM".

---

## 2. Optimización por plataforma — 27/100 promedio

| Plataforma | Score | Cuello de botella principal |
|---|---|---|
| Google AI Overviews | 32/100 | Headings de marketing, no de query. Falta FAQ/HowTo schema. Sitemap roto. |
| ChatGPT (web search) | 28/100 | Entity recognition (5/35): sin Wikipedia/Wikidata/`sameAs`. Crawler access excelente (22/25). |
| Bing Copilot | 29/100 | Sin IndexNow, sin Bing Webmaster, sitemap roto. |
| Google Gemini | 24/100 | Sin canal de YouTube (clave para una plataforma de video de tricks). Sin Knowledge Graph. |
| Perplexity | 22/100 | Cero validación comunitaria (Reddit/foros). Contenido client-side que PerplexityBot no ve. |

**Sinergias cross-platform (un fix, varias plataformas):**
1. Corregir sitemap → AIO + Copilot + ChatGPT + Gemini
2. Poblar `sameAs` → ChatGPT + Gemini + Copilot + Perplexity
3. SSR del contenido core → Perplexity + ChatGPT + AIO
4. Sección "About" + FAQ factual con fechas → AIO + ChatGPT + Perplexity

---

## 3. SEO Técnico — 58/100

**Fortaleza principal:** SSR real (Next.js App Router + RSC). El HTML crudo ya trae el contenido, los JSON-LD y la metadata sin ejecutar JS. **Esto es lo correcto para AI crawlers.**

**El nudo de identidad de dominio (bloqueante de lanzamiento):** hay **cuatro definiciones distintas de "cuál es mi URL canónica"**:

```
  trickest.vercel.app/en  ──┐   (200 OK, indexable, hreflang a sí mismo)
   [clon vivo]              │    → DUPLICADO 1:1 competidor
                            │
  thetrickest.app/en  ──────┤   (308 → www, pero ES lo que lista el sitemap)
   [non-www, redirige]      │
                            │
  www.thetrickest.app/en ───┘   (200 OK, la versión REAL servida)
   [dominio final]               pero robots apunta sitemap a vercel.app
```

| Categoría | Score | Flag |
|---|---|---|
| Server-Side Rendering | 95/100 | 🟢 |
| Security Headers (HSTS, X-Frame, nosniff; falta CSP) | 90/100 | 🟢 |
| Mobile | 85/100 | 🟢 |
| Meta tags & indexabilidad | 45/100 | 🔴 sin canonical, og:url non-www, hreflang solo en HTTP header |
| Crawlability (robots/sitemap) | 30/100 | 🔴 sitemap a dominio equivocado + URLs non-www que redirigen |

> El clon `trickest.vercel.app` **aún no está indexado** → hay ventana para actuar antes del lanzamiento. Se cierra rápido una vez publicado.

**Core Web Vitals (riesgo estimado):** LCP medio (imagen hero sin `fetchpriority="high"` ni `srcset`). INP/CLS bajos.

---

## 4. Contenido / E-E-A-T — 31/100

**Hallazgo crítico:** páginas públicas exponen contenido de **otro negocio** (agencia web):

| Página | Qué muestra hoy | Debería mostrar |
|---|---|---|
| `/about` | "drive innovation and digital transformation" (genérico de agencia) | Historia de TheTrickest, fundadores skaters |
| `/services` | "Watermelon Code - Frontend Web Development". Branding, SEO, Copywriting. | No existir, o "Cómo funciona / Para marcas y skateparks" |
| `/portfolio` | 8 proyectos web con links a GitHub | No existir en plataforma de skate |
| `/testimonials` | Perfil de muestra (Keiner Baracali) con avatar placeholder de Loopple | Testimonios reales |

**E-E-A-T: 27/100.** Único punto fuerte: la Privacy Policy es real y skate-specific (TLS 1.3, COPPA, GDPR) — prueba de que el equipo *puede* producir contenido propio.

**Gap de citabilidad:** ninguna IA tiene un pasaje claro que citar. Preguntas que el sitio NO responde: "cómo se puntúan mis tricks", "quién juzga", "es gratis", "cómo subo mi video". Esa es la página #1 que falta.

---

## 5. Structured Data — 38/100

**Base buena, mal apuntada.** Hay 1 `@graph` válido server-rendered con 5 tipos (WebSite, WebApplication, Organization, SportsActivityLocation, BreadcrumbList), pero:

- **Bug crítico:** cada `@id`, `url`, `logo`, `target`, `item` apunta a `trickest.vercel.app` → para Google el schema describe **otro sitio**.
- `Organization.sameAs` está **vacío `[]`** — la propiedad #1 para GEO. Sin esto no hay entity linking.
- `BreadcrumbList` es estático ("Home") e idéntico en las 5 páginas.
- `SearchAction` apunta a `/search` que no existe.
- `SportsActivityLocation` mal aplicado (es para lugares físicos, no para la plataforma online).

**Faltan (alto impacto):** Review + AggregateRating en `/testimonials`, FAQPage, `sameAs` poblado, BreadcrumbList dinámico. JSON-LD corregido generado en el Anexo.

---

## Anexos generados

- **`llms.txt`** listo para deployar en la raíz del dominio: ver `/tmp/trickest-geo/llms.txt` (incluye disclaimer de no-afiliación con Trickest Inc. ciberseguridad).
- **JSON-LD corregido** (Organization + WebSite + WebApplication + BreadcrumbList dinámico + Review + FAQPage) con dominio `www.thetrickest.app` y placeholders `[REPLACE: ...]` para redes y datos reales.

---

# ✅ CHECKLIST — GEO + SEO

> **Progreso (2026-06-05):** la tanda de bloqueantes técnicos está aplicada en el branch `fix/launch-seo` (PR #1). Falta **1 acción manual en Vercel**: setear `NEXT_PUBLIC_APP_URL=https://www.thetrickest.app`. Leyenda: `[x]` hecho · `[~]` parcial / requiere input · `[ ]` pendiente.

## 🔴 Bloqueantes (no lanzar sin esto)

- [x] Neutralizar el clon `trickest.vercel.app` (redirect 308 → `www.thetrickest.app`) — middleware, solo host exacto, previews intactos · _PR #1_
- [x] Corregir `robots.txt` → reemplazado por `app/robots.ts` dinámico (sitemap deriva de `SITE_URL`) · _PR #1_
- [~] Regenerar sitemap con URLs **www** — código listo (deriva de `SITE_URL`); **requiere setear `NEXT_PUBLIC_APP_URL=https://www.thetrickest.app` en Vercel** · _PR #1 + acción Vercel_
- [x] `noindex` las páginas zombie `/about`, `/services`, `/portfolio`, `/testimonials` + sacadas del sitemap · _PR #1_
- [x] Schema: reemplazados TODOS los `trickest.vercel.app` → `SITE_URL` en el `@graph` (+ removido SearchAction roto y SportsActivityLocation mal aplicado) · _PR #1_
- [x] Unificado dominio en `og:url` y JSON-LD vía `SITE_URL` · _PR #1_

## 🟠 Alto (semana de lanzamiento)

- [~] Poblar `Organization.sameAs` con Instagram / TikTok / YouTube reales — **placeholder listo en `schema-ld.ts`, falta pasar las URLs reales** · _PR #1_
- [~] `<link rel="canonical">` self-referencing — **hecho en el home + helper `localizedAlternates()` listo; falta aplicarlo a las subpáginas** · _PR #1_
- [ ] Deployar `llms.txt` en la raíz del dominio (generado en `/tmp/trickest-geo/llms.txt`)
- [ ] Crear página "Cómo funciona / cómo se puntúan los tricks" (explicar scoring + jueces)
- [ ] Agregar `FAQPage` schema con respuestas de 40-60 palabras ("¿Qué es?", "¿Es gratis?", "¿Cómo se puntúa?", "¿Premios?")
- [ ] SSR / pre-render del contenido de `/spots` y `/explore` (hoy las IAs ven "0 SPOTS / loading")
- [x] hreflang en el `<head>` HTML — home (vía `localizedAlternates`); subpáginas pendientes junto al canonical · _PR #1_
- [ ] Desambiguar marca: usar "TheTrickest" + "skateboarding LATAM" en titles/descriptions

## 🟡 Medio (primeras 4 semanas)

- [ ] Sembrar brand mentions: posts en r/skateboarding + comunidades de skate LATAM, crear canal de YouTube oficial
- [ ] Crear página de empresa en LinkedIn (distinta de la de ciberseguridad)
- [ ] Verificar Bing Webmaster Tools (`msvalidate.01`) + implementar IndexNow
- [ ] Agregar Review + AggregateRating en `/testimonials` (solo con testimonios reales y visibles)
- [ ] BreadcrumbList dinámico por página (hoy "Home" estático en las 5)
- [ ] Corregir/eliminar `SearchAction` roto; quitar `SportsActivityLocation` del sitio (reservar para spots físicos)
- [ ] Imagen hero: agregar `priority` / `fetchpriority="high"` + `srcset` (LCP)
- [ ] Acortar meta description a ~155 caracteres

## 🟢 Bajo (post-lanzamiento)

- [ ] Crear `/llms-full.txt` con contenido completo (lleva el componente a 90+)
- [ ] Capa editorial: blog/guías evergreen ("Cómo grabar tu mejor línea", "Spots icónicos de LATAM")
- [ ] Trabajar hacia entrada en Wikidata/Wikipedia (requiere notabilidad previa)
- [ ] Agregar Content-Security-Policy; `Referrer-Policy: strict-origin-when-cross-origin`

---

_Auditoría generada con el skill GEO de Nandark — Felipe Vargas._
