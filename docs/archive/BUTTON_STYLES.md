# 🎨 Guía Rápida de Estilos - MVP

Guía práctica de estilos para componentes comunes del proyecto.

---

## 🔴 REGLAS CRÍTICAS

### ❌ NUNCA usar gradientes en botones
```tsx
// ❌ MAL
className="bg-gradient-to-r from-cyan-500 to-purple-600 ..."

// ✅ BIEN
className="bg-cyan-600 hover:bg-cyan-700 ..."
```

---

## 🎯 Botones

### Botón Primario (Acción principal)
```tsx
<button className="bg-purple-600 hover:bg-purple-700 border-2 border-purple-400 text-white px-6 py-3 rounded-lg font-bold transition-all">
  Confirmar
</button>
```

### Botón Secundario (Info/Sistema)
```tsx
<button className="bg-cyan-600 hover:bg-cyan-700 border-2 border-cyan-400 text-white px-6 py-3 rounded-lg font-bold transition-all">
  Guardar cambios
</button>
```

### Botón de Éxito
```tsx
<button className="bg-green-600 hover:bg-green-700 border-2 border-green-400 text-white px-6 py-3 rounded-lg font-bold transition-all">
  Completado
</button>
```

### Botón de Peligro/Eliminar
```tsx
<button className="bg-red-600 hover:bg-red-700 border-2 border-red-400 text-white px-6 py-3 rounded-lg font-bold transition-all">
  Eliminar
</button>
```

### Botón de Advertencia
```tsx
<button className="bg-yellow-500 hover:bg-yellow-600 border-2 border-yellow-400 text-white px-6 py-3 rounded-lg font-bold transition-all">
  ¡Cuidado!
</button>
```

### Botón Neutral (Cancelar)
```tsx
<button className="bg-slate-200 hover:bg-slate-300 border-2 border-slate-400 text-slate-700 px-6 py-3 rounded-lg font-bold transition-all">
  Cancelar
</button>
```

### Botón Pequeño
```tsx
<button className="bg-purple-600 hover:bg-purple-700 border-2 border-purple-400 text-white px-3 py-1.5 rounded text-sm font-bold transition-all">
  Acción
</button>
```

### Botón con Icono
```tsx
<button className="bg-cyan-600 hover:bg-cyan-700 border-2 border-cyan-400 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
  <IconName className="w-4 h-4" />
  <span>Texto</span>
</button>
```

### Botón Deshabilitado
```tsx
<button
  disabled
  className="bg-slate-700 border-2 border-slate-600 text-slate-500 px-6 py-3 rounded-lg font-bold cursor-not-allowed opacity-60"
>
  No disponible
</button>
```

---

## 📝 Inputs y Textareas

### Input estándar
```tsx
<input
  type="text"
  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:border-cyan-400"
  placeholder="Escribe aquí..."
/>
```

### Input con error
```tsx
<input
  type="text"
  className="w-full px-4 py-3 bg-slate-900 border-2 border-red-500 rounded-lg text-white font-bold focus:outline-none focus:border-red-400"
  placeholder="Escribe aquí..."
/>
```

### Textarea
```tsx
<textarea
  rows={4}
  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:border-cyan-400 resize-none"
  placeholder="Escribe aquí..."
/>
```

---

## 📦 Cards y Contenedores

### Card estándar
```tsx
<div className="bg-slate-800 border-4 border-cyan-400 rounded-xl p-6 shadow-2xl shadow-cyan-500/30">
  <h3 className="text-2xl font-black uppercase text-cyan-400 mb-4">Título</h3>
  <p className="text-slate-300">Contenido...</p>
</div>
```

### Card con border purple
```tsx
<div className="bg-slate-800 border-4 border-purple-400 rounded-xl p-6 shadow-2xl shadow-purple-500/30">
  {/* contenido */}
</div>
```

### Card simple (sin shadow fuerte)
```tsx
<div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
  {/* contenido */}
</div>
```

---

## 💬 Mensajes de Estado

### Success
```tsx
<div className="bg-green-900/30 border-2 border-green-500 text-green-300 px-4 py-3 rounded-lg font-bold">
  ✅ Operación exitosa
</div>
```

