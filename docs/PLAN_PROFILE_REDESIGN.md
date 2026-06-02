# PLAN: Rediseño de Páginas de Perfil

> **Estado:** Pendiente de aprobación
> **Fecha:** 19 de febrero 2026
> **Prioridad:** Alta (feedback de usuarios: "se ve muy mal")

---

## DIAGNÓSTICO: Problemas Actuales

### Problemas de UX/UI

1. **Sin resumen visual del usuario** - Al entrar a editar perfil, no ves tu avatar, nombre ni score de un vistazo. Solo ves el header y los tabs
2. **Sin indicador de completitud** - No hay barra ni % que muestre cuánto del perfil está lleno. El usuario no sabe qué le falta
3. **Tab de redes sociales inline** - A diferencia de General Info y Dream Setup que son componentes separados, el formulario de redes sociales está embebido directo en `page.tsx` (517 líneas)
4. **`prompt()` nativo en Dream Setup** - Para la opción "Custom" se usa `window.prompt()`, que es un popup feo del navegador que rompe la experiencia
5. **Botón de guardar con `animate-pulse` permanente** en Dream Setup - Es visualmente molesto y distrae
6. **Sin skeleton loading** - Solo un spinner genérico mientras carga
7. **Sin empty states guiados** - Cuando no hay datos, no se guía al usuario a completar su perfil
8. **Notificaciones con `animate-pulse`** - Parpadean de forma incómoda en vez de aparecer suave y desaparecer

### Problemas Técnicos

9. **Código duplicado masivo** - La interfaz `PublicProfile` (~100 líneas) está definida idénticamente en 2 archivos:
   - `dashboard/profile/[email]/page.tsx` (702 líneas)
   - `profile/[username]/page.tsx` (793 líneas)
10. **Lógica de renderizado duplicada** - Stats, achievements, setup, social media se renderizan desde cero en ambos archivos
11. **Gradientes en botones** - Varios botones usan `bg-gradient-to-r`, violando la regla crítica de CLAUDE.md
12. **Import incorrecto de Link** - `page.tsx` importa `Link` de `next/link` en vez de `@/i18n/routing` (rompe i18n)
13. **`console.log` en producción** - Múltiples console.log de debug regados en general_info_form.tsx y page.tsx
14. **Sin validación de formularios** - No hay campos requeridos ni validación de formato

### Problemas de Diseño Visual

15. **Todo se ve igual** - Todas las secciones del perfil público usan el mismo borde gradient cyan-to-purple. No hay variedad visual
16. **Grid de 3 columnas en perfil público por email** - Achievements, Activity y Setup en 3 cols se ve apretado
17. **Anchos inconsistentes** - El grid usa `max-w-6xl` pero stats y social usan `max-w-4xl`, creando un salto visual
18. **Follow button** está metido entre badges y location en el header, causando overflow en mobile
19. **Sin banner/cover** - El perfil se ve plano comparado con redes sociales modernas

---

## PLAN DE IMPLEMENTACIÓN

### Fase 1: Refactor de Componentes Compartidos (Prioridad: CRÍTICA)

**Objetivo:** Eliminar duplicación, crear componentes reutilizables

#### 1.1 Crear interfaz compartida
**Archivo:** `src/types/profile.ts`
- Extraer `PublicProfile` interface a un archivo compartido
- Ambos profile pages la importan de ahí

#### 1.2 Crear componentes de perfil reutilizables
**Directorio:** `src/components/organisms/profile/`

| Componente | Descripción |
|---|---|
| `ProfileHeader.tsx` | Avatar + nombre + role badge + location + team + follow/share buttons |
| `ProfileStats.tsx` | Grid de stats (score, challenges, success rate, streak) |
| `ProfileAchievements.tsx` | Lista de achievements con rarity colors |
| `ProfileActivity.tsx` | Recent activity timeline |
| `ProfileSetup.tsx` | Dream setup display (read-only, para perfil público) |
| `ProfileSocialLinks.tsx` | Botones de redes sociales |
| `ProfileCompleteness.tsx` | Barra de completitud del perfil (NUEVO) |

#### 1.3 Refactorizar ambos profile pages
- `dashboard/profile/[email]/page.tsx` → usa componentes compartidos
- `profile/[username]/page.tsx` → usa componentes compartidos
- Reducción estimada: ~1500 líneas → ~300 líneas (entre ambos)

---

### Fase 2: Rediseño del Perfil de Edición (Prioridad: ALTA)

**Archivo principal:** `dashboard/skaters/profile/page.tsx`

