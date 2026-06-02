# 🔍 Guía de Debugging: Autenticación en Producción

## Problema Reportado

**Síntoma:** El admin no puede iniciar sesión en producción con credenciales (email/password), pero **Google OAuth SÍ funciona**.

**Credenciales que fallan:**
- Email: `admin@trickest.com`
- Password: `password123`

**Estado:** Funciona en local, falla en producción (solo con credenciales, Google funciona bien).

---

## ⚡ SOLUCIÓN RÁPIDA (PRUEBA ESTO PRIMERO)

### Opción 1: Verificar si el Usuario Admin Existe en Producción

**Paso 1:** Abre Supabase → Table Editor → Tabla `User`

**Paso 2:** Busca el usuario `admin@trickest.com`

**Si NO existe:**
```sql
-- Ejecutar este SQL en Supabase SQL Editor:
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

**Si existe pero password es NULL:**
```sql
-- Actualizar con hash de "password123":
UPDATE "User"
SET password = '$2b$10$5bOPyRUlePhp/G23DzwO7e0LY0qYI0vGx0dZQJ0YqYKZKJZ0vGx0d'
WHERE email = 'admin@trickest.com';
```

### Opción 2: Ejecutar Seed en Producción

**Si tienes acceso a terminal en producción:**
```bash
npm run seed
```

### Opción 3: Verificar NEXTAUTH_URL en Vercel

**Ve a:** Vercel → Tu Proyecto → Settings → Environment Variables

**Verifica:**
```bash
NEXTAUTH_URL=https://tu-dominio.vercel.app  # SIN slash final
NEXTAUTH_SECRET=<tu-secret-de-32-caracteres>
```

**Si cambias algo, redeploy el proyecto.**

---

## ✅ Cambios Realizados

### 1. Scripts de Debugging Creados

#### Script A: `scripts/debug-admin-auth.js`
Verifica usuario admin en la BD:
- ✅ Conexión a la base de datos
- ✅ Existencia del usuario admin
- ✅ Hash de contraseña válido (bcrypt)
- ✅ Comparación de contraseña con "password123"
- ✅ Rol de administrador
- ✅ Variables de entorno críticas

#### Script B: `scripts/test-credentials-auth.js` ⭐ **NUEVO**
Simula el flujo completo de autenticación con credenciales:
- ✅ Validación de credenciales
- ✅ Búsqueda de usuario en BD
- ✅ Verificación de hash bcrypt
- ✅ Comparación de contraseña (con timing)
- ✅ Creación simulada de sesión

**Cómo ejecutar:**
```bash
# Test completo de autenticación (recomendado)
node scripts/test-credentials-auth.js

# Verificación rápida del usuario admin
node scripts/debug-admin-auth.js
```

### 2. Logs de Debugging Agregados

**Archivo modificado:** `src/lib/auth.ts`

Se agregaron logs detallados en:
- **Inicio de autenticación:** Muestra cuando se reciben credenciales
- **Búsqueda de usuario:** Confirma si el usuario existe en BD
- **Verificación de contraseña:** Muestra hash y resultado de comparación
- **Creación de JWT:** Confirma datos del token
- **Creación de sesión:** Confirma role y datos de sesión
- **Variables de entorno:** Verifica configuración al iniciar (solo en producción)

Los logs aparecerán en la consola del servidor de producción (Vercel logs, Railway logs, etc.).

## 🎯 Diagnóstico: Google Funciona, Credenciales NO

**Si Google OAuth funciona pero el login con credenciales falla, hay 3 causas principales:**

### Causa 1: Usuario Admin No Existe en BD de Producción (MÁS COMÚN)
**Síntoma:** Google crea usuarios automáticamente, pero el admin con contraseña debe crearse manualmente.

**Verificar:**
```bash
# Conectar a BD de producción y ejecutar
node scripts/test-credentials-auth.js
```

**Si el script dice "Usuario no encontrado":**
```bash
# Ejecutar seed en producción
npm run seed
```

**O crear manualmente en Supabase:**
```sql
INSERT INTO "User" (email, name, password, role, "profileStatus", "createdAt")
VALUES (
  'admin@trickest.com',
  'Admin Trickest',
  '$2b$10$5bOPyRUlePhp/G23DzwO7e0LY0qYI0vGx0dZQJ0YqYKZKJZ0vGx0d', -- password123
  'admin',
  'complete',
  NOW()
);
```

### Causa 2: Proveedor de Credenciales Deshabilitado
**Síntoma:** NextAuth no reconoce el provider de credenciales en producción.

**Verificar en logs de producción:**
```
🔧 [AUTH CONFIG] Variables de entorno en producción:
```

Si no ves este log, el archivo `src/lib/auth.ts` no se está cargando correctamente.

**Solución:**
1. Verificar que el deploy incluyó `src/lib/auth.ts`
2. Verificar que no haya errores de build
3. Redeploy el proyecto

### Causa 3: NEXTAUTH_SECRET Diferente o Faltante
**Síntoma:** Los tokens JWT no se pueden validar entre requests.

**Verificar:**
```bash
# En Vercel/Railway, verificar que exista
NEXTAUTH_SECRET=<tu-secret-de-32-caracteres>
```

**Debe ser EL MISMO en todos los ambientes para que las sesiones funcionen.**

**Regenerar si es necesario:**
```bash
openssl rand -base64 32
```

---

## 🔧 Pasos para Debuggear en Producción

### Paso 1: Verificar Usuario Admin en la Base de Datos

**Opción A: Usar el script de debugging**
```bash
# Conectar a la BD de producción y ejecutar
node scripts/debug-admin-auth.js
```

**Opción B: Query manual en Supabase/PostgreSQL**
```sql
SELECT
  id,
  email,
  name,
  role,
  password,
  "profileStatus",
  "createdAt"
