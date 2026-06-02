# TheTrickest - Plan de Recuperación

**Fecha:** 2026-05-26
**Estado del build:** ✅ Compila sin errores
**Service Role Key:** ✅ Agregada al .env
**Storage Bucket:** ✅ Creado `trickest-spots`
**Upload Test:** ✅ Funcional
**RLS Notifications:** ✅ Políticas creadas (SELECT + INSERT)

---

## Problema Identificado

La **`SUPABASE_SERVICE_ROLE_KEY`** está vacía en el archivo `.env`.

Esto causa que fallen:
- 📤 Uploads (logos de equipo, fotos de perfil, fotos de spots)
- 🔔 Realtime - Notificaciones en tiempo real

---

## Paso 1: Obtener la Service Role Key

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. En "API Settings", busca **"service_role secret"**
5. Copia la key completa

## Paso 2: Agregar al .env

En `C:\Users\User\TheTrickest\.env`, cambia:

```env
# ESTO ESTA VACIO:
SUPABASE_SERVICE_ROLE_KEY=

# Cambia a:
SUPABASE_SERVICE_ROLE_KEY=tu-key-aqui
```

---

## Paso 3: Verificar Storage Bucket

En el mismo dashboard de Supabase:
1. Ve a **Storage** (en el menú lateral)
2. Verifica que exista el bucket `trickest-spots`
3. Si no existe, créalo con:
   - Name: `trickest-spots`
   - Public: ✅ (para que las imágenes sean accesibles)

---

## Paso 4: Verificar RLS de Notifications

En SQL Editor de Supabase, ejecuta:

```sql
-- Verificar que RLS permite leer notificaciones propias
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'Notification';
```

---

## Estructura del Proyecto

```
TheTrickest/
├── src/
│   ├── app/api/upload/       # Endpoints de upload
│   ├── components/          # UI components
│   ├── providers/           # SupabaseRealtimeProvider.tsx
│   └── lib/                 # Auth, Prisma, etc.
├── prisma/schema.prisma    # Modelos de BD
└── scripts/                 # Scripts de diagnóstico
```

---

## Modelos Principales (BD)

- **User** - skaters, judges, admin
- **Challenge** - 10 niveles + bonus
- **Submission** - Videos de tricks
- **Spot** - Lugares de skate
- **Team** - Equipos
- **Notification** - Sistema de notificaciones

---

## Scripts Disponibles

```bash
# Diagnóstico de realtime
node scripts/diagnose-realtime.js

# Verificar BD
node scripts/check-tables.js

# Seed de datos (crea challenges de prueba)
npm run seed
```

---

## Para Continuar

1. ~~Agregar `SUPABASE_SERVICE_ROLE_KEY`~~ ✅
2. ~~Crear bucket `trickest-spots`~~ ✅
3. ~~Probar upload~~ ✅
4. ~~Crear RLS para Notifications~~ ✅
5. Test completo en la app (uploads + realtime)

Cuando estés listo,.avísame y seguimos.