#### 2.1 Agregar Profile Summary Card
Nuevo componente en la parte superior que muestra:
- Avatar grande del usuario
- Nombre y username
- Score total
- Barra de completitud del perfil (%)
- Badge de rol

```
┌─────────────────────────────────────────────┐
│  [Avatar]  NOMBRE_USUARIO                   │
│            @username  ⭐ Score: 450          │
│            📊 Perfil 70% completo           │
│            ████████░░░░                     │
│            Falta: Redes sociales, Stance    │
│                                             │
│  [👁️ Ver Perfil Público]  [🔗 Compartir]   │
└─────────────────────────────────────────────┘
```

#### 2.2 Extraer Social Media Form
- Crear `src/app/[locale]/(routes)/dashboard/skaters/profile/social_media_form.tsx`
- Mover el formulario de redes sociales del page.tsx a su propio componente
- Consistencia con GeneralInfoForm y SkateSetupPage

#### 2.3 Mejorar Dream Setup
- Reemplazar `window.prompt()` con un modal o input inline para "Custom"
- Quitar `animate-pulse` del botón de guardar
- Traducir "Regular" y "Goofy" en stance selector
- Mostrar labels traducidos (no keys raw) en el resumen del setup

#### 2.4 Mejorar notificaciones
- Reemplazar `animate-pulse` con un fade-in/slide-down suave
- Auto-dismiss con barra de progreso visual
- Colores consistentes: verde=éxito, rojo=error, amarillo=warning

---

### Fase 3: Rediseño Visual del Perfil Público (Prioridad: ALTA)

#### 3.1 Variar gradientes por sección
En vez de todo cyan-to-purple, usar los gradientes del design system:

| Sección | Gradiente |
|---|---|
| Header | `from-cyan-500 to-purple-600` (mantener) |
| Stats | `from-yellow-500 to-orange-500` |
| Achievements | `from-purple-500 to-pink-500` |
| Activity | `from-cyan-500 to-blue-500` |
| Setup | `from-green-500 to-teal-500` |
| Social | `from-pink-500 to-rose-500` |

#### 3.2 Layout mejorado
- Cambiar grid de 3 cols a layout de 2 cols para achievements + activity
- Setup y social en full-width debajo
- Ancho consistente `max-w-5xl` para todas las secciones

```
┌─────────────────────────────────────────────┐
│              PROFILE HEADER                  │
│  Avatar | Name | Stats | Follow/Share       │
└─────────────────────────────────────────────┘

┌──── Stats (4 cards en grid) ────────────────┐
│ Score | Challenges | Success % | Streak     │
└─────────────────────────────────────────────┘

┌──── Achievements ────┬──── Activity ────────┐
│                      │                      │
│  (lista scrollable)  │  (timeline)          │
│                      │                      │
└──────────────────────┴──────────────────────┘

┌──── Dream Setup (full width) ───────────────┐
│  Deck | Trucks | Wheels | Bearings | Shoes  │
└─────────────────────────────────────────────┘

┌──── Social Media (full width) ──────────────┐
│  Instagram | TikTok | Twitter | Facebook    │
└─────────────────────────────────────────────┘
```

#### 3.3 Follow button fuera del header
- Mover follow/share buttons a su propia fila debajo del header info
- Evitar overflow en mobile

---

### Fase 4: Fixes Técnicos (Prioridad: MEDIA)

#### 4.1 Fix gradientes en botones
Botones que violan la regla (cambiar a colores sólidos):

| Archivo | Botón | Cambiar a |
|---|---|---|
| `general_info_form.tsx:291` | Save button | `bg-cyan-500 hover:bg-cyan-600` |
| `dream_setup.tsx:384` | Save setup | `bg-purple-600 hover:bg-purple-700` |
| `profile/[email]/page.tsx:684` | Edit profile | `bg-purple-600 hover:bg-purple-700` |
| `profile/[username]/page.tsx:775` | Edit profile | `bg-purple-600 hover:bg-purple-700` |

#### 4.2 Fix import de Link
- `page.tsx` línea 5: cambiar `import Link from 'next/link'` a `import { Link } from '@/i18n/routing'`

#### 4.3 Limpiar console.logs
Archivos afectados:
- `page.tsx` (profile edit) - ~4 console.logs
- `general_info_form.tsx` - ~6 console.logs

