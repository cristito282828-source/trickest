# Migraciones de Prisma — Guía operativa

> **Lección aprendida (jul 2026):** confundir `prisma migrate dev` con operaciones que pueden borrar data nos costó tiempo. Este documento deja claro qué hace cada comando y cuándo usarlo.

## TL;DR — Lo que tenés que saber

1. **`git clone` / `git pull` NUNCA toca la base de datos.** Solo archivos locales.
2. **`prisma migrate dev` aplica cambios al schema en la DB.** Si tiene `--name`, crea una migración nueva. Si no, aplica las que faltan.
3. **`prisma migrate reset`** ⚠️ **BORRA TODA LA DATA** de la DB y la recrea desde cero. Solo usar en dev.
4. **`prisma migrate resolve --applied <name>`** marca una migración como aplicada sin ejecutarla. Útil cuando la tabla ya existe pero Prisma no la registra.

## Comandos comunes

### Después de hacer `git pull` con cambios al schema

```bash
# Genera el cliente Prisma con el schema actualizado
npx prisma generate

# Aplica las migraciones nuevas (NO borra data existente)
npx prisma migrate deploy
```

> En producción (Vercel) el script `postinstall` corre `prisma generate` automáticamente.

### Cuando agregás un modelo nuevo en desarrollo

```bash
# Crea una nueva migración y la aplica a tu DB local
npx prisma migrate dev --name nombre-descriptivo
```

### Si Prisma detecta una migración que ya está en la DB pero falta en el repo

```bash
# Marca como aplicada sin ejecutar el SQL
# (la tabla existe pero el archivo migration.sql se perdió)
npx prisma migrate resolve --applied 20260713085927_add_road_events
```

## ⚠️ Cosas que NUNCA hay que hacer en prod

| Comando | Por qué es peligroso |
|---|---|
| `prisma migrate reset` | Borra TODA la data y la recrea. **Solo en dev local.** |
| `prisma db push --force-reset` | Igual que arriba, descarta cambios manuales. |
| DROP TABLE / DELETE en Supabase UI | Sin UNDO. Solo hacerlo si estás 100% seguro. |

## Casos donde SÍ se puede perder data

1. **`prisma migrate reset`** — borra y recrea todo.
2. **`prisma migrate dev` con cambios destructivos** — por ejemplo, cambiar un campo de opcional a required sin default.
3. **Editar manualmente la DB** sin migración correspondiente.
4. **Borrar la rama de prod** en Supabase (no recuperable sin backup).

## Cómo revertir una migración sin perder data

Si una migración rompió algo:

```bash
# Ver el historial
npx prisma migrate status

# Marcar como "rolled back" (no la borra, solo la ignora)
npx prisma migrate resolve --rolled-back 20260713085927_add_road_events

# Después, manualmente revertir el cambio en el schema o crear una nueva migración compensatoria
```

Para borrar una tabla específica sin tocar el resto:

```sql
-- Conectar a Supabase SQL Editor y ejecutar:
DROP TABLE IF EXISTS "RoadEvent" CASCADE;
```

## Verificar el estado de la DB

```bash
# Con Node, vía Prisma:
node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{const t=await p.\$queryRawUnsafe(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public'\");console.log(t.map(r=>r.table_name));await p.\$disconnect();})()"
```

## Historial

- **jul 2026:** primera migración de RoadEvent (RoadReportApp mobile).
  - Schema agregado al `prisma/schema.prisma`.
  - Migración aplicada con `prisma migrate dev`.
  - Tabla creada manualmente con `$executeRawUnsafe` después de un `resolve --applied` accidental.