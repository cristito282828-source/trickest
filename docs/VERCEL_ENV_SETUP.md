# Configuración de Variables de Entorno en Vercel

## ⚠️ IMPORTANTE: Cambios Recientes en NextAuth

Se ha actualizado la configuración de NextAuth para solucionar el error `CLIENT_FETCH_ERROR`. Ahora todas las opciones de autenticación están centralizadas en `src/lib/auth.ts` y se pasan correctamente a `getServerSession()` en todas las rutas API.

**Acción Requerida:** Después de hacer deploy con estos cambios, el login debería funcionar correctamente.

---

## Variables de Entorno Requeridas

Asegúrate de configurar las siguientes variables de entorno en tu proyecto de Vercel:

### 1. NextAuth Configuration

```
NEXTAUTH_URL=https://trickest.vercel.app
NEXTAUTH_SECRET=N8CO8NBNptWX1S3feFbC3pNjsaLvQRIyijNLAYd5Clg=
```

**Importante:**
- `NEXTAUTH_URL` debe ser **exactamente** tu URL de producción (sin barra al final)
- `NEXTAUTH_SECRET` debe ser una cadena secreta aleatoria (puedes usar la misma de tu `.env` local)

### 2. Supabase Database Configuration

```
DATABASE_URL=postgresql://postgres.fdzsbuiunhirumzimoaw:H9nsAPwTCVDipbRj@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.fdzsbuiunhirumzimoaw:H9nsAPwTCVDipbRj@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

**Nota:** Usa las nuevas credenciales de Supabase que necesitas actualizar.

### 3. Supabase Public Configuration

```
NEXT_PUBLIC_SUPABASE_URL=https://fdzsbuiunhirumzimoaw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkenNidWl1bmhpcnVtemltb2F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzQ1MDgsImV4cCI6MjA4MDgxMDUwOH0.8bIKhZBeTTKv_oVUlZn_JDOQkFjq5fksd3845vi33z0
```

**Nota:** Actualiza estas con tus nuevas credenciales de Supabase.

### 4. Google OAuth Configuration

```
GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET]
```

**Importante:**
- Usa las mismas credenciales que tienes en tu archivo `.env` local
- Estas NO deben cambiar a menos que crees nuevas credenciales en Google Cloud Console
- NO compartas estos valores públicamente

### 5. Backend Configuration

```
NEXT_PUBLIC_BACKEND_URL=https://skaters.toryskateshop.com
```

---

## Pasos para Configurar en Vercel

### Opción 1: Desde el Dashboard de Vercel (Recomendado)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en tu proyecto "trickest"
3. Ve a **Settings** → **Environment Variables**
4. Agrega cada variable una por una:
   - **Key**: nombre de la variable (ej: `NEXTAUTH_URL`)
   - **Value**: valor de la variable
   - **Environment**: selecciona **Production**, **Preview**, y **Development** (todas)
5. Click en **Save**
6. **Redeploy** tu aplicación después de agregar todas las variables

### Opción 2: Desde CLI de Vercel

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Link tu proyecto
vercel link

# Agregar variables de entorno
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
# ... continúa con todas las variables

# Redeploy
vercel --prod
```

---

## Configuración de Google OAuth (Google Cloud Console)

Para que el login con Google funcione en producción, debes agregar las URIs autorizadas:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Click en tu OAuth 2.0 Client ID
5. En **Authorized JavaScript origins**, agrega:
   ```
   https://trickest.vercel.app
   ```
6. En **Authorized redirect URIs**, agrega:
   ```
   https://trickest.vercel.app/api/auth/callback/google
   ```
7. Click en **Save**

---

## Verificación

Después de configurar las variables:

1. **Redeploy** en Vercel (Settings → Deployments → Redeploy)
2. Espera a que termine el deploy
3. Verifica que el endpoint funcione:
   - Visita: `https://trickest.vercel.app/api/auth/providers`
   - Deberías ver un JSON con los providers configurados
4. Intenta hacer login con Google

---

## Troubleshooting

### Error: "CLIENT_FETCH_ERROR"
- Verifica que `NEXTAUTH_URL` esté configurada correctamente
- Asegúrate que no tenga barra al final (`/`)

### Error: "OAuthCallback"
- Verifica las Authorized redirect URIs en Google Cloud Console
- Asegúrate que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén correctas

### Error 500 en `/api/auth/providers`
- Verifica que `NEXTAUTH_SECRET` esté configurada
- Verifica que las variables de base de datos (`DATABASE_URL`, `DIRECT_URL`) sean correctas

### Error de Base de Datos
- Verifica las conexiones de Supabase
- Asegúrate de usar el puerto 6543 para `DATABASE_URL` (con pgbouncer)
- Asegúrate de usar el puerto 5432 para `DIRECT_URL` (conexión directa)

---

## Checklist Final

- [ ] Todas las variables de entorno están configuradas en Vercel
- [ ] `NEXTAUTH_URL` apunta a `https://trickest.vercel.app` (sin barra al final)
- [ ] Google OAuth tiene las URIs autorizadas correctas
- [ ] Hiciste un redeploy después de configurar las variables
- [ ] El endpoint `/api/auth/providers` responde correctamente
- [ ] El login con Google funciona

---

**Nota:** Después de agregar o modificar variables de entorno en Vercel, **SIEMPRE debes hacer un redeploy** para que los cambios tomen efecto.
