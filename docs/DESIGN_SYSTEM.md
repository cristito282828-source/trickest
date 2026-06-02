# Trickest - Design System

## Acerca del Proyecto

**Trickest** es una plataforma de competencias de skateboarding donde skaters suben videos de trucos para completar desafíos de diferentes niveles de dificultad, y jueces calificados evalúan las presentaciones con puntuaciones y feedback.

### Concepto Visual
Diseño inspirado en **arcade retro-futurista** con elementos de gaming y cultura urbana del skateboarding. Combina estética de videojuegos clásicos con gradientes modernos y efectos glitch.

---

## Features Principales

### 🎮 Para Skaters
- **Registro Dual:** Google OAuth o email/password
- **Perfil Completo:** Información personal, dream setup de patineta, redes sociales
- **Sistema de Desafíos:** 10 niveles + 1 bonus challenge
- **Envío de Videos:** Sube videos de trucos como evidencia
- **Tracking de Progreso:** Seguimiento de submissions (pending → approved/rejected)
- **Scoring System:** Visualiza puntuaciones (0-100) y feedback de jueces
- **Leaderboards:** Compite con otros skaters
- **Teams:** Únete a equipos y colabora

### 👨‍⚖️ Para Jueces
- **Dashboard de Evaluación:** Interfaz dedicada para revisar submissions
- **Reproducción de Videos:** Player integrado para evaluar tricks
- **Sistema de Scoring:** Asigna puntuaciones de 0-100
- **Feedback Escrito:** Proporciona comentarios detallados
- **Dual Role:** Pueden participar también como skaters

### 🔐 Seguridad & Auth
- **NextAuth.js:** Autenticación robusta con JWT
- **Role-Based Access:** 3 roles (skater, judge, admin)
- **Profile Status:** Flujo guiado de completado de perfil
- **Bcrypt:** Hash seguro de contraseñas

### 📊 Social & Community
- **User Profiles:** Perfiles públicos con stats y achievements
- **Social Media Integration:** Links a Instagram, TikTok, Twitter, Facebook
- **Team System:** Equipos con scoring agregado
- **Achievement System:** (en desarrollo)

---

## Paleta de Colores

### Colores Primarios (Custom)

```css
/* Identidad de marca - Tonos cálidos/energéticos */
--watermelon: #F35588;      /* Rosa fuerte - Accent principal */
--melon: #FFBBB4;           /* Rosa suave - Accent secundario */
--budGreen: #71A95A;        /* Verde claro - Success/Active */
--dartmouthGreen: #007944;  /* Verde oscuro - Success dark */
--darkBg: #131424;          /* Fondo oscuro principal */
--arcadePurple: #8B5CF6;    /* Púrpura vibrante - Botones y accents */
```

**Uso:**
- `watermelon`: CTAs principales, highlights importantes
- `melon`: Hover states, fondos suaves
- `budGreen`: Estados activos, botones de confirmación
- `dartmouthGreen`: Bordes, estados hover de success
- `darkBg`: Fondo base de la aplicación
- `arcadePurple`: Botones principales, elementos destacados (sin degradado)

### Colores del Dashboard (Tailwind Extend)

#### Cyan - Sistema/Tech
```css
--cyan-300: #67e8f9;  /* Borders activos */
--cyan-400: #22d3ee;  /* Texto primario, iconos */
--cyan-500: #06b6d4;  /* Botones, gradientes */
```

#### Purple - Creatividad/Premium
```css
--purple-400: #c084fc;  /* Texto degradado */
--purple-500: #a855f7;  /* Gradientes medianos */
--purple-600: #9333ea;  /* Botones, fondos */
--purple-900: #581c87;  /* Fondos oscuros */
```

#### Pink - Energía/Action
```css
--pink-500: #ec4899;   /* Accent botones, hover */
```

#### Green/Teal - Success/Social
```css
--green-400: #4ade80;  /* Success light */
--green-500: #22c55e;  /* Success principal */
--teal-400: #2dd4bf;   /* Social hover */
--teal-500: #14b8a6;   /* Social principal */
```

#### Blue - Info/Tech
```css
--blue-500: #3b82f6;   /* Info, links */
--blue-900: #1e3a8a;   /* Fondos info */
```

