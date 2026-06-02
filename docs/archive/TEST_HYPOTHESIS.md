# 🔬 Hipótesis del Problema: Bcrypt en Vercel Serverless

## Problema Actual
- ✅ Funciona en local (Node.js normal)
- ❌ Falla en producción (Vercel Serverless)
- ✅ Google OAuth funciona (no usa bcrypt)
- ❌ Credenciales fallan (usa bcrypt.compare)

## 💡 Hipótesis Principal: Bcrypt + Serverless Functions

Vercel ejecuta Next.js en **serverless functions** (AWS Lambda). Bcrypt es un módulo **nativo** que puede tener problemas en entornos serverless.

### Síntomas que coinciden:
1. Error 401 sin logs de nuestro código
2. Google funciona (no usa módulos nativos complicados)
3. Mismo código y BD funcionan en local

### Posibles causas:

#### 1. Bcrypt no se compila correctamente en Vercel
**Por qué:** Bcrypt necesita compilarse para la arquitectura de AWS Lambda (Linux x64), no para tu máquina local.

**Solución:** Usar `bcryptjs` (versión JavaScript pura, sin código nativo)

#### 2. Timeout en bcrypt.compare() en serverless
**Por qué:** Bcrypt es CPU-intensive y las funciones serverless tienen límites de tiempo.

**Solución:** Aumentar timeout o usar bcryptjs

#### 3. Import dinámico de bcrypt falla en producción
**Por qué:** El lazy loading `await import('bcrypt')` puede fallar en serverless.

**Solución:** Import estático o cambiar a bcryptjs

## 🧪 Prueba Rápida: Cambiar a bcryptjs

### Paso 1: Instalar bcryptjs
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### Paso 2: Cambiar import en auth.ts
```typescript
// ANTES (bcrypt nativo):
const bcrypt = await import('bcrypt');

// DESPUÉS (bcryptjs puro JavaScript):
const bcryptjs = await import('bcryptjs');
```

### Paso 3: Deploy y probar

Si esto funciona, confirma que el problema era bcrypt en serverless.

---

## 🎯 Otras Posibilidades (menos probables)

### Posibilidad 2: DATABASE_URL con pgbouncer en serverless
**Síntoma:** Conexiones pooling pueden fallar en serverless.
**Prueba:** Cambiar temporalmente a DIRECT_URL (puerto 5432) en Vercel.

### Posibilidad 3: Vercel está usando código cacheado viejo
**Síntoma:** Los logs nuevos no aparecen.
**Solución:** Borrar `.vercel` cache y redeploy desde cero.

### Posibilidad 4: Variables de entorno no se están propagando
**Síntoma:** NEXTAUTH_SECRET diferente entre requests.
**Prueba:** Agregar más logs para verificar que las variables son las mismas.

---

## 📊 Próximo Paso Recomendado

**PROBAR BCRYPTJS PRIMERO** (5 minutos):

```bash
# 1. Instalar
npm install bcryptjs @types/bcryptjs

# 2. Cambiar en src/lib/auth.ts (línea 20 y 36):
const bcrypt = await import('bcryptjs'); // en lugar de 'bcrypt'

# 3. Commit y push
git add package.json package-lock.json src/lib/auth.ts
git commit -m "fix: switch to bcryptjs for serverless compatibility"
git push

# 4. Esperar deploy (1-2 min)
# 5. Probar login
```

Si esto funciona, **problema resuelto**. Bcrypt nativo no es compatible con Vercel serverless.

---

## 🔍 Cómo Confirmar

**Después de cambiar a bcryptjs:**

1. Ve a Vercel Logs
2. Intenta login
3. Deberías ver AHORA los logs `🔐 [AUTH]` completos
4. Login debería funcionar

**Si aún falla con bcryptjs:**
- El problema NO es bcrypt
- Volvemos a investigar otras causas (DATABASE_URL, cache, etc.)
