# 🚨 FIX RÁPIDO: Error 401 en /api/auth/callback/credentials

## Tu Situación
- ✅ Google OAuth funciona
- ❌ Credenciales dan 401 Unauthorized
- ✅ Funciona en local
- ✅ Misma base de datos
- ✅ Usuario admin existe en BD
- ✅ NEXTAUTH_SECRET correcto: `N8CO8NBNptWX1S3feFbC3pNjsaLvQRIyijNLAYd5Clg=`

## 🎯 EL PROBLEMA ES NEXTAUTH_URL

**El error 401 en `callback/credentials` significa que NextAuth no puede validar la solicitud porque la URL no coincide.**

---

## ⚡ SOLUCIÓN (3 minutos)

### Paso 1: Ve a Vercel
1. Abre [vercel.com](https://vercel.com)
2. Selecciona tu proyecto
3. Settings → Environment Variables

### Paso 2: Busca NEXTAUTH_URL

**¿Qué valor tiene actualmente?**

Si dice cualquiera de estos, está MAL:
```bash
❌ http://localhost:3000
❌ https://trickest.vercel.app/  (con slash al final)
❌ http://trickest.vercel.app  (sin https)
❌ No existe la variable
```

### Paso 3: Corrígelo

**Debe ser EXACTAMENTE esto (ajusta el dominio a tu URL real):**
```bash
NEXTAUTH_URL=https://trickest.vercel.app
```

**SIN:**
- ❌ slash final (`/`)
- ❌ http (debe ser `https`)
- ❌ localhost

### Paso 4: Guarda y Redeploy

1. Click en "Save"
2. Ve a "Deployments"
3. Click en los 3 puntos del último deploy
4. Click en "Redeploy"
5. Espera 1-2 minutos

### Paso 5: Prueba el Login

Después del redeploy, intenta login con:
- Email: `admin@trickest.com`
- Password: `password123`

---

## 🔍 ¿Cómo verificar cuál es tu dominio correcto?

**Opción 1:** Ve a Vercel → Tu Proyecto → Settings → Domains
- Ahí verás tu(s) dominio(s)
- Usa el principal (sin el slash final)

**Opción 2:** Abre tu sitio en el navegador
- Copia la URL de la barra de direcciones
- Quítale el slash final si tiene
- Ese es tu `NEXTAUTH_URL`

**Ejemplos:**
```bash
# Si tu sitio es: https://trickest.vercel.app/
# Tu NEXTAUTH_URL debe ser: https://trickest.vercel.app

# Si tienes dominio custom: https://trickest.com/
# Tu NEXTAUTH_URL debe ser: https://trickest.com
```

---

## 🎯 Variables que DEBEN estar en Vercel

**Checklist completo:**

```bash
✅ NEXTAUTH_URL=https://trickest.vercel.app  (tu dominio real, sin slash)
✅ NEXTAUTH_SECRET=[REMOVED - usar archivo .env]
✅ DATABASE_URL=[REMOVED - usar archivo .env]
✅ DIRECT_URL=[REMOVED - usar archivo .env]
✅ GOOGLE_CLIENT_ID=[REMOVED - usar archivo .env]
✅ GOOGLE_CLIENT_SECRET=[REMOVED - usar archivo .env]
✅ NEXT_PUBLIC_SUPABASE_URL=[REMOVED - usar archivo .env]
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=[REMOVED - usar archivo .env]
✅ NEXT_PUBLIC_BACKEND_URL=[REMOVED - usar archivo .env]
```

---

## 🐛 Por qué NEXTAUTH_URL causa 401

NextAuth valida que la solicitud venga del mismo dominio configurado. Si no coincide:
- ✅ Google OAuth funciona (usa redirect externo)
- ❌ Credentials falla (verifica origen internamente)

**Por eso funciona en local:** Tu `.env` local tiene `NEXTAUTH_URL=http://localhost:3000` que coincide con el servidor local.

**Por eso falla en producción:** Si `NEXTAUTH_URL` no coincide con el dominio real de Vercel, NextAuth rechaza la solicitud con 401.

---

## 📝 Después de Corregir

Una vez que funcione, verás logs como:
```
🔧 [AUTH CONFIG] Variables de entorno en producción:
   NEXTAUTH_URL: https://trickest.vercel.app
   NEXTAUTH_SECRET: ✅ Configurado
   DATABASE_URL: ✅ Configurado

🔐 [AUTH] Inicio de autenticación con credenciales
🔍 [AUTH] Buscando usuario: admin@trickest.com
✅ [AUTH] Usuario encontrado
✅ [AUTH] Contraseña válida
✅ [AUTH] Autenticación exitosa
```

---

## ⏱️ Esto debería tomar 3 minutos

1. (1 min) Verificar/corregir NEXTAUTH_URL en Vercel
2. (1 min) Redeploy
3. (1 min) Probar login

**Si esto no lo soluciona, avísame y seguimos debuggeando.**