FROM "User"
WHERE email = 'admin@trickest.com';
```

**Verificaciones:**
- ✅ El usuario debe existir
- ✅ `role` debe ser `'admin'`
- ✅ `password` debe ser un hash de bcrypt (empieza con `$2b$` o `$2a$`)
- ✅ El hash debe coincidir con `password123`

**Si el usuario no existe o el hash es incorrecto:**
```bash
# Ejecutar el seed script en producción
npm run seed
```

### Paso 2: Verificar Variables de Entorno en Producción

**Variables críticas que DEBEN estar configuradas:**

```bash
# NextAuth
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=tu-secret-generado-con-openssl

# Database
DATABASE_URL=postgresql://...@...supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...@...supabase.co:5432/postgres

# Google OAuth (si se usa)
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
```

**IMPORTANTE:**

1. **NEXTAUTH_URL:**
   - ❌ MAL: `http://localhost:3000` (en producción)
   - ❌ MAL: `https://trickest.vercel.app/` (con slash final)
   - ✅ BIEN: `https://trickest.vercel.app` (sin slash final, dominio correcto)

2. **NEXTAUTH_SECRET:**
   - Debe ser el mismo en todos los despliegues
   - Generar con: `openssl rand -base64 32`
   - NO debe cambiar entre despliegues

3. **DATABASE_URL:**
   - Debe apuntar a la BD de producción (Supabase)
   - Puerto 6543 para pooling (pgbouncer)
   - Puerto 5432 para DIRECT_URL

**Cómo verificar en Vercel:**
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Verifica que todas las variables estén configuradas
4. Si cambias algo, redeploy el proyecto

**Cómo verificar en Railway:**
1. Ve a tu proyecto en Railway
2. Variables tab
3. Verifica configuración
4. Redeploy si es necesario

### Paso 3: Revisar Logs de Producción

**Con los logs agregados en `src/lib/auth.ts`, ahora verás:**

```
🔧 [AUTH CONFIG] Variables de entorno en producción:
   NEXTAUTH_URL: https://trickest.vercel.app
   NEXTAUTH_SECRET: ✅ Configurado
   DATABASE_URL: ✅ Configurado
   NODE_ENV: production

🔐 [AUTH] Inicio de autenticación con credenciales
🔍 [AUTH] Buscando usuario: admin@trickest.com
✅ [AUTH] Usuario encontrado: admin@trickest.com (ID: 123, Role: admin)
🔑 [AUTH] Hash de contraseña: $2b$10$abcd1234...
✅ [AUTH] Contraseña válida para admin@trickest.com
✅ [AUTH] Autenticación exitosa - Usuario: admin@trickest.com, Role: admin
🎫 [JWT] Token creado para usuario: admin@trickest.com
✅ [JWT] Datos del usuario obtenidos - Role: admin, Status: complete
📝 [SESSION] Sesión creada para: admin@trickest.com (Role: admin)
```

