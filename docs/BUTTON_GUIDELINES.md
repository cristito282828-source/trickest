# Guía de Botones - Trickest

## ⚠️ REGLA CRÍTICA: NO MÁS DEGRADADOS EN BOTONES

**TODOS los elementos interactivos (`<button>`, `<a>` de acción) DEBEN usar colores sólidos.**

### ❌ Prohibido en Botones:
- `bg-gradient-to-r`, `bg-gradient-to-l`, `bg-gradient-to-t`, `bg-gradient-to-b`
- `from-*` combinado con `to-*` en elementos clickeables
- Degradados con `hover:from-*` y `hover:to-*`

### ✅ Degradados Permitidos SOLO en:
- **Textos:** Con `text-transparent bg-clip-text bg-gradient-to-r from-* to-*`
- **Bordes decorativos:** En `<div>` no interactivos que actúan como marco
- **Fondos de contenedores:** Cards, secciones, headers
- **Elementos visuales:** Badges de dificultad, indicadores de estado (no clickeables)

---

## 🎨 Paleta de Colores para Botones

### Acciones Principales
| Color | Uso | Clase Base | Clase Hover | Cuándo Usar |
|-------|-----|------------|-------------|-------------|
| **Purple** | Acción principal | `bg-purple-600` | `hover:bg-purple-700` | CTAs generales, "Ver", "Iniciar" |
| **Cyan** | Información/Sistema | `bg-cyan-500` | `hover:bg-cyan-600` | "Ver más", "Info", acciones secundarias |
| **Yellow** | Destacado/Importante | `bg-yellow-500` | `hover:bg-yellow-600` | "Evaluar", "Submit", acciones críticas |

### Acciones de Estado
| Color | Uso | Clase Base | Clase Hover | Cuándo Usar |
|-------|-----|------------|-------------|-------------|
| **Green** | Confirmación/Aprobar | `bg-green-500` | `hover:bg-green-600` | "Aprobar", "Confirmar", "Guardar" |
| **Red** | Peligro/Rechazar | `bg-red-500` | `hover:bg-red-600` | "Eliminar", "Cancelar", "Rechazar" |
| **Pink** | Especial | `bg-pink-500` | `hover:bg-pink-600` | Acciones premium o destacadas |

### Botones Inactivos/Secundarios
| Color | Uso | Clase Base | Clase Hover | Cuándo Usar |
|-------|-----|------------|-------------|-------------|
| **Slate** | Inactivo/Neutral | `bg-slate-800` | `hover:bg-slate-700` | Tabs inactivos, opciones secundarias |
| **Slate Dark** | Muy secundario | `bg-slate-700` | `hover:bg-slate-600` | Acciones terciarias |

### Plantilla Base
```tsx
// Siempre usar este formato:
className="bg-{color}-{intensity} hover:bg-{color}-{intensity+100} text-white"

// Ejemplo:
className="bg-purple-600 hover:bg-purple-700 text-white"
```

---

## 📋 Componentes de Botones Disponibles

### 1. Button.tsx (Atómico) - PREFERRED
Ubicación: `src/components/atoms/Button.tsx`

```tsx
import { Button } from '@/components/atoms';

// Uso basico
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

// Con iconos y loading
<Button variant="success" size="lg" leftIcon={<Check />} isLoading={saving}>
  Save
</Button>

// Full width
<Button variant="warning" size="xl" fullWidth>
  SUBMIT TRICK
</Button>

// Sin arcade border (subtle)
<Button variant="primary" arcadeBorder={false}>
  Cancel
</Button>
```

**Variantes disponibles:**
```
variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'purple' | 'pink'
size: 'sm' | 'md' | 'lg' | 'xl'
```

**Props adicionales:**
- `fullWidth`: boolean - Makes button w-full
- `arcadeBorder`: boolean (default: true) - border-4 + shadow-2xl vs border-2 + shadow-lg
- `isLoading`: boolean - Shows spinner, disables button
- `leftIcon` / `rightIcon`: ReactNode - Icon slots

**Variantes y sus colores:**
- `primary`: accent-cyan-500 hover accent-cyan-600
- `secondary`: neutral-700 hover neutral-600
- `danger`: red-500 hover red-600
- `success`: green-500 hover green-600
- `warning`: accent-yellow-500 hover accent-yellow-600
- `purple`: accent-purple-600 hover accent-purple-700
- `pink`: accent-pink-500 hover accent-pink-600

### 2. IconButton.tsx
Para botones con solo íconos.

### 3. FloatingButton.tsx
Para botones flotantes circulares.

---

## ✅ Ejemplos Correctos

### Botón de Acción Principal
```tsx
<button className="bg-purple-600 hover:bg-purple-700 text-white font-black py-4 px-8 rounded-lg border-4 border-white uppercase tracking-wider shadow-2xl transform hover:scale-105 transition-all">
  START CHALLENGE
</button>
```

### Botón de Submit
```tsx
<button className="bg-yellow-500 hover:bg-yellow-600 text-white font-black py-3 px-6 rounded-lg border-4 border-white uppercase tracking-wider shadow-2xl transform hover:scale-105 transition-all">
  📹 Submit Your Video
</button>
```

### Botón de Evaluación
```tsx
<button className="bg-yellow-500 hover:bg-yellow-600 text-white font-black py-4 px-6 rounded-lg border-4 border-white uppercase tracking-wider text-lg shadow-2xl transform hover:scale-105 transition-all">
  📝 EVALUAR
</button>
```

### Tabs Activos
```tsx
<button
  className={`py-3 px-6 rounded-lg font-black uppercase tracking-wider transition-all ${
    isActive
      ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-4 border-white shadow-2xl'
      : 'bg-slate-800 text-slate-400 border-4 border-slate-700 hover:border-slate-500'
  }`}
>
  Tab Label
</button>
```