### Error
```tsx
<div className="bg-red-900/30 border-2 border-red-500 text-red-300 px-4 py-3 rounded-lg font-bold">
  ❌ Error al procesar
</div>
```

### Warning
```tsx
<div className="bg-yellow-900/30 border-2 border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg font-bold">
  ⚠️ Advertencia
</div>
```

### Info
```tsx
<div className="bg-cyan-900/30 border-2 border-cyan-500 text-cyan-300 px-4 py-3 rounded-lg font-bold">
  ℹ️ Información
</div>
```

---

## 🏷️ Badges y Tags

### Badge sólido
```tsx
<span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
  Etiqueta
</span>
```

### Badge con outline
```tsx
<span className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs font-bold uppercase border border-purple-300">
  Etiqueta
</span>
```

### Badge pequeño
```tsx
<span className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
  Nuevo
</span>
```

---

## 📊 Tablas

### Tabla estándar
```tsx
<div className="overflow-x-auto">
  <table className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden">
    <thead className="bg-slate-900">
      <tr>
        <th className="px-4 py-3 text-left text-cyan-400 font-black uppercase text-sm">Columna 1</th>
        <th className="px-4 py-3 text-left text-cyan-400 font-black uppercase text-sm">Columna 2</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-700">
      <tr className="hover:bg-slate-700/50">
        <td className="px-4 py-3 text-slate-300">Dato 1</td>
        <td className="px-4 py-3 text-slate-300">Dato 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🎭 Loading States

### Spinner
```tsx
<div className="w-8 h-8 animate-spin border-4 border-cyan-400 border-t-transparent rounded-full" />
```

### Spinner pequeño
```tsx
<div className="w-4 h-4 animate-spin border-2 border-cyan-400 border-t-transparent rounded-full" />
```

### Skeleton
```tsx
<div className="animate-pulse bg-slate-700 rounded h-4 w-full" />
```

---

## 📱 Responsive

### Container con max-width
```tsx
<div className="max-w-7xl mx-auto px-4">
  {/* contenido */}
</div>
```

### Grid responsive
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* items */}
</div>
```

### Hide/Show por breakpoint
```tsx
<div className="hidden md:block">Visible solo en desktop</div>
<div className="block md:hidden">Visible solo en mobile</div>
```

---

## 🌈 Colores Comunes

### Backgrounds
```tsx
bg-slate-900      // Fondo oscuro principal
bg-slate-800      // Cards y contenedores
bg-slate-700      // Hover states
bg-purple-600     // Primary action
bg-cyan-600       // Secondary action
bg-green-600      // Success
bg-red-600        // Danger
bg-yellow-500     // Warning
```

### Textos
```tsx
text-white        // Texto principal
text-slate-300    // Texto secundario
text-slate-500    // Texto muted
text-cyan-400     // Títulos destacados
text-purple-400   // Títulos secundarios
text-green-400    // Success text
text-red-400      // Error text
```

### Borders
```tsx
border-cyan-400   // Primary borders
border-purple-400 // Secondary borders
border-green-400  // Success borders
border-red-400    // Error borders
border-slate-700  // Default borders
```

---

## ✨ Tips Rápidos

1. **Siempre usar `transition-all`** para hover states
2. **Botones siempre:** `font-bold` + `border-2` + `rounded`
3. **Inputs siempre:** `focus:outline-none` + `focus:border-*`
4. **Cards siempre:** `bg-slate-800` + `border-*` + `rounded`
5. **Textos importantes:** `font-black uppercase` + `text-transparent bg-clip-text bg-gradient-to-r`
6. **Shadows:** `shadow-2xl shadow-*500/30` para elementos destacados

---

## 🚫 Errores Comunes

❌ `className="bg-gradient..."` en botones
✅ `className="bg-purple-600 hover:bg-purple-700"`

❌ `className="border"` sin especificar grosor
✅ `className="border-2"`

❌ `className="rounded"` sin especificar tamaño
✅ `className="rounded-lg"`

❌ Inputs sin `focus:outline-none`
✅ `className="... focus:outline-none focus:border-cyan-400"`

---

**Última actualización:** Enero 2025
**Versión:** 1.0 - MVP