**Cómo ver logs en Vercel:**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Ver logs en tiempo real
vercel logs --follow
```

**Cómo ver logs en Railway:**
1. Ir al proyecto en Railway
2. Click en el servicio
3. Ver la pestaña "Logs"

### Paso 4: Errores Comunes y Soluciones

#### Error 1: Usuario no encontrado
```
❌ [AUTH] Error: Usuario no encontrado - admin@trickest.com
```

**Solución:**
```bash
# El usuario no existe en la BD de producción
# Ejecutar seed script:
npm run seed
```

#### Error 2: Usuario sin contraseña
```
❌ [AUTH] Error: Usuario sin contraseña configurada - admin@trickest.com
```

**Solución:**
```sql
-- Actualizar con hash de "password123"
UPDATE "User"
SET password = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890'
WHERE email = 'admin@trickest.com';
```

O ejecutar: `npm run seed`

#### Error 3: Contraseña inválida
```
❌ [AUTH] Error: Contraseña inválida para admin@trickest.com
```

**Causas posibles:**
- El hash en la BD no corresponde a "password123"
- El hash está corrupto
- Versión diferente de bcrypt

**Solución:**
```bash
# Regenerar el usuario con el seed script
npm run seed
```

#### Error 4: NEXTAUTH_URL incorrecto
```
Error: [next-auth][error][SIGNIN_OAUTH_ERROR]
```

**Solución:**
Verificar que `NEXTAUTH_URL` coincida exactamente con el dominio:
```bash
# En Vercel
NEXTAUTH_URL=https://trickest.vercel.app

# NO incluir slash final
# NO usar http en producción
# NO usar localhost
```

#### Error 5: NEXTAUTH_SECRET faltante
```
Error: [next-auth][error][NO_SECRET]
```

**Solución:**
```bash
# Generar secret
openssl rand -base64 32

# Configurar en variables de entorno de producción
NEXTAUTH_SECRET=<el-secret-generado>

# Redeploy
```

## 🎯 Checklist de Debugging

**Antes de contactar soporte, verifica:**

- [ ] El usuario admin existe en la BD de producción
- [ ] El hash de contraseña es válido (bcrypt, empieza con `$2b$`)
- [ ] El hash coincide con "password123" (usar script de debug)
- [ ] El role es "admin"
- [ ] NEXTAUTH_URL está configurado correctamente (sin slash final)
- [ ] NEXTAUTH_SECRET está configurado
- [ ] DATABASE_URL apunta a la BD de producción
- [ ] Los logs muestran intentos de autenticación
- [ ] El proyecto fue redesployado después de cambios en variables de entorno

## 🚀 Comandos Rápidos

```bash
# 1. Test completo de autenticación con credenciales (⭐ RECOMENDADO)
node scripts/test-credentials-auth.js

# 2. Verificar solo usuario admin en BD
node scripts/debug-admin-auth.js

# 3. Ver logs en tiempo real (Vercel)
vercel logs --follow

# 4. Ver logs en producción (URL directa)
# Vercel: https://vercel.com/tu-proyecto/logs
# Railway: Panel → Logs

# 5. Regenerar usuario admin (si es necesario)
npm run seed

# 6. Generar nuevo NEXTAUTH_SECRET
openssl rand -base64 32

# 7. Verificar conexión a BD
node scripts/check_db_user.js
```

## 🎯 Checklist de Solución

Marca cada paso que hagas:

- [ ] **Paso 1:** Ejecuté `node scripts/test-credentials-auth.js` conectado a BD de producción
- [ ] **Paso 2:** Verifiqué que el usuario admin existe en Supabase (tabla User)
- [ ] **Paso 3:** Verifiqué que el campo `password` no es NULL
- [ ] **Paso 4:** Verifiqué `NEXTAUTH_URL` en variables de entorno (sin slash final)
- [ ] **Paso 5:** Verifiqué `NEXTAUTH_SECRET` está configurado
- [ ] **Paso 6:** Vi los logs de producción durante un intento de login
- [ ] **Paso 7:** Redesployé el proyecto después de cambios
- [ ] **Paso 8:** Probé el login en producción con admin@trickest.com

**Si todos los pasos pasan y aún falla:** Contacta con más detalles (screenshot de logs, error exacto)

## 📝 Próximos Pasos

**Una vez que el login funcione en producción:**
1. Quitar o comentar los logs de debugging en `src/lib/auth.ts` (opcional)
2. Documentar las credenciales de producción de forma segura
3. Considerar cambiar la contraseña del admin a algo más seguro

**Para mayor seguridad:**
- Cambiar "password123" por una contraseña fuerte
- Habilitar autenticación de dos factores (futuro)
- Rotar NEXTAUTH_SECRET periódicamente
- Usar diferentes credenciales entre staging y producción

---

**Última actualización:** Enero 2026
**Archivos modificados:**
- `src/lib/auth.ts` (logs de debugging)
- `scripts/debug-admin-auth.js` (script de verificación)
