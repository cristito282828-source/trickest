# Guía de Migración: Username → Email

## ⚠️ IMPORTANTE - LEER ANTES DE DESPLEGAR

Este proyecto ha cambiado de usar `username` a `email` como identificador principal para las relaciones de usuario. Este cambio simplifica la arquitectura y elimina la necesidad de gestionar usernames únicos.

## 📋 Pasos para Migración en Producción

### 1. **Ejecutar Script SQL de Migración**

Antes de desplegar el código, debes ejecutar el script SQL en tu base de datos de producción:

```bash
# Opción 1: Desde Supabase Dashboard
# 1. Ve a SQL Editor en tu proyecto de Supabase
# 2. Copia y pega el contenido de migration-to-email.sql
# 3. Ejecuta el script

# Opción 2: Desde línea de comandos
psql $DIRECT_URL -f migration-to-email.sql
```

Este script:
- ✅ Convierte todos los `userId` de username a email en submissions
- ✅ Convierte todos los `evaluatedBy` de username a email
- ✅ Actualiza las relaciones de Vote para usar email
- ✅ Actualiza las relaciones de Follow para usar email
- ✅ Recrea las foreign keys para apuntar a User.email

### 2. **Verificar la Migración**

Ejecuta estas queries para verificar que la migración fue exitosa:

```sql
-- Todas las submissions deben tener userId como email
SELECT COUNT(*) FROM "Submission" WHERE "userId" NOT LIKE '%@%';
-- Resultado esperado: 0

-- Todos los votos deben tener userId como email
SELECT COUNT(*) FROM "Vote" WHERE "userId" NOT LIKE '%@%';
-- Resultado esperado: 0

-- Todos los follows deben tener email
SELECT COUNT(*) FROM "Follow"
WHERE "followerId" NOT LIKE '%@%' OR "followingId" NOT LIKE '%@%';
-- Resultado esperado: 0
```

### 3. **Desplegar el Código**

Una vez verificada la migración SQL, despliega el código:

```bash
git push origin main
# Vercel desplegará automáticamente
```

### 4. **Verificar en Producción**

1. Inicia sesión en la aplicación
2. Ve a `/dashboard/skaters/challenges`
3. Verifica que veas todos los challenges
4. Intenta actualizar tu perfil en `/dashboard/skaters/profile`
5. Verifica que todo funcione correctamente

## 🔄 Cambios Realizados

### Prisma Schema
```prisma
// ANTES
model Submission {
  userId String
  evaluatedBy String?
  user User @relation(fields: [userId], references: [username])
  judge User? @relation("JudgeEvaluations", fields: [evaluatedBy], references: [username])
}

// DESPUÉS
model Submission {
  userId String // Ahora es email
  evaluatedBy String? // Ahora es email
  user User @relation(fields: [userId], references: [email])
  judge User? @relation("JudgeEvaluations", fields: [evaluatedBy], references: [email])
}
```

### API Endpoints
- `/api/challenges` - Usa `session.user.email` en lugar de `session.user.username`
- `/api/submissions/user` - Filtra por `session.user.email`
- `/api/submissions/to-vote` - Usa email para filtrar votos

### Scripts
- `prisma/seed.ts` - Usa email para crear submissions
- `scripts/add-test-submissions.js` - Usa email en lugar de username

## ⚡ Beneficios del Cambio

1. **Simplicidad**: Email es único por naturaleza, no necesita generación
2. **Menos complejidad**: No hay que mantener sistema de usernames
3. **Siempre presente**: Todo usuario tiene email, algunos no tenían username
4. **Menos bugs**: Elimina errores de "username no definido"

## 🚨 Rollback (Si es necesario)

Si algo sale mal, puedes revertir:

```bash
# 1. Revertir el commit
git revert e26ff98

# 2. Revertir la migración SQL (ejecutar en orden inverso)
# Ver migration-to-email.sql y ejecutar UPDATEs inversos
```

## 📞 Soporte

Si encuentras problemas durante la migración:
1. Revisa los logs de Vercel
2. Verifica las queries de verificación arriba
3. Comprueba que el script SQL se ejecutó completamente