#### 4.4 Agregar validación básica de formularios
- Nombre: requerido, min 2 chars
- Teléfono: formato numérico
- Redes sociales: validar formato de username (sin http://, sin @)

---

### Fase 5: Mejoras Adicionales (Prioridad: BAJA)

#### 5.1 Skeleton loading
- Crear `ProfileSkeleton.tsx` con placeholders animados para cada sección
- Reemplazar spinners genéricos

#### 5.2 Empty states mejorados
- Cuando no hay achievements: mostrar CTA "Envía tu primer trick"
- Cuando no hay setup: mostrar CTA "Configura tu setup soñado"
- Cuando no hay social: mostrar CTA "Conecta tus redes"

#### 5.3 Profile banner/cover (opcional futuro)
- Agregar imagen de banner en la parte superior del perfil público
- Default: gradiente del design system

---

## ARCHIVOS AFECTADOS

### Crear nuevos:
```
src/types/profile.ts
src/components/organisms/profile/ProfileHeader.tsx
src/components/organisms/profile/ProfileStats.tsx
src/components/organisms/profile/ProfileAchievements.tsx
src/components/organisms/profile/ProfileActivity.tsx
src/components/organisms/profile/ProfileSetup.tsx
src/components/organisms/profile/ProfileSocialLinks.tsx
src/components/organisms/profile/ProfileCompleteness.tsx
src/app/[locale]/(routes)/dashboard/skaters/profile/social_media_form.tsx
```

### Modificar:
```
src/app/[locale]/(routes)/dashboard/skaters/profile/page.tsx
src/app/[locale]/(routes)/dashboard/skaters/profile/general_info_form.tsx
src/app/[locale]/(routes)/dashboard/skaters/profile/dream_setup.tsx
src/app/[locale]/(routes)/dashboard/profile/[email]/page.tsx
src/app/[locale]/(routes)/profile/[username]/page.tsx
messages/en.json (nuevas keys para completeness, empty states)
messages/es.json (traducciones correspondientes)
```

---

## ORDEN DE EJECUCIÓN RECOMENDADO

1. **Fase 4** (Fixes técnicos) - 30 min - Fix rápidos que mejoran calidad inmediatamente
2. **Fase 1** (Componentes compartidos) - 2-3 hrs - Base para todo lo demás
3. **Fase 2** (Perfil de edición) - 1-2 hrs - Mejora la experiencia del usuario que edita
4. **Fase 3** (Perfil público) - 1-2 hrs - Mejora lo que ven otros usuarios
5. **Fase 5** (Mejoras adicionales) - Opcional, hacer si hay tiempo

**Total estimado: 5-8 horas de trabajo**

---

## MOCKUP ASCII - Perfil Público Rediseñado

```
╔══════════════════════════════════════════════╗
║  ┌────┐                                     ║
║  │ 🖼️ │  SKATER_NAME           ⭐ 450 pts  ║
║  │    │  @username · 📍 Cali · 🛹 Team X   ║
║  └────┘  Skater · Member since Jan 2025     ║
║                                             ║
║  [123 Followers] [45 Following]             ║
║  [➕ Follow]  [🔗 Share]                     ║
╠══════════════════════════════════════════════╣
║                                             ║
║  ┌─────────┐ ┌─────────┐ ┌────────┐ ┌────┐ ║
║  │  450    │ │    8    │ │  85%   │ │ 3  │ ║
║  │ SCORE   │ │CHALLENGES│ │SUCCESS │ │STREAK║
║  └─────────┘ └─────────┘ └────────┘ └────┘ ║
║                                             ║
╠════════════════════╦═════════════════════════╣
║  🏆 ACHIEVEMENTS   ║  🛹 RECENT ACTIVITY     ║
║                    ║                         ║
║  🥇 First Try     ║  ✅ Kickflip  - 92pts   ║
║  🥈 On a Roll     ║  ❌ Heelflip            ║
║  🔒 Perfectionist ║  ⏳ Boardslide          ║
║                    ║                         ║
╠════════════════════╩═════════════════════════╣
║  🛹 DREAM SETUP                             ║
║  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐       ║
║  │Deck│ │Trk │ │Whl │ │Brng│ │Shoe│       ║
║  │Girl│ │Indp│ │Spit│ │Bone│ │Vans│       ║
║  └────┘ └────┘ └────┘ └────┘ └────┘       ║
║                                             ║
╠══════════════════════════════════════════════╣
║  🌐 SOCIAL MEDIA                            ║
║  [📷 Instagram] [🎵 TikTok] [𝕏 Twitter]    ║
╚══════════════════════════════════════════════╝
```

---

**Última actualización:** 19 de febrero 2026
