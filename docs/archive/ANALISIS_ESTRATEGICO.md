# ANÁLISIS ESTRATÉGICO - TRICKEST

> Documento generado: Diciembre 2024
> Última actualización: Diciembre 2024

---

## TABLA DE CONTENIDOS

1. [Estado Actual del Proyecto](#1-estado-actual-del-proyecto)
2. [Análisis Técnico Detallado](#2-análisis-técnico-detallado)
3. [Competencia Identificada](#3-competencia-identificada)
4. [Análisis de Oportunidades](#4-análisis-de-oportunidades)
5. [Features Recomendadas](#5-features-recomendadas)
6. [Enfoques Estratégicos](#6-enfoques-estratégicos)
7. [Definición del Enfoque (Respuestas)](#7-definición-del-enfoque)
8. [Roadmap Ajustado](#8-roadmap-ajustado)
9. [Consideraciones Técnicas](#9-consideraciones-técnicas)
10. [Archivos Críticos](#10-archivos-críticos)

---

## 1. ESTADO ACTUAL DEL PROYECTO

### 1.1 Resumen Ejecutivo

**Trickest** es una plataforma de challenges de skateboarding donde:
- Skaters suben videos de tricks para diferentes niveles de dificultad
- Jueces evalúan las submissions (0-100 + feedback)
- Sistema de puntuación y roles (skater/judge/admin)

### 1.2 Features Implementadas (✅ 100%)

| Feature | Descripción | Estado |
|---------|-------------|--------|
| **Auth Google + Email** | OAuth + credentials con bcrypt | ✅ Completo |
| **Perfil de usuario** | 3 tabs: info, dream setup, redes sociales | ✅ Completo |
| **11 Challenges + 1 Bonus** | Niveles progresivos con videos demo | ✅ Completo |
| **Submissions** | Validación YouTube, prevención duplicados | ✅ Completo |
| **Panel de Jueces** | Evaluación con score 0-100 + feedback | ✅ Completo |
| **Scoring individual** | Suma de scores aprobados | ✅ Completo |
| **Role-based access** | Skater, Judge, Admin server-side | ✅ Completo |
| **UI Arcade/Retro** | Gradients, borders, emojis, animations | ✅ Completo |

### 1.3 Features Parciales (🔄)

| Feature | Estado | Qué falta |
|---------|--------|-----------|
| **Admin Dashboard** | 🔄 20% | Rutas existen, sin implementación |
| **Judge History** | 🔄 30% | Referenciada en sidebar, no existe page |
| **Notificaciones** | 🔄 30% | Solo toast básico, no sistema completo |

### 1.4 Features Recién Implementadas (✅ FASE 1 COMPLETADA - Dic 2024)

| Feature | Estado | Descripción |
|---------|--------|-------------|
| **Sistema de Teams** | ✅ 100% | CRUD completo + join/leave + scoring agregado |
| **Leaderboard Global** | ✅ 100% | Ranking usuarios con paginación |
| **Leaderboard Teams** | ✅ 100% | Ranking equipos con score agregado |
| **Cleanup Rutas** | ✅ 100% | Eliminadas rutas /judge y /jueces duplicadas |
| **Perfiles Públicos** | ✅ 100% | Stats, setup, redes sociales, logros recientes |
| **Página de Logros** | ✅ 100% | 21 badges en 7 categorías con estilo arcade |
| **Sidebar Unificado** | ✅ 100% | Un solo sidebar para skater/judge/admin |

### 1.5 Features NO Implementadas (❌ 0%)

| Feature | Estado | Descripción |
|---------|--------|-------------|
| **Admin Panel** | ❌ | Gestión usuarios/challenges/submissions |
| **Achievements/Badges** | ❌ | Schema no existe, 0 lógica |
| **Features Sociales** | ❌ | Comentarios, follows, mensajes |
| **Votación Comunidad** | ❌ | Sistema de votos para submissions |
| **Video Upload Propio** | ❌ | Solo YouTube URLs |
| **Real-time Updates** | ❌ | Sin WebSocket o polling |
| **Analytics** | ❌ | Sin tracking de engagement |
| **Eventos/Sponsors** | ❌ | Sistema de eventos temporales |

### 1.6 Matriz de Implementación (ACTUALIZADA DIC 2024)

```
┌─────────────────────────────────────────────────────────────┐
│                    FEATURE STATUS MATRIX                    │
├─────────────────────────┬──────────┬──────────┬─────────────┤
│ Feature                 │ Status   │ API      │ UI          │
├─────────────────────────┼──────────┼──────────┼─────────────┤
│ Auth (Google/Email)     │ ✅ 100%  │ ✅       │ ✅          │
│ Profile Management      │ ✅ 100%  │ ✅       │ ✅          │
│ Challenges              │ ✅ 100%  │ ✅       │ ✅          │
│ Submissions             │ ✅ 100%  │ ✅       │ ✅          │
│ Judge Evaluation        │ ✅ 100%  │ ✅       │ ✅          │
│ Individual Scoring      │ ✅ 100%  │ ✅       │ ✅          │
│ Teams                   │ ✅ 100%  │ ✅       │ ✅          │
│ Team Leaderboard        │ ✅ 100%  │ ✅       │ ✅          │
│ Global Leaderboard      │ ✅ 100%  │ ✅       │ ✅          │
│ Routes Cleanup          │ ✅ 100%  │ N/A      │ ✅          │
│ Perfiles Públicos       │ ✅ 100%  │ ✅       │ ✅          │
│ Achievements Page       │ ✅ 100%  │ N/A      │ ✅          │
│ Admin Panel             │ ❌ 0%    │ ❌       │ ❌          │
│ Achievement System      │ ❌ 0%    │ ❌       │ ❌          │
│ Votación Comunidad      │ ❌ 0%    │ ❌       │ ❌          │
│ Notifications           │ 🔄 30%   │ ❌       │ 🔄          │
│ Real-time Updates       │ ❌ 0%    │ ❌       │ ❌          │
└─────────────────────────┴──────────┴──────────┴─────────────┘
```

---

## 2. ANÁLISIS TÉCNICO DETALLADO

### 2.1 Estructura de la Aplicación

#### Rutas Públicas
- `/` - Landing page con introducción, pasos a seguir, y partners
- `/about` y `/about/[name]` - Páginas de información general
- `/portfolio` - Placeholder (comentado en código)
- `/services` - Placeholder (comentado en código)
- `/testimonials` - Placeholder (comentado en código)

#### Rutas Autenticadas - Skaters
- `/dashboard/skaters/profile` ✅ - Gestión de perfil (3 tabs)
- `/dashboard/skaters/tricks` ✅ - Ver y enviar videos para challenges
- `/dashboard/skaters/submissions` ✅ - Historial de envíos con filtros
- `/dashboard/skaters/logros` ❌ - Solo placeholder sin funcionalidad

#### Rutas Autenticadas - Jueces
- `/dashboard/judges/evaluate` ✅ - Panel de evaluación funcional
- `/dashboard/judge/calificate` ❌ - Legacy, datos mock
- `/dashboard/judge/profile` ❌ - Solo sidebar decorator
- `/dashboard/jueces/*` ❌ - Rutas heredadas/duplicadas

#### Rutas Admin (no implementadas)
- `/dashboard/admin/users` - No existe
- `/dashboard/admin/challenges` - No existe

### 2.2 Modelos de Datos (Prisma Schema)

#### User Model
```prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique  // Identificador principal
  password      String?   // Nullable para Google OAuth
  name          String?
  phone         String?
  photo         String?
  profileStatus String    @default("basic") // "basic" | "complete"
  role          String    @default("skater") // "skater" | "judge" | "admin"
  isActive      Boolean   @default(true)
  teamId        Int?

  // Relaciones
  socials       SocialMedia?
  WishSkate     WishSkate?
  submissions   Submission[]
  evaluations   Submission[] @relation("Evaluator")
  ownedTeams    Team[]       @relation("TeamOwner")
  team          Team?        @relation(fields: [teamId])
}
```

#### Challenge Model
```prisma
model Challenge {
  id           Int      @id @default(autoincrement())
  level        Int      // 1-10 + 0 para bonus
  name         String
  description  String
  demoVideoUrl String   // YouTube URL
  difficulty   String   // "easy" | "medium" | "hard" | "expert"
  points       Int      // 100-1000
  isBonus      Boolean  @default(false)

  submissions  Submission[]

  @@unique([level, isBonus])
}
```

#### Submission Model
```prisma
model Submission {
  id          Int       @id @default(autoincrement())

  userId      String    // FK email
  challengeId Int       // FK
  videoUrl    String    // YouTube URL
  status      String    @default("pending") // "pending" | "approved" | "rejected"
  score       Int?      // 0-100
  feedback    String?

  submittedAt DateTime  @default(now())
  evaluatedAt DateTime?
  evaluatedBy String?   // FK email del juez

  // Índices para performance
  @@index([userId, challengeId])
  @@index([status])
  @@index([evaluatedBy])
}
```

#### SocialMedia Model
```prisma
model SocialMedia {
  id        Int     @id @default(autoincrement())
  userId    String  @unique  // email del usuario
  facebook  String?
  instagram String?
  twitter   String?
  tiktok    String?
}
```

#### WishSkate Model (Dream Setup)
```prisma
model WishSkate {
  id          Int     @id @default(autoincrement())
  userId      String  @unique  // email del usuario
  madero      String?
  trucks      String?
  ruedas      String?
  rodamientos String?
  tenis       String?
}
```

#### Team Model
```prisma
model Team {
  id          Int     @id @default(autoincrement())
  name        String  @unique
  description String?
  logo        String?
  ownerId     String  // FK email
  maxMembers  Int     @default(5)
  isActive    Boolean @default(true)

  owner       User    @relation("TeamOwner", fields: [ownerId])
  members     User[]
}
```

### 2.3 Sistema de Autenticación

#### Flujo Completo
```
1. Usuario llega a la app
   ↓
2. Elige: Google OAuth o Email/Password
   ↓
3a. Google OAuth:
    - signIn() → NextAuth callback
    - Auto-crea usuario con profileStatus="basic", password=null
    - Redirige a dashboard
   ↓
3b. Email/Password:
    - POST /api/auth/register (nuevo usuario)
    - POST /api/auth/[...nextauth] credentials (login)
   ↓
4. JWT callback:
    - Consulta BD para obtener profileStatus, hasPassword, role
    - Enriquece token
   ↓
5. Session callback:
    - Expone datos al cliente
   ↓
6. Post-Login Modals (si aplica):
    - SetPasswordModal (si Google y !hasPassword)
    - SkateProfileCompletionModal (si profileStatus="basic")
    - WelcomeModal (5 seg auto-close)
   ↓
7. Dashboard accesible
```

#### Endpoints de Auth
- `POST /api/auth/register` - Registro email/password ✅
- `POST /api/auth/set-password` - Usuarios Google establecen contraseña ✅
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler ✅

#### Validaciones
- Password mínimo 6 caracteres
- Email único
- bcrypt 10 rounds
- Roles verificados server-side en cada endpoint

### 2.4 Sistema de Challenges y Submissions

#### Challenges Seeded (11 + 1 Bonus)
| Level | Nombre | Dificultad | Puntos |
|-------|--------|------------|--------|si

| 1 | Ollie | Easy | 100 |
| 2 | Kickflip | Medium | 150 |
| 3 | Heelflip | Medium | 150 |
| 4 | 50-50 Grind | Medium | 200 |
| 5 | Boardslide | Medium | 200 |
| 6 | Pop Shove-it | Medium | 180 |
| 7 | 360 Flip | Hard | 300 |
| 8 | Hardflip | Hard | 350 |
| 9 | Nollie Heelflip | Hard | 400 |
| 10 | Switch Kickflip | Expert | 500 |
| Bonus | Impossible | Expert | 1000 |

#### Endpoints de Submissions
- `POST /api/submissions` - Crear submission con validación YouTube ✅
- `GET /api/submissions/user` - Historial del usuario con stats ✅
- `GET /api/submissions/pending` - Solo jueces/admin ✅
- `POST /api/submissions/evaluate` - Solo jueces/admin ✅

#### Validación de URLs YouTube
Patrones aceptados:
- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/embed/VIDEO_ID`

#### Flujo de Estados
```
pending → approved (con score 0-100 + feedback)
pending → rejected (con feedback)
```

### 2.5 Sistema de Evaluación (Jueces)

#### Panel Funcional: `/dashboard/judges/evaluate`

**Features:**
- Carga submissions pendientes automáticamente
- Muestra info del skater, challenge, video embed
- Formulario inline: Score (0-100) + Feedback
- Botones: Aprobar/Rechazar
- Notificación en tiempo real (toast)

**Validaciones Server-Side:**
- Verifica rol judge o admin
- Score 0-100 solo para approved
- Status válido (approved/rejected)

### 2.6 Sistema de Puntuación

**Cálculo:**
```
Score Total = SUM(submission.score) WHERE status = "approved"
```

**Endpoint:**
- `GET /api/users/score?email=` - Suma de scores aprobados

**Display:**
- Sidebar skater: "Score = {totalScore}"
- Stats en tricks page
- Stats en submissions page

**Lo que NO existe:**
- ❌ Leaderboard global
- ❌ Ranking por posición
- ❌ Bonificaciones por tiempo/desempeño

### 2.7 Sistema de Teams (NO IMPLEMENTADO)

**Estado:** Solo schema en Prisma, nada más

**Lo que faltaría:**
```
ENDPOINTS NECESARIOS:
- POST /api/teams - Crear equipo
- GET /api/teams - Listar teams
- GET /api/teams/:id - Detalle team
- POST /api/teams/:id/members - Agregar miembro
- DELETE /api/teams/:id/members/:userId - Remover
- GET /api/teams/:id/score - Score agregado

LÓGICA:
- Validar max members
- Scoring agregado (SUM scores de miembros)
- Leaderboard de teams
- Invitaciones/solicitudes
```

### 2.8 Componentes UI

#### Estructura Actual (Flat)
Todos los componentes están en `/src/components/` sin organización atomic.

#### Componentes Funcionales

**Autenticación:**
- `SigninButton.tsx` - Botón Google OAuth ✅
- `LoginEmailForm.tsx` - Modal login email/password ✅
- `RegisterEmailForm.tsx` - Modal registro ✅
- `SetPasswordModal.tsx` - Modal para users Google ✅
- `SkateProfileCompletionModal.tsx` - Modal multi-step ✅
- `WelcomeModal.tsx` - Welcome con countdown ✅

**Challenges:**
- `ChallengeCard.tsx` - Card con demo video + status ✅
- `SubmitTrickModal.tsx` - Formulario con validación URL ✅
- `GalerryLevels.tsx` - Grid gallery (datos mock) ❌

**Submissions:**
- `SubmissionHistoryCard.tsx` - Card con video expandible ✅

**Perfil:**
- `ProfilePage.tsx` - 3 tabs completos ✅
- `general_info_form.tsx` - Formulario info ✅
- `dream_setup.tsx` - Formulario setup ✅

**Navegación:**
- `Sidebar.tsx` - Menú skater con role routing ✅
- `SidebarJuez.tsx` - Menú juez (datos mock) ❌
- `SidebarMenuItem.tsx` - Item individual ✅
- `Appbar.tsx` - Barra superior ✅
- `navbar.tsx` - Navegación alternativa ✅

**Utilidades:**
- `avatar.tsx` - Avatar component ✅
- `LocationSelector.tsx` - Selector dept/ciudad ✅
- `UserScoreBadge.tsx` - Badge puntuación ✅
- `cover-particles.tsx` - TSParticles effect ✅
- `transition-page.tsx` - Animaciones ✅

**Placeholders (datos mock, no funcionales):**
- `highScore.tsx` - Leaderboard placeholder ❌
- `team.tsx` - Team info placeholder ❌
- `partners.tsx` - Partners grid ❌

### 2.9 Deuda Técnica

#### Rutas Duplicadas
```
PROBLEMA: Múltiples rutas para jueces
- /dashboard/judges/evaluate ✅ (ACTIVA)
- /dashboard/judge/calificate ❌ (Legacy)
- /dashboard/judge/profile ❌ (Legacy)
- /dashboard/jueces/calificate ❌ (Legacy)
- /dashboard/jueces/profile ❌ (Legacy)

SOLUCIÓN: Consolidar en /dashboard/judges/* y eliminar rutas old
```

#### Sidebars Duplicados
```
PROBLEMA: Dos sidebars con lógica diferente
- Sidebar.tsx - Dinámico, con roles
- SidebarJuez.tsx - Hardcoded "Edward Tompson"

SOLUCIÓN: Unificar en Sidebar.tsx con role routing
```

#### Datos Mock sin Integrar
```
PROBLEMA: Componentes con datos hardcoded
- GalerryLevels.tsx usa dataTrickets (mock)
- highScore.tsx usa highScore (mock)
- team.tsx usa dataTeam (mock)

SOLUCIÓN: Integrar con endpoints reales o eliminar
```

---

## 3. COMPETENCIA IDENTIFICADA

### 3.1 Competidores Directos

#### Pulled App (pulled.app)
**Modelo:** Game of SKATE digital con duelos 1v1

**Características:**
- Grabar trick → Enviar como challenge → Oponente debe duplicar
- Votación por comunidad (Matrix Mode para slow-mo y zoom)
- 4 días para responder cada challenge
- Sistema de eliminación tipo SKATE

**Fortalezas:**
- UX de duelo muy pulida
- Comunidad activa como jueces
- Engagement alto por competitividad directa

**Debilidades:**
- Solo 1v1, no hay equipos
- No hay progresión estructurada
- No hay niveles de dificultad definidos

---

#### SkateYou (skateyou.com)
**Modelo:** Red social + concursos con coins virtuales

**Características:**
- Perfiles con fotos/videos
- Concursos donde el más votado gana coins
- Conexión con skaters globales
- Gamificación básica

**Fortalezas:**
- Aspecto social desarrollado
- Sistema de economía virtual
- Comunidad global

**Debilidades:**
- Menos enfocado en competencia estructurada
- No hay jueces profesionales
- Votación puede ser manipulable

---

#### The Berrics / BATB (theberrics.com)
**Modelo:** Competencia anual tipo March Madness

**Características:**
- Battle at the Berrics (BATB) - brackets eliminatorios
- 64 skaters en torneos anuales
- Categorías: Pros, Amateurs, Influencers, Women's (WBATB)
- Contenido de alta producción
- 3M followers en Instagram

**Fortalezas:**
- Marca establecida y reconocida
- Producción profesional
- Comunidad masiva
- Credibilidad en la industria

**Debilidades:**
- Acceso limitado (por invitación/selección)
- Solo eventos específicos, no continuo
- No hay app/plataforma digital abierta

---

#### The Boardr (theboardr.com)
**Modelo:** Eventos presenciales + sistema de judging

**Características:**
- The Boardr Live™ - app de scoring para eventos
- Soporte para múltiples jueces con drop high/low
- The Boardr Series - competencias nacionales USA
- Eventos como Clash of the Crews (teams)

**Fortalezas:**
- Sistema de judging profesional
- Eventos presenciales con comunidad
- Infraestructura probada

**Debilidades:**
- Enfocado en eventos físicos, no digital-first
- Principalmente USA
- No hay competencia online continua

---

#### The Platfrm (theplatfrm.com)
**Modelo:** Video Qualifying Series (VQS) para competencias

**Características:**
- Subir videos para calificar a eventos como Rockstar Energy Open
- Jueces profesionales evalúan submissions
- Acceso a competencias de alto nivel
- Reglas oficiales publicadas

**Fortalezas:**
- Pathway a competencias profesionales
- Judging de calidad
- Credibilidad institucional

**Debilidades:**
- Solo para calificar a eventos específicos
- No es plataforma social
- Acceso limitado geográficamente

---

### 3.2 Competidores Indirectos (Apps de Aprendizaje)

| App | Tipo | Características |
|-----|------|-----------------|
| **Skate Tricks App** | Aprendizaje + Game of SKATE | Library de 100+ tricks, slow-mo, duelos 1v1 |
| **True Skate** | Simulador | Leaderboards globales, challenges, sandbox |
| **Skate Dice** | Generador de retos | TRICKTIONARY, multiplayer SKATE, aleatorio |
| **Game of SKATE or ANYTHING** | Utilidad | Tracking de letras para grupos grandes, 440+ tricks |

### 3.3 Tabla Comparativa

| Feature | Trickest | Pulled | SkateYou | Berrics | Boardr | Platfrm |
|---------|----------|--------|----------|---------|--------|---------|
| Challenges estructurados | ✅ | ❌ | ❌ | 🔄 | ❌ | 🔄 |
| Jueces profesionales | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Niveles de dificultad | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Duelos 1v1 | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Teams/Equipos | 🔄 | ❌ | ❌ | ❌ | ✅ | ❌ |
| Leaderboards | ❌ | 🔄 | ✅ | ❌ | ✅ | ❌ |
| Social features | ❌ | 🔄 | ✅ | ✅ | 🔄 | ❌ |
| Gamificación/Badges | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Acceso abierto | ✅ | ✅ | ✅ | ❌ | 🔄 | 🔄 |
| App móvil | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |

---

## 4. ANÁLISIS DE OPORTUNIDADES

### 4.1 Diferenciador Único de Trickest

**Trickest tiene una estructura de "Challenge System con Evaluación de Jueces"** - algo entre The Platfrm (profesional) y Pulled (community).

**Esto es ÚNICO porque:**
1. Niveles progresivos (1-10 + bonus) - nadie más tiene esto
2. Jueces evalúan con score + feedback - calidad sobre votación
3. Estructura gamificada pero seria - no es solo social
4. Potencial para teams competitivos

### 4.2 Gaps en el Mercado

| Gap | Oportunidad | Competidores que NO lo tienen |
|-----|-------------|-------------------------------|
| **Progression estructurado** | 10 niveles con jueces | Pulled, SkateYou, Berrics |
| **Teams competitivos online** | Ranking de equipos continuo | Pulled (solo 1v1), SkateYou, Platfrm |
| **Gamificación profunda** | 50+ badges, XP, streaks | Todos tienen básico o nada |
| **LATAM/Colombia focus** | Comunidad localizada | CERO competencia regional |
| **Hybrid judging** | Jueces + votación comunidad | Platfrm (solo jueces), Pulled (solo comunidad) |

### 4.3 Amenazas

| Amenaza | Mitigación |
|---------|------------|
| Pulled tiene mejor UX 1v1 | Enfocarse en progression, no en duelos |
| Berrics tiene la marca | Ser la alternativa accesible para amateurs |
| Pocos jueces = bottleneck | Implementar votación comunidad como pre-filtro |
| YouTube dependency | A futuro: video upload propio |

---

## 5. FEATURES RECOMENDADAS

### 5.1 TIER 1 - Fundamentos (CRÍTICO)

| Feature | Descripción | Impacto | Esfuerzo |
|---------|-------------|---------|----------|
| **Leaderboard Global** | Ranking de usuarios por score | 🔥🔥🔥🔥🔥 | Medio |
| **Sistema de Teams** | CRUD completo + UI | 🔥🔥🔥🔥🔥 | Alto |
| **Leaderboard Teams** | Ranking de equipos por score agregado | 🔥🔥🔥🔥 | Medio |
| **Cleanup rutas** | Eliminar /judge, /jueces duplicados | 🔥🔥🔥 | Bajo |

### 5.2 TIER 2 - Engagement

| Feature | Descripción | Impacto | Esfuerzo |
|---------|-------------|---------|----------|
| **Achievements/Badges** | 15-20 badges iniciales desbloqueables | 🔥🔥🔥🔥 | Medio |
| **Notificaciones** | "Tu submission fue evaluada" | 🔥🔥🔥🔥 | Medio |
| **Perfiles públicos** | Ver stats/submissions de otros | 🔥🔥🔥 | Medio |
| **Challenge semanal** | Reto con countdown, FOMO | 🔥🔥🔥🔥 | Medio |

### 5.3 TIER 3 - Diferenciación

| Feature | Descripción | Impacto | Esfuerzo |
|---------|-------------|---------|----------|
| **Votación comunidad** | Pre-filtro antes de jueces | 🔥🔥🔥🔥🔥 | Alto |
| **Battle Mode 1v1** | Duelos directos tipo Pulled | 🔥🔥🔥🔥 | Alto |
| **Seasons/Temporadas** | Reset rankings cada 3 meses | 🔥🔥🔥 | Medio |
| **Sponsor Challenges** | Retos de marcas con premios | 🔥🔥🔥🔥 | Medio |
| **Eventos en vivo** | Competencias con fecha límite | 🔥🔥🔥🔥 | Alto |

### 5.4 TIER 4 - Escalabilidad

| Feature | Descripción | Impacto | Esfuerzo |
|---------|-------------|---------|----------|
| **PWA optimizada** | Mejor UX móvil para grabar | 🔥🔥🔥 | Medio |
| **Video upload propio** | Cloudinary/Supabase Storage | 🔥🔥 | Alto |
| **Admin Panel** | CRUD usuarios, challenges, sponsors | 🔥🔥🔥 | Alto |
| **Analytics dashboard** | Métricas para sponsors | 🔥🔥 | Medio |
| **API pública** | Integración con terceros | 🔥 | Medio |

---

## 6. ENFOQUES ESTRATÉGICOS

### 6.1 OPCIÓN A: "The Competitive Platform"

**Enfoque:** Competencia estructurada con rankings y teams

**Target:** Skaters competitivos que quieren probarse

**Features prioritarias:**
- Leaderboards por nivel, global, por equipo
- Temporadas con premios
- Brackets eliminatorios
- Sponsor challenges

**Modelo de negocio:** Sponsors + eventos pagos

**Referencia:** The Boardr + The Platfrm

**Pros:**
- Diferenciador claro vs competencia
- Atractivo para sponsors
- Engagement alto por competitividad

**Cons:**
- Requiere masa crítica de usuarios
- Necesita jueces activos
- Más complejo de implementar

---

### 6.2 OPCIÓN B: "The Social Skate Network"

**Enfoque:** Comunidad + aprendizaje + challenges casuales

**Target:** Skaters casual que quieren mejorar y conectar

**Features prioritarias:**
- Perfiles sociales con followers
- Feed de submissions
- Duelos 1v1 casuales
- Trick tutorials integrados

**Modelo de negocio:** Freemium + ads

**Referencia:** SkateYou + Pulled

**Pros:**
- Más fácil de escalar
- Menor dependencia de jueces
- Engagement social natural

**Cons:**
- Competencia directa con Pulled/SkateYou
- Menos diferenciado
- Monetización más difícil

---

### 6.3 OPCIÓN C: "The Gamified Progression"

**Enfoque:** RPG-style progression con achievements masivos

**Target:** Gamers/skaters que aman completar logros

**Features prioritarias:**
- 100+ badges desbloqueables
- XP system con niveles de usuario
- Daily/Weekly challenges
- Coleccionables virtuales
- Streaks y rachas

**Modelo de negocio:** Freemium (badges premium) + sponsors

**Referencia:** Duolingo + Nike Run Club + Fitbit

**Pros:**
- Retention muy alta
- Diferenciador único en skating
- Engagement diario

**Cons:**
- Requiere diseño de sistemas complejo
- Puede sentirse artificial para skaters hardcore

---

### 6.4 OPCIÓN D: "Híbrido" (RECOMENDADO)

**Enfoque:** Competición + Gamificación + Comunidad light

**Combina lo mejor de cada opción:**
- Rankings competitivos (Opción A)
- Badges y progression (Opción C)
- Perfiles públicos básicos (Opción B)
- Votación comunidad para escalar jueces

**Target:** Skaters amateur/principiantes de Colombia → LATAM → Global

**Modelo:** Sponsors + eventos pagos + comunidad

**Por qué es el mejor:**
1. Aprovecha la estructura actual (challenges + jueces)
2. Resuelve el bottleneck de jueces (votación comunidad)
3. Diferenciación clara vs competencia
4. Escalable geográficamente
5. Múltiples fuentes de ingreso

---

## 7. DEFINICIÓN DEL ENFOQUE

### 7.1 Respuestas del Stakeholder

| Pregunta | Respuesta |
|----------|-----------|
| **Target principal** | Amateur y principiantes |
| **Modelo de negocio** | Sponsors, eventos pagos, algo de comunidad |
| **Geografía** | Colombia primero → Global después |
| **Capacidad de jueces** | Pocos jueces (bottleneck confirmado) |

### 7.2 Implicaciones Estratégicas

#### Target: Amateur/Principiantes
**Significa:**
- UX debe ser muy simple e intuitiva
- Progression debe sentirse alcanzable
- No intimidar con competencia hardcore
- Tutoriales y guías son valiosos
- Comunidad de soporte es importante

**Ajustes:**
- Añadir niveles "intro" más fáciles (pre-Ollie)
- Badges de "primer intento" y "mejora personal"
- Tips/tutoriales en cada challenge
- Celebrar pequeños logros

---

#### Modelo: Sponsors + Eventos + Comunidad
**Significa:**
- Necesitas métricas para sponsors (usuarios activos, engagement)
- Eventos deben tener fechas límite y premios
- Comunidad genera contenido y engagement orgánico
- Balance entre competición seria y diversión

**Ajustes:**
- Dashboard de analytics para sponsors
- Sistema de "Sponsor Challenges" destacados
- Eventos con inscripción y premios
- Features sociales básicas (perfiles públicos, comentarios)

---

#### Geografía: Colombia → Global
**Significa:**
- Empezar con comunidad local concentrada
- Contenido en español inicialmente
- Partners/sponsors colombianos primero
- Escalar a LATAM antes de global

**Ajustes:**
- Leaderboard Colombia destacado
- Eventos locales (ciudades colombianas)
- Partnerships con tiendas de skate colombianas
- Multi-idioma después (i18n preparado)

---

#### Pocos Jueces (CRÍTICO)
**Significa:**
- Bottleneck serio para escalar
- Usuarios frustrados esperando evaluación
- Necesidad de sistema alternativo URGENTE

**Soluciones propuestas:**

1. **Votación Comunidad como Pre-filtro**
   ```
   Submission → Votación Comunidad (24-48h) → Top votados → Jueces evalúan
   ```
   - Reduce carga de jueces 80%
   - Comunidad se siente involucrada
   - Solo lo mejor llega a jueces

2. **Auto-aprobación con threshold**
   ```
   Si votación comunidad > 80% positiva → Auto-aprobado con score estimado
   Jueces solo revisan casos dudosos
   ```

3. **Jueces de la comunidad**
   ```
   Usuarios con X submissions aprobadas → Pueden ser "Community Judges"
   Votos de Community Judges valen más
   ```

4. **Queue prioritario**
   ```
   Submissions de usuarios activos/premium → Prioridad en cola de jueces
   ```

---

### 7.3 Enfoque Final Recomendado

**NOMBRE:** "Competitive Gamification for Amateur Skaters"

**Tagline:** "Aprende, compite, crece - del primer ollie al pro"

**Pilares:**
1. **Progression estructurado** - 10+ niveles con dificultad gradual
2. **Gamificación profunda** - Badges, XP, streaks, achievements
3. **Competencia accesible** - Rankings pero sin intimidar
4. **Comunidad como jueces** - Escalar evaluación
5. **Eventos con sponsors** - Monetización + engagement

**Diferenciadores vs competencia:**
- Único con niveles progresivos + jueces + votación comunidad
- Enfocado en amateurs (no pros intimidantes)
- Base en Colombia (comunidad localizada)
- Híbrido entre competición seria y gamificación divertida

---

## 8. ROADMAP AJUSTADO

### 8.1 Fase 1: Core Competitivo ✅ COMPLETADA (Dic 2024)

**Objetivo:** ✅ Tener la base competitiva funcionando

| Task | Estado | Completado |
|------|--------|------------|
| Leaderboard global de usuarios | ✅ | Dic 2024 |
| Cleanup rutas duplicadas | ✅ | Dic 2024 |
| Sistema de Teams (endpoints) | ✅ | Dic 2024 |
| UI de Teams (crear, unirse, ver) | ✅ | Dic 2024 |
| Leaderboard de Teams | ✅ | Dic 2024 |
| Perfiles públicos básicos | ✅ | Dic 2024 |
| Página de logros (UI) | ✅ | Dic 2024 |
| Sidebar unificado (roles) | ✅ | Dic 2024 |

**Entregables Completados:**
- ✅ `/api/leaderboards/users` - Top 100 usuarios con paginación
- ✅ `/api/leaderboards/teams` - Top teams con score agregado
- ✅ `/api/teams/*` - CRUD completo (GET, POST, join, leave, my-team)
- ✅ `/api/users/[email]/profile` - Perfil público con stats
- ✅ `/dashboard/leaderboard` - Vista de rankings con tabs users/teams
- ✅ `/dashboard/teams` - Gestión de equipos
- ✅ `/dashboard/profile/[email]` - Perfil público completo
- ✅ `/dashboard/skaters/logros` - Página con 21 badges en 7 categorías
- ✅ `Sidebar.tsx` - Unificado para skater/judge/admin con role routing

---

### 8.2 Fase 2: Votación Comunidad (2-3 semanas)

**Objetivo:** Resolver bottleneck de jueces

| Task | Prioridad | Estimado |
|------|-----------|----------|
| Schema para votos (Vote model) | 🔴 Crítica | 1 día |
| Endpoint votar submission | 🔴 Crítica | 2 días |
| UI de votación en submissions | 🔴 Crítica | 2-3 días |
| Lógica de threshold (auto-approve) | 🔴 Crítica | 2 días |
| Queue de jueces con filtros | 🟡 Alta | 2 días |
| Dashboard de votos para usuario | 🟡 Alta | 2 días |

**Entregables:**
- Sistema de upvote/downvote en submissions
- Auto-aprobación si >80% positivo con >10 votos
- Cola de jueces solo muestra casos dudosos
- Usuario ve cuántos votos tiene su submission

---

### 8.3 Fase 3: Gamificación (2-3 semanas)

**Objetivo:** Aumentar engagement y retention

| Task | Prioridad | Estimado |
|------|-----------|----------|
| Schema Achievement/Badge | 🔴 Crítica | 1 día |
| 20 badges iniciales definidos | 🔴 Crítica | 1 día |
| Lógica de desbloqueo automático | 🔴 Crítica | 3 días |
| UI de badges en perfil | 🔴 Crítica | 2 días |
| Notificaciones de logros | 🟡 Alta | 2 días |
| XP system básico | 🟡 Alta | 2 días |
| Streaks de actividad | 🟢 Media | 2 días |

**Badges iniciales propuestos:**
```
PRINCIPIANTE:
- 🎯 Primer Intento - Envía tu primera submission
- ✅ Primera Victoria - Primera submission aprobada
- 🔥 En Racha - 3 submissions aprobadas seguidas

PROGRESIÓN:
- 🥉 Nivel Bronce - Completa niveles 1-3
- 🥈 Nivel Plata - Completa niveles 4-6
- 🥇 Nivel Oro - Completa niveles 7-9
- 💎 Nivel Diamante - Completa nivel 10
- 🌟 Bonus Hunter - Completa el challenge bonus

SOCIAL:
- 👥 Team Player - Únete a un equipo
- 👑 Capitán - Crea un equipo
- 🤝 Reclutador - 5 miembros en tu equipo

VOTACIÓN:
- 🗳️ Ciudadano - Vota 10 submissions
- ⚖️ Juez Popular - Vota 100 submissions
- 🎯 Buen Ojo - 10 votos coinciden con jueces

CONSISTENCIA:
- 📅 Semanal - Activo 7 días seguidos
- 📆 Mensual - Activo 30 días
- 🔄 Comeback - Regresa después de 30 días
```

---

### 8.4 Fase 4: Eventos y Sponsors (3-4 semanas)

**Objetivo:** Monetización y engagement cíclico

| Task | Prioridad | Estimado |
|------|-----------|----------|
| Schema Event/SponsorChallenge | 🔴 Crítica | 1 día |
| CRUD de eventos (admin) | 🔴 Crítica | 3 días |
| UI de eventos con countdown | 🔴 Crítica | 3 días |
| Sistema de inscripción | 🔴 Crítica | 2 días |
| Leaderboard por evento | 🟡 Alta | 2 días |
| Sponsor branding en challenges | 🟡 Alta | 2 días |
| Notificaciones de eventos | 🟡 Alta | 2 días |
| Admin panel básico | 🟢 Media | 4-5 días |

**Tipos de eventos:**
1. **Challenge Semanal** - Reto específico, todos compiten
2. **Torneo Mensual** - Brackets eliminatorios
3. **Sponsor Challenge** - Marca patrocina con premios
4. **City Battle** - Equipos por ciudad compiten

---

### 8.5 Fase 5: Escalabilidad (Ongoing)

| Task | Prioridad | Estimado |
|------|-----------|----------|
| i18n (inglés + portugués) | 🟡 Alta | 3-4 días |
| PWA optimizada | 🟡 Alta | 3-4 días |
| Video upload (Cloudinary) | 🟢 Media | 4-5 días |
| Analytics dashboard | 🟢 Media | 3-4 días |
| Rate limiting | 🟢 Media | 1-2 días |
| Tests automatizados | 🟢 Media | Ongoing |

---

### 8.6 Timeline Visual

```
FASE 1 (Semanas 1-3): CORE COMPETITIVO
├── Leaderboards ████████░░
├── Teams        ████████░░
└── Cleanup      ██░░░░░░░░

FASE 2 (Semanas 4-6): VOTACIÓN COMUNIDAD
├── Votos        ████████░░
├── Auto-approve ██████░░░░
└── Queue jueces ████░░░░░░

FASE 3 (Semanas 7-9): GAMIFICACIÓN
├── Badges       ████████░░
├── XP System    ██████░░░░
└── Streaks      ████░░░░░░

FASE 4 (Semanas 10-13): EVENTOS
├── Events CRUD  ████████░░
├── Sponsors     ██████░░░░
└── Admin Panel  ████████░░

FASE 5 (Ongoing): ESCALABILIDAD
├── i18n         ██████░░░░
├── PWA          ██████░░░░
└── Video Upload ████░░░░░░
```

---

## 9. CONSIDERACIONES TÉCNICAS

### 9.1 Cambios de Schema Necesarios

```prisma
// Nuevo: Votos de comunidad
model Vote {
  id           Int      @id @default(autoincrement())

  submissionId Int
  voterId      String   // email del votante
  value        Int      // 1 (upvote) o -1 (downvote)

  createdAt    DateTime @default(now())

  submission   Submission @relation(fields: [submissionId])
  voter        User       @relation(fields: [voterId], references: [email])

  @@unique([submissionId, voterId]) // Un voto por persona
  @@index([submissionId])
}

// Nuevo: Achievements/Badges
model Achievement {
  id          Int      @id @default(autoincrement())

  code        String   @unique  // "FIRST_SUBMISSION", "LEVEL_BRONZE", etc.
  name        String
  description String
  icon        String   // emoji o URL de imagen
  category    String   // "progression", "social", "voting", "consistency"

  // Condiciones de desbloqueo (JSON)
  condition   Json     // { "type": "submissions_approved", "count": 1 }

  // Usuarios que lo tienen
  users       UserAchievement[]
}

model UserAchievement {
  id            Int      @id @default(autoincrement())

  userId        String   // email
  achievementId Int

  unlockedAt    DateTime @default(now())

  user          User        @relation(fields: [userId], references: [email])
  achievement   Achievement @relation(fields: [achievementId])

  @@unique([userId, achievementId])
}

// Nuevo: Eventos
model Event {
  id          Int      @id @default(autoincrement())

  name        String
  description String
  type        String   // "weekly", "tournament", "sponsor"

  startDate   DateTime
  endDate     DateTime

  challengeId Int?     // Challenge específico (opcional)
  sponsorId   Int?     // Sponsor (opcional)

  prizes      Json?    // Array de premios
  rules       String?

  isActive    Boolean  @default(true)

  challenge   Challenge? @relation(fields: [challengeId])
  sponsor     Sponsor?   @relation(fields: [sponsorId])

  participants EventParticipant[]
}

model EventParticipant {
  id        Int      @id @default(autoincrement())

  eventId   Int
  userId    String   // email

  score     Int      @default(0)
  rank      Int?

  joinedAt  DateTime @default(now())

  event     Event @relation(fields: [eventId])
  user      User  @relation(fields: [userId], references: [email])

  @@unique([eventId, userId])
}

// Nuevo: Sponsors
model Sponsor {
  id          Int      @id @default(autoincrement())

  name        String
  logo        String
  website     String?
  description String?

  isActive    Boolean  @default(true)

  events      Event[]
}

// Actualizar Submission
model Submission {
  // ... campos existentes ...

  // Nuevos campos
  voteScore    Int      @default(0)  // Cache de score de votos
  voteCount    Int      @default(0)  // Cache de total votos
  isAutoApproved Boolean @default(false)

  votes        Vote[]
}

// Actualizar User
model User {
  // ... campos existentes ...

  // Nuevos campos
  xp              Int    @default(0)
  level           Int    @default(1)
  currentStreak   Int    @default(0)
  longestStreak   Int    @default(0)
  lastActiveDate  DateTime?

  // Nuevas relaciones
  votes           Vote[]
  achievements    UserAchievement[]
  eventParticipations EventParticipant[]
}
```

### 9.2 Nuevos Endpoints Necesarios

#### Leaderboards
```
GET /api/leaderboards/users
  - Query: ?limit=100&offset=0&period=all|week|month
  - Response: { users: [{ rank, email, name, photo, score, team }] }

GET /api/leaderboards/teams
  - Query: ?limit=50&offset=0
  - Response: { teams: [{ rank, name, logo, score, memberCount }] }

GET /api/leaderboards/events/:eventId
  - Response: { participants: [{ rank, user, score }] }
```

#### Teams
```
GET /api/teams
  - Query: ?search=&limit=20&offset=0
  - Response: { teams: [...] }

POST /api/teams
  - Body: { name, description, logo? }
  - Response: { team }

GET /api/teams/:id
  - Response: { team, members, score }

POST /api/teams/:id/join
  - Response: { success }

DELETE /api/teams/:id/leave
  - Response: { success }

POST /api/teams/:id/invite
  - Body: { email }
  - Response: { invitation }
```

#### Votes
```
POST /api/submissions/:id/vote
  - Body: { value: 1 | -1 }
  - Response: { voteScore, voteCount }

GET /api/submissions/to-vote
  - Query: ?limit=10
  - Response: { submissions: [...] } // Submissions sin votar del usuario
```

#### Achievements
```
GET /api/achievements
  - Response: { achievements: [...] }

GET /api/users/:email/achievements
  - Response: { unlocked: [...], locked: [...] }

POST /api/achievements/check
  - (Internal) Verifica y desbloquea logros
```

#### Events
```
GET /api/events
  - Query: ?status=active|upcoming|past
  - Response: { events: [...] }

GET /api/events/:id
  - Response: { event, leaderboard, myParticipation }

POST /api/events/:id/join
  - Response: { participation }
```

### 9.3 Cron Jobs Necesarios

```javascript
// 1. Actualizar streaks diariamente
// Corre a las 00:00 UTC
async function updateStreaks() {
  // Usuarios activos ayer → streak++
  // Usuarios inactivos ayer → streak = 0
}

// 2. Calcular rankings
// Corre cada hora
async function calculateRankings() {
  // Recalcular posiciones en leaderboards
  // Actualizar caches
}

// 3. Auto-aprobar submissions
// Corre cada 30 minutos
async function autoApproveSubmissions() {
  // Submissions con >10 votos y >80% positivos
  // Marcar como auto-approved con score estimado
}

// 4. Verificar achievements
// Corre después de cada acción relevante (event-driven)
async function checkAchievements(userId, triggerType) {
  // Verificar condiciones de cada achievement
  // Desbloquear si aplica
  // Enviar notificación
}

// 5. Finalizar eventos
// Corre cada hora
async function finalizeEvents() {
  // Eventos con endDate pasada
  // Calcular rankings finales
  // Entregar premios/badges
}
```

### 9.4 Integraciones Futuras

| Servicio | Uso | Prioridad |
|----------|-----|-----------|
| **Cloudinary** | Video upload y procesamiento | Media |
| **Resend/SendGrid** | Emails transaccionales | Alta |
| **OneSignal** | Push notifications | Media |
| **Stripe** | Pagos de eventos | Baja |
| **Analytics (Mixpanel/Amplitude)** | Tracking de comportamiento | Media |

---

## 10. ARCHIVOS CRÍTICOS

### 10.1 Autenticación
- `/src/app/api/auth/[...nextauth]/route.ts` - NextAuth config
- `/src/types/next-auth.d.ts` - Session types
- `/src/lib/auth-helpers.ts` - Role utilities

### 10.2 Submissions
- `/src/app/api/submissions/route.ts` - Create
- `/src/app/api/submissions/evaluate/route.ts` - Judge evaluation
- `/src/app/api/submissions/pending/route.ts` - Pending list
- `/src/app/api/submissions/user/route.ts` - User history

### 10.3 UI Principal
- `/src/app/(routes)/dashboard/skaters/tricks/page.tsx` - Browse challenges
- `/src/app/(routes)/dashboard/judges/evaluate/page.tsx` - Judge panel
- `/src/app/(routes)/dashboard/skaters/profile/page.tsx` - User profile

### 10.4 Components Clave
- `/src/components/ChallengeCard.tsx` - Challenge display
- `/src/components/SubmitTrickModal.tsx` - Submit form
- `/src/components/sidebar/Sidebar.tsx` - Main navigation

### 10.5 Archivos a Crear (Nuevos)
```
/src/app/api/leaderboards/users/route.ts
/src/app/api/leaderboards/teams/route.ts
/src/app/api/teams/route.ts
/src/app/api/teams/[id]/route.ts
/src/app/api/teams/[id]/join/route.ts
/src/app/api/submissions/[id]/vote/route.ts
/src/app/api/achievements/route.ts
/src/app/api/events/route.ts

/src/app/(routes)/dashboard/leaderboards/page.tsx
/src/app/(routes)/dashboard/teams/page.tsx
/src/app/(routes)/profile/[email]/page.tsx

/src/components/LeaderboardTable.tsx
/src/components/TeamCard.tsx
/src/components/AchievementBadge.tsx
/src/components/VoteButtons.tsx
/src/components/EventCard.tsx
```

---

## CONCLUSIÓN

Trickest tiene una base sólida con un diferenciador único: **sistema de challenges estructurado con evaluación de jueces**.

Para escalar y monetizar, las prioridades son:
1. **Leaderboards y Teams** - Base competitiva
2. **Votación comunidad** - Resolver bottleneck de jueces
3. **Gamificación** - Retention y engagement
4. **Eventos con sponsors** - Monetización

El enfoque "Competitive Gamification for Amateur Skaters" posiciona a Trickest como la plataforma accesible para skaters que quieren mejorar, competir y ser parte de una comunidad, empezando en Colombia y escalando globalmente.

---

*Documento generado como parte del análisis estratégico de Trickest*