---

## ❌ Ejemplos INCORRECTOS (No usar)

### ❌ Degradados en botones
```tsx
// ❌ MAL - NO USAR
<button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400">
  Botón con degradado
</button>

// ✅ CORRECTO
<button className="bg-yellow-500 hover:bg-yellow-600">
  Botón con color sólido
</button>
```

### ❌ Múltiples degradados en hover
```tsx
// ❌ MAL - NO USAR
<button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500">
  Botón
</button>

// ✅ CORRECTO
<button className="bg-purple-600 hover:bg-purple-700">
  Botón
</button>
```

---

## 🔍 Validación Automática

### Script de Validación
Ejecuta este comando para detectar botones con degradados:

```bash
npm run validate:buttons
```

Este script escanea automáticamente:
- Todos los archivos `.tsx`, `.jsx`, `.ts`, `.js` en `src/`
- Busca patrones prohibidos: `bg-gradient-to-*` en botones
- Reporta ubicación exacta (archivo y línea)
- Muestra snippets del código problemático

### Ejecución Manual
```bash
# Detectar todos los degradados en botones
node scripts/validate-button-styles.js

# Salida esperada si todo está bien:
# ✅ ¡Excelente! No se encontraron botones con degradados.

# Salida si hay problemas:
# ❌ Se encontraron N problema(s) en M archivo(s):
# [Lista de archivos con líneas específicas]
```

### Integración con Git Hooks (Opcional)
Para prevenir commits con degradados:

1. Instala husky:
```bash
npm install --save-dev husky
npx husky install
```

2. Agrega pre-commit hook:
```bash
npx husky add .husky/pre-commit "npm run validate:buttons"
```

---

## 🛠️ Migración de Código Legacy

### Proceso de Migración

1. **Ejecuta el validador:**
   ```bash
   npm run validate:buttons
   ```

2. **Para cada botón reportado:**
   - Identifica el color dominante del degradado (el primer color en `from-*`)
   - Reemplaza con color sólido
   - Ajusta hover sumando +100 a la intensidad

3. **Tabla de Conversión Rápida:**

| Degradado Original | Color Sólido Equivalente |
|-------------------|--------------------------|
| `from-yellow-500 to-orange-500` | `bg-yellow-500 hover:bg-yellow-600` |
| `from-purple-500 to-pink-500` | `bg-purple-600 hover:bg-purple-700` |
| `from-cyan-500 to-blue-500` | `bg-cyan-500 hover:bg-cyan-600` |
| `from-green-500 to-teal-500` | `bg-green-500 hover:bg-green-600` |
| `from-red-500 to-pink-500` | `bg-red-500 hover:bg-red-600` |
| `from-pink-500 to-purple-500` | `bg-pink-500 hover:bg-pink-600` |

### Ejemplos de Migración

**Ejemplo 1: Botón de Submit**
```tsx
// ❌ Antes (42 caracteres de degradado)
className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400"

// ✅ Después (30 caracteres, más simple)
className="bg-yellow-500 hover:bg-yellow-600"
```

**Ejemplo 2: Botón de Login**
```tsx
// ❌ Antes
className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"

// ✅ Después
className="bg-cyan-500 hover:bg-cyan-600"
```

**Ejemplo 3: Tab Activo**
```tsx
// ❌ Antes
className={`${active
  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400'
  : 'bg-slate-800'
}`}

// ✅ Después
className={`${active
  ? 'bg-purple-600 hover:bg-purple-700'
  : 'bg-slate-800'
}`}
```

### Priorización de Migración

**Alta prioridad** (migrar primero):
1. Componentes de autenticación (Login, Register, SetPassword)
2. Botones de formularios (Submit, Guardar, Enviar)
3. CTAs principales (START CHALLENGE, Ver Perfil)

**Media prioridad:**
4. Tabs y navegación
5. Botones de perfil
6. Modales y diálogos

**Baja prioridad:**
7. Páginas de exploración
8. Componentes de ejemplo/test

---

## 📚 Recursos Adicionales

- **Design System:** `docs/DESIGN_SYSTEM.md`
- **Componentes Atomic:** `src/components/atoms/`
- **Tailwind Config:** `tailwind.config.ts`

---

## 🚨 Checklist Pre-Commit

Antes de hacer commit, verifica:

- [ ] Ejecutaste `npm run validate:buttons` y pasó sin errores
- [ ] No hay `bg-gradient-to-r` en ningún `<button>` o `<a>` de acción
- [ ] Todos los botones usan colores sólidos con hover
- [ ] Los componentes usan Button.tsx cuando es posible
- [ ] Los colores siguen la paleta establecida
- [ ] El hover es siempre +100 en la escala de intensidad

---

## 📊 Estado Actual del Proyecto

### Progreso de Migración
Última verificación: **Enero 2026**

```bash
# Ejecuta para ver estado actual:
npm run validate:buttons
```

**Migration Status: COMPLETE**

All interactive buttons now use the Button atom component (21 buttons migrated across 17 files).

**Last migration:** March 2026 - commit 2cba117

### Comando de Validación
```bash
# Ver todos los archivos con problemas
npm run validate:buttons

# Contar problemas restantes
npm run validate:buttons | grep -c "Línea"
```

---

## 🎯 Objetivo

**Meta:** 0 botones con degradados en todo el proyecto

**Estado actual:** En progreso - Migración gradual

**Próximos pasos:**
1. Migrar componentes de autenticación
2. Actualizar formularios principales
3. Ajustar modales y diálogos
4. Refactorizar navegación y tabs

---

**Última actualización:** Enero 2026
**Mantenido por:** Equipo de Desarrollo Trickest
**Validador:** `npm run validate:buttons`
