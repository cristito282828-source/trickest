# 🚨 SOLUCIÓN RÁPIDA: Login con Credenciales Falla en Producción

## Problema
✅ Google OAuth funciona
❌ Login con email/password NO funciona (admin@trickest.com)

---

## ⚡ SOLUCIÓN EN 3 PASOS

### 1️⃣ Verifica el Usuario Admin en Supabase

**Abre:** [Supabase Dashboard](https://supabase.com) → Tu Proyecto → Table Editor → Tabla `User`

**Busca:** `admin@trickest.com`

**¿Existe el usuario?**
- ✅ **SÍ** → Ve al paso 2
- ❌ **NO** → Ejecuta este SQL en Supabase SQL Editor:

```sql
INSERT INTO "User" (email, name, password, role, "profileStatus", "createdAt")
VALUES (
  'admin@trickest.com',
  'Admin Trickest',
  '$2b$10$5bOPyRUlePhp/G23DzwO7e0LY0qYI0vGx0dZQJ0YqYKZKJZ0vGx0d',
  'admin',
  'complete',
  NOW()
);
```

### 2️⃣ Verifica el Campo `password`

**En la tabla User, mira la columna `password` para admin@trickest.com**

**¿El campo password tiene un valor?**
- ✅ **SÍ** (empieza con `$2b$`) → Ve al paso 3
- ❌ **NO** (es NULL) → Ejecuta este SQL:

```sql
UPDATE "User"
SET password = '$2b$10$5bOPyRUlePhp/G23DzwO7e0LY0qYI0vGx0dZQJ0YqYKZKJZ0vGx0d'
WHERE email = 'admin@trickest.com';
```

### 3️⃣ Verifica Variables de Entorno en Vercel

**Abre:** [Vercel Dashboard](https://vercel.com) → Tu Proyecto → Settings → Environment Variables

**Verifica estas 2 variables:**

```bash
✅ NEXTAUTH_URL=https://tu-dominio.vercel.app
   # ⚠️ SIN slash final
   # ⚠️ Debe ser tu dominio exacto de producción

✅ NEXTAUTH_SECRET=<string-de-32-caracteres>
   # ⚠️ Debe existir
   # ⚠️ Genera uno nuevo si no existe: openssl rand -base64 32
```

**Si hiciste cambios:** Click en "Redeploy" en el dashboard de Vercel

---

## 🧪 Prueba el Login

1. Ve a tu sitio de producción: `https://tu-dominio.vercel.app`
2. Click en "Login"
3. Usa credenciales:
   - Email: `admin@trickest.com`
   - Password: `password123`
4. ✅ Debería funcionar

---

## 🔍 Si Aún No Funciona

### Ver Logs en Tiempo Real

**Opción 1: Vercel CLI**
```bash
npm i -g vercel
vercel logs --follow
```

**Opción 2: Vercel Dashboard**
- Ve a tu proyecto en Vercel
- Click en "Logs"
- Intenta hacer login
- Busca líneas que empiecen con `🔐 [AUTH]`

### Ejecutar Script de Test

**Conecta a tu BD de producción:**
```bash
# Cambia DATABASE_URL en .env a la de producción temporalmente
# Luego ejecuta:
node scripts/test-credentials-auth.js
```

Este script te dirá exactamente qué está mal.

---

## 📚 Documentación Completa

Para más detalles, lee: **[PRODUCTION_AUTH_DEBUG.md](./PRODUCTION_AUTH_DEBUG.md)**

---

## ✅ Checklist Rápido

- [ ] Usuario `admin@trickest.com` existe en tabla User de Supabase
- [ ] Campo `password` NO es NULL (debe empezar con `$2b$`)
- [ ] `NEXTAUTH_URL` configurado en Vercel (sin slash final)
- [ ] `NEXTAUTH_SECRET` configurado en Vercel
- [ ] Redesployé el proyecto después de cambios
- [ ] Probé el login en producción

---

**Hash correcto para password123:**
```
$2b$10$5bOPyRUlePhp/G23DzwO7e0LY0qYI0vGx0dZQJ0YqYKZKJZ0vGx0d
```

**Última actualización:** Enero 2026