#### Slate - Neutrales/Backgrounds
```css
--slate-400: #94a3b8;  /* Texto deshabilitado */
--slate-500: #64748b;  /* Placeholder text */
--slate-600: #475569;  /* Borders inactivos */
--slate-700: #334155;  /* Borders hover */
--slate-800: #1e293b;  /* Backgrounds de inputs */
--slate-900: #0f172a;  /* Backgrounds de cards */
```

### Gradientes Principales

```css
/* Cover gradient - Hero sections */
background: linear-gradient(90.21deg,
  rgba(170, 54, 124, 0.5) -5.91%,
  rgba(74, 47, 189, 0.5) 111.58%);

/* Dashboard backgrounds */
from-slate-900 via-purple-900 to-slate-900
from-purple-900 via-blue-900 to-black

/* Buttons & Cards */
from-cyan-500 to-purple-600      /* Header principal */
from-cyan-500 to-blue-500        /* Tab Info General */
from-purple-500 to-pink-500      /* Tab Dream Setup */
from-green-500 to-teal-500       /* Tab Redes Sociales */
```

---

## Sistema de Colores por Contexto

### Skater Dashboard
- **Primary:** Cyan (#22d3ee) - Representa tecnología y modernidad
- **Secondary:** Purple (#a855f7) - Creatividad y estilo
- **Accent:** Pink (#ec4899) - Energía y acción

### Judge Dashboard
- **Primary:** Purple (#9333ea) - Autoridad y juicio
- **Secondary:** Blue (#3b82f6) - Confianza y profesionalismo
- **Accent:** Cyan (#06b6d4) - Claridad

### States & Feedback
- **Success:** Green (#22c55e) - Submission approved, guardado exitoso
- **Error:** Red (#ef4444) - Fallos, rejected
- **Warning:** Yellow (#eab308) - Pending submissions
- **Info:** Blue (#3b82f6) - Tooltips, información adicional

### Social Media
- **Facebook:** Blue (#1877f2)
- **Instagram:** Pink/Purple gradient (#e1306c → #833ab4)
- **TikTok:** Teal (#00f2ea)
- **Twitter/X:** Black/Cyan (#000000 / #1da1f2)

---

## Tipografía

### Font Weights
```css
--font-normal: 400;
--font-bold: 700;
--font-black: 900;  /* Usado extensivamente para headers */
```

### Text Styles

#### Headers (Arcade Style)
```css
font-weight: 900;
text-transform: uppercase;
letter-spacing: 0.1em;
background: linear-gradient(to right, cyan, purple);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

#### Labels
```css
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.05em;
color: cyan-400;
```

#### Body Text
```css
font-weight: 400;
color: slate-300;
line-height: 1.6;
```

---

## Componentes Base

### Modales (Modal Patterns)

Los modales siguen un patrón consistente de gradiente vertical con color accent y glow matching.

#### Patrón Base
```tsx
// Estructura: fondo con gradiente via-{color} + border matching + shadow glow
bg-gradient-to-br from-slate-900 via-{color}-900 to-slate-900
border-4 border-{color}-400
shadow-2xl shadow-{color}-500/50
```

#### Modal Login (Cyan)
```tsx
<div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900
  border-4 border-cyan-400 rounded-xl shadow-2xl shadow-cyan-500/50 overflow-hidden">
  {/* Modal content */}
</div>
```

#### Modal Register (Pink)
```tsx
<div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-pink-900 to-slate-900
  border-4 border-pink-400 rounded-xl shadow-2xl shadow-pink-500/50 overflow-hidden">
  {/* Modal content */}
</div>
```

#### Modal Success/Welcome (Green)
```tsx
<div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 via-green-900 to-slate-900
  border-4 border-green-400 rounded-xl shadow-2xl shadow-green-500/50 overflow-hidden animate-fadeIn">
  {/* Modal content */}
</div>
```

#### Modal Warning (Yellow)
```tsx
<div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-black
  border-4 border-yellow-500 rounded-lg shadow-2xl shadow-yellow-500/50 relative">
  {/* Modal content */}
</div>
```

**Nota de Diseño:** El gradiente `via-{color}-900` crea un sutil glow interno que combina con el border y shadow externo, creando un efecto de neón cohesivo.

### Buttons (Arcade Style)

#### Login Button (Cyan-Blue)
```tsx
className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500
  hover:from-cyan-400 hover:to-blue-400
  text-white font-black uppercase tracking-wider text-lg rounded-lg
  border-4 border-cyan-300 shadow-lg shadow-cyan-500/50
  hover:shadow-cyan-400/70 transition-all transform hover:scale-105
  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
```

#### Register Button (Pink-Purple)
```tsx
className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500
  hover:from-pink-400 hover:to-purple-400
  text-white font-black uppercase tracking-wider text-lg rounded-lg
  border-4 border-pink-300 shadow-lg shadow-pink-500/50
  hover:shadow-pink-400/70 transition-all transform hover:scale-105
  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
```

#### Success Button (Green-Teal)
```tsx
className="bg-gradient-to-r from-green-500 to-teal-500
  hover:from-green-400 hover:to-teal-400
  text-white font-black py-4 px-12 rounded-lg
  border-4 border-white uppercase tracking-wider
  shadow-2xl transform hover:scale-105 transition-all"
```

#### Secondary Button (Purple-Pink)
```tsx
className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600
  hover:from-purple-500 hover:to-pink-500
  text-white font-black uppercase tracking-wider text-lg rounded-lg
  border-4 border-purple-400 shadow-lg shadow-purple-500/50
  hover:shadow-purple-400/70 transition-all transform hover:scale-105
  disabled:opacity-50 disabled:cursor-not-allowed"
```

**Patrón de Hover:** Los botones usan variantes -400 al hacer hover (100 unidades más claro) y aumentan la intensidad del glow shadow.

### Cards

#### Bordered Card (Neon Effect - Header Style)
```tsx
<div className="bg-gradient-to-r from-cyan-500 to-purple-600 p-1 rounded-lg shadow-2xl">
  <div className="bg-slate-900 rounded-lg p-6">
    <h1 className="text-3xl font-black text-transparent bg-clip-text
      bg-gradient-to-r from-cyan-400 to-purple-400 uppercase tracking-wider">
      🎮 PLAYER PROFILE
    </h1>
  </div>
</div>
```

#### Score Badge Card
```tsx
<div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 rounded-lg
  border-2 border-cyan-500 shadow-lg shadow-cyan-500/30
  hover:shadow-cyan-500/50 transition-all cursor-pointer hover:scale-105
  group relative">
  {/* Content */}
</div>
```

### Inputs

#### Standard Input (Cyan Focus)
```tsx
className="w-full px-4 py-3 bg-slate-800 border-2 border-cyan-500
  rounded-lg text-white font-bold
  focus:outline-none focus:border-cyan-300 focus:shadow-lg focus:shadow-cyan-500/50
  transition-all"
```

#### Input Pink Focus (Register Context)
```tsx
className="w-full px-4 py-3 bg-slate-800 border-2 border-pink-500
  rounded-lg text-white font-bold
  focus:outline-none focus:border-pink-300 focus:shadow-lg focus:shadow-pink-500/50
  transition-all"
```

#### Input Teal Focus (Social/Success Context)
```tsx
className="w-full bg-slate-800 border-4 border-slate-600
  rounded-lg py-3 px-4 text-white placeholder-slate-500
  focus:border-teal-500 focus:outline-none transition-all
  group-hover:border-teal-400"
```

**Patrón de Input:** Border de 2-4px con color contextual, focus agrega glow shadow matching.

### Tabs (Arcade Style)

#### Tab Active - Info General (Cyan-Blue)
```tsx
className="flex-1 py-4 px-6 font-black uppercase tracking-wider
  bg-gradient-to-r from-cyan-500 to-blue-500
  text-white shadow-lg shadow-cyan-500/50
  border-4 border-cyan-300 rounded-lg
  transition-all transform hover:scale-105"
```

#### Tab Active - Dream Setup (Purple-Pink)
```tsx
className="flex-1 py-4 px-6 font-black uppercase tracking-wider
  bg-gradient-to-r from-purple-500 to-pink-500
  text-white shadow-lg shadow-purple-500/50
  border-4 border-purple-300 rounded-lg
  transition-all transform hover:scale-105"
```

#### Tab Active - Social (Green-Teal)
```tsx
className="flex-1 py-4 px-6 font-black uppercase tracking-wider
  bg-gradient-to-r from-green-500 to-teal-500
  text-white shadow-lg shadow-green-500/50
  border-4 border-green-300 rounded-lg
  transition-all transform hover:scale-105"
```

#### Tab Inactive (Universal)
```tsx
className="flex-1 py-4 px-6 font-black uppercase tracking-wider
  bg-slate-800 text-slate-400
  border-4 border-slate-700 hover:border-cyan-500
  rounded-lg transition-all transform hover:scale-105"
```

**Sistema de Tabs:** Cada sección del dashboard tiene su propio gradiente identificador. Tabs inactivas usan slate con hover cyan universal.

---

## Animaciones

### Keyframes Disponibles

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Uso */
animation: fadeIn 0.3s ease-out;
```

### Transitions Comunes

```css
/* Hover effects */
transition-all        /* Para transforms y múltiples propiedades */
transform hover:scale-105  /* Efecto de crecimiento en hover */

/* Loading spinner */
animate-spin          /* Spinner de carga */
animate-pulse         /* Notificaciones */
```

---

## Shadows & Effects

### Box Shadows
```css
shadow-lg             /* Elevación media */
shadow-2xl            /* Elevación máxima */
shadow-cyan-500/50    /* Glow de neón cyan */
shadow-purple-500/50  /* Glow de neón purple */
```

### Glow Effects (para botones activos)
```tsx
className="shadow-lg shadow-cyan-500/50"  /* Cyan glow */
className="shadow-lg shadow-purple-500/50" /* Purple glow */
className="shadow-lg shadow-green-500/50"  /* Green glow */
```

---

## Responsive Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Patrones de Uso
```tsx
/* Mobile-first approach */
className="text-sm md:text-base lg:text-lg"  /* Typography */
className="p-4 md:p-6 lg:p-8"                /* Spacing */
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" /* Layout */
```

---

## Iconos & Emojis

### Uso de Emojis (Arcade Aesthetic)
```
🎮 Player/Profile
🛹 Skateboard/Setup
👤 User Info
🌐 Social Media
💾 Save
⏳ Loading
✅ Success
❌ Error
📘 Facebook
📷 Instagram
🎵 TikTok
𝕏 Twitter
🏆 Achievements
🎯 Challenges
📊 Stats
```

---

## Patrones de Layout

### Dashboard Layout
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
  {/* Header */}
  <div className="max-w-7xl mx-auto mb-8">
    {/* Bordered header card */}
  </div>

  {/* Tabs */}
  <div className="max-w-7xl mx-auto mb-6">
    {/* Tab buttons */}
  </div>

  {/* Content */}
  <div className="max-w-7xl mx-auto">
    {/* Tab content with fadeIn animation */}
  </div>
</div>
```

### Max Width Container
```tsx
className="max-w-7xl mx-auto" /* Contenedor principal */
```

---

## Accesibilidad

### Contraste de Colores
- Todos los pares texto/fondo cumplen WCAG AA mínimo
- Cyan (#22d3ee) sobre slate-900 (#0f172a): ✅ AAA
- White sobre cyan-500 (#06b6d4): ✅ AAA
- Slate-400 sobre darkBg: ✅ AA

### Focus States
```tsx
focus:border-cyan-500 focus:outline-none  /* Input focus */
focus:ring-4 focus:ring-cyan-500/50       /* Button focus */
```

---

## Convenciones de Clases

### Orden de Clases Tailwind (Recomendado)
1. Layout (flex, grid, block)
2. Positioning (relative, absolute, top, left)
3. Display & Box Model (w-, h-, p-, m-)
4. Typography (text-, font-)
5. Visual (bg-, border-, shadow-)
6. Interaction (hover:, focus:, transition-)

### Ejemplo:
```tsx
className="flex items-center justify-center w-full h-16 px-4 py-2
  text-lg font-black uppercase bg-gradient-to-r from-cyan-500 to-purple-600
  border-4 border-white rounded-lg shadow-2xl
  hover:scale-105 transition-all"
```

---

## Referencias de Diseño

### Inspiración Visual
- Diseño arcade de los 80s/90s
- Synthwave/Retrowave aesthetic
- Cultura urbana de skateboarding
- UI de videojuegos modernos (Fighting games, Racing games)
- Neon signs y efectos de glow

### Librerías Visuales
- **TSParticles:** Efectos de partículas en landing
- **Framer Motion:** Animaciones y transiciones
- **NextUI:** Componentes base con a11y
- **Lucide React:** Iconos modernos
- **React Icons:** Iconos complementarios

---

## Quick Reference: Colores por Uso

| Elemento | Color | Clase Tailwind |
|----------|-------|----------------|
| Fondo app | #131424 | `bg-darkBg` |
| CTA Principal | Gradient | `bg-gradient-to-r from-cyan-500 to-purple-600` |
| Success | #22c55e | `text-green-500` / `bg-green-500` |
| Error | #ef4444 | `text-red-500` / `bg-red-500` |
| Warning | #eab308 | `text-yellow-500` / `bg-yellow-500` |
| Info | #3b82f6 | `text-blue-500` / `bg-blue-500` |
| Link | #22d3ee | `text-cyan-400` |
| Texto principal | #e2e8f0 | `text-slate-200` |
| Texto secundario | #94a3b8 | `text-slate-400` |
| Border activo | #67e8f9 | `border-cyan-300` |
| Border inactivo | #475569 | `border-slate-600` |
| Input bg | #1e293b | `bg-slate-800` |
| Card bg | #0f172a | `bg-slate-900` |

---

## Tabla de Referencia Rápida: Patrones de Color

### Gradientes de Modales (Vertical)

| Contexto | Background Gradient | Border | Shadow Glow |
|----------|-------------------|--------|-------------|
| Login | `from-slate-900 via-purple-900 to-slate-900` | `border-cyan-400` | `shadow-cyan-500/50` |
| Register | `from-slate-900 via-pink-900 to-slate-900` | `border-pink-400` | `shadow-pink-500/50` |
| Welcome/Success | `from-slate-900 via-green-900 to-slate-900` | `border-green-400` | `shadow-green-500/50` |
| Warning | `from-slate-900 to-black` | `border-yellow-500` | `shadow-yellow-500/50` |
| General | `from-slate-900 to-black` | `border-cyan-400` | `shadow-cyan-500/50` |

### Gradientes de Botones (Horizontal)

| Tipo | Gradiente Base | Hover | Border | Shadow |
|------|---------------|-------|--------|--------|
| Login | `from-cyan-500 to-blue-500` | `from-cyan-400 to-blue-400` | `border-cyan-300` | `shadow-cyan-500/50` |
| Register | `from-pink-500 to-purple-500` | `from-pink-400 to-purple-400` | `border-pink-300` | `shadow-pink-500/50` |
| Success/Save | `from-green-500 to-teal-500` | `from-green-400 to-teal-400` | `border-white` | `shadow-green-500/50` |
| Secondary Purple | `from-purple-600 to-pink-600` | `from-purple-500 to-pink-500` | `border-purple-400` | `shadow-purple-500/50` |
| Secondary Cyan | `from-purple-600 to-cyan-600` | `from-purple-500 to-cyan-500` | `border-purple-400` | `shadow-purple-500/50` |

### Gradientes de Tabs (Horizontal)

| Tab | Gradiente | Border | Shadow | Contexto |
|-----|-----------|--------|--------|----------|
| Info General | `from-cyan-500 to-blue-500` | `border-cyan-300` | `shadow-cyan-500/50` | Datos personales |
| Dream Setup | `from-purple-500 to-pink-500` | `border-purple-300` | `shadow-purple-500/50` | Configuración skate |
| Redes Sociales | `from-green-500 to-teal-500` | `border-green-300` | `shadow-green-500/50` | Social media |
| Inactive | `bg-slate-800` | `border-slate-700` | none | Universal |

### Inputs por Contexto

| Contexto | Border Color | Focus Border | Focus Shadow |
|----------|-------------|--------------|--------------|
| General/Login | `border-cyan-500` | `border-cyan-300` | `shadow-cyan-500/50` |
| Register | `border-pink-500` | `border-pink-300` | `shadow-pink-500/50` |
| Social/Success | `border-slate-600` | `border-teal-500` | none |

### Backgrounds de Layout

| Tipo | Gradiente | Uso |
|------|-----------|-----|
| Dashboard Pages | `from-slate-900 via-purple-900 to-slate-900` | Skater/Judge dashboards |
| Loading Screens | `from-purple-900 via-blue-900 to-black` | Pantallas de carga |
| Headers | `from-cyan-500 to-purple-600` (p-1 wrapper) | Headers principales |

## Notas de Implementación

1. **Siempre usar gradientes para headers importantes** - Crea jerarquía visual
2. **Borders de 4px** - Mantiene la estética arcade/chunky
3. **Uppercase + tracking-wider** - Para títulos y botones principales
4. **Transform hover:scale-105** - Añade interactividad a elementos clickeables
5. **Shadow glows** - Usar con moderación, solo en elementos activos/importantes
6. **Mobile-first** - Diseñar primero para móvil, luego escalar
7. **Animaciones sutiles** - No abusar, máximo 0.3-0.5s de duración
8. **Matching colors** - Border, shadow y via-gradient deben usar la misma familia de color
9. **Hover states** - Usar variante -400 (100 unidades más claro) en hover
10. **Patrón Modal** - `via-{color}-900` en background + `border-{color}-400` + `shadow-{color}-500/50`

---

## Tips de Uso

1. **Jerarquía Visual:**
   - Headers: Gradientes cyan-to-purple
   - Subheaders: Color sólido cyan-400
   - Body: slate-300 o slate-400

2. **Estados Interactivos:**
   - Hover: Versión -400 del color (-100 más claro)
   - Active: Versión -600 del color (-100 más oscuro)
   - Disabled: slate-400 con opacity-50

3. **Contraste:**
   - Texto claro (white/slate-50) sobre fondos oscuros (slate-800/900)
   - Texto oscuro (slate-900) sobre fondos claros (white/slate-50)
   - Nunca usar slate-400 sobre slate-600 (bajo contraste)

4. **Gradientes:**
   - Siempre de izquierda a derecha: `from-X to-Y`
   - Máximo 2 colores por gradiente
   - Usar en headers, botones principales, borders de cards

5. **Glow/Shadow:**
   - Solo en elementos activos o muy importantes
   - Usar el color base + `/50` de opacidad
   - Combinar con `shadow-lg` o `shadow-2xl`

---

## Export para Diseñadores

### Figma / Sketch
```
Brand Colors:
#F35588 - Watermelon
#FFBBB4 - Melon
#71A95A - Bud Green
#007944 - Dartmouth Green
#131424 - Dark Background

Primary Palette:
#22d3ee - Cyan
#a855f7 - Purple
#22c55e - Green
#ef4444 - Red
#3b82f6 - Blue

Neutrals:
#0f172a - Slate 900 (Dark)
#1e293b - Slate 800
#475569 - Slate 600
#94a3b8 - Slate 400
#f8fafc - Slate 50 (Light)
```

### CSS Variables (Optional)
```css
:root {
  /* Brand */
  --color-watermelon: #F35588;
  --color-melon: #FFBBB4;
  --color-bud-green: #71A95A;
  --color-dartmouth-green: #007944;
  --color-dark-bg: #131424;

  /* Primary */
  --color-cyan: #22d3ee;
  --color-purple: #a855f7;
  --color-green: #22c55e;
  --color-red: #ef4444;

  /* Neutrals */
  --color-slate-900: #0f172a;
  --color-slate-800: #1e293b;
  --color-slate-600: #475569;
  --color-slate-400: #94a3b8;
}
```

---

## Version History

- **v1.1** (Diciembre 2024) - Consolidación con COLOR_PALETTE.md, agregados Tips de Uso y Export para Diseñadores
- **v1.0** (2024) - Design system inicial arcade/retro-futurista
