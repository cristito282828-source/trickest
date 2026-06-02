# 📚 Documentación - Trickest

Índice de documentación del proyecto Trickest.

---

## 📖 Documentos Disponibles

### 🎨 [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
**Sistema de diseño completo de Trickest**

Contenido:
- Paleta de colores (Watermelon, Melon, Bud Green, etc.)
- Tipografía y jerarquías
- Componentes UI (cards, buttons, modals, tabs)
- Gradientes y efectos glow
- Animaciones y transiciones
- Responsive design patterns
- Arcade/retro-futurista aesthetic

**Cuándo consultar:** Al crear cualquier componente UI nuevo

---

### 🔘 [BUTTON_GUIDELINES.md](BUTTON_GUIDELINES.md) ⚠️ **IMPORTANTE**
**Guía de estilos para botones - Reglas críticas**

Contenido:
- ❌ **REGLA CRÍTICA:** NO usar degradados en botones
- ✅ Paleta de colores aprobados para botones
- Tabla de conversión de degradados → colores sólidos
- Script de validación: `npm run validate:buttons`
- Ejemplos correctos e incorretos
- Proceso de migración de código legacy

**Cuándo consultar:**
- SIEMPRE antes de crear un botón
- Al revisar código con botones
- Al migrar componentes legacy

**Validación:**
```bash
npm run validate:buttons
```

---

## 🚀 Quick Start

### Para Nuevos Desarrolladores

1. **Lee primero:** [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) - Entender la estética visual
2. **Regla crítica:** [BUTTON_GUIDELINES.md](BUTTON_GUIDELINES.md) - NO degradados en botones
3. **Valida tu código:**
   ```bash
   npm run validate:buttons
   ```

### Para Code Review

Checklist mínimo:
- [ ] ¿Sigue el design system? (colores, tipografía, spacing)
- [ ] ¿Los botones usan colores sólidos? (NO degradados)
- [ ] ¿Ejecutó `npm run validate:buttons`?
- [ ] ¿Usa componentes atómicos cuando es posible?

---

## 🛠️ Herramientas

### Scripts de Validación

```bash
# Validar estilos de botones (detecta degradados)
npm run validate:buttons

# Generar iconos
npm run generate:icons
```

---

## 📝 Convenciones de Código

### Colores de Botones (Quick Reference)

| Acción | Color |
|--------|-------|
| Principal | `bg-purple-600 hover:bg-purple-700` |
| Información | `bg-cyan-500 hover:bg-cyan-600` |
| Destacado | `bg-yellow-500 hover:bg-yellow-600` |
| Aprobar | `bg-green-500 hover:bg-green-600` |
| Rechazar | `bg-red-500 hover:bg-red-600` |

**Formato siempre:**
```tsx
className="bg-{color}-{intensity} hover:bg-{color}-{intensity+100} text-white"
```

### Estructura Atomic Design

```
src/components/
├── atoms/          # Elementos básicos (Button, Input, Icon)
├── molecules/      # Combinaciones simples (UserBadge, Navbar)
├── organisms/      # Secciones complejas (ChallengeCard, Modal)
└── templates/      # Layouts de página
```

---

## 🎯 Reglas de Oro

1. **NO degradados en botones** - Solo colores sólidos
2. **Consulta DESIGN_SYSTEM.md** antes de crear UI
3. **Usa Atomic Design** para organizar componentes
4. **Valida con scripts** antes de commit
5. **Arcade aesthetic** - Thick borders (4px), uppercase, neon effects

---

## 🔗 Referencias Rápidas

- **Archivo principal:** `CLAUDE.md` (en raíz del proyecto)
- **Tailwind Config:** `tailwind.config.ts`
- **Componentes Atoms:** `src/components/atoms/`
- **Prisma Schema:** `prisma/schema.prisma`

---

## 📊 Estado del Proyecto

### Migraciones en Progreso

- ✅ Botones en HomeLevelSection
- ✅ Botones en ChallengeCard
- ✅ Tabs en Judges evaluate
- ⏳ Formularios de autenticación (42 botones pendientes)
- ⏳ Perfiles y modales

**Ver estado completo:** [BUTTON_GUIDELINES.md - Estado Actual](BUTTON_GUIDELINES.md#-estado-actual-del-proyecto)

---

**Última actualización:** Enero 2026
**Mantenido por:** Equipo de Desarrollo Trickest
