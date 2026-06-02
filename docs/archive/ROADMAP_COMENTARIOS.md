# 📝 Roadmap: Sistema de Comentarios con Like/Dislike

**Estado**: Planeado para Fase 2
**Prioridad**: Media
**Complejidad**: Alta

## 🎯 Visión General

Sistema de comentarios sociales para spots con sistema de votación (like/dislike) que permite:
- Compartir experiencias y tips sobre spots
- Validar información de otros usuarios
- Moderación comunitaria automática
- Gamificación con reputación

---

## 📋 Fase 1: Like/Dislike para Spots (IMPLEMENTADO)

### Estado: ✅ Completado

**Qué hace:**
- ❤️ Like = Validar que el spot existe y está bien ubicado
- Requiere GPS (< 50 metros del spot)
- +2 pts de reputación
- Avanza el spot de stage (GHOST → REVIEW → VERIFIED → LEGENDARY)

**Archivos:**
- `/api/spots/[id]/validate` - Endpoint de validación
- `UnifiedMap.tsx` - Botón de validación en popup
- `SpotProximityModal.tsx` - Validación en modal

**Base de datos:**
- `SpotValidation` - Registro de validaciones GPS

---

## 📋 Fase 2: Comentarios para Spots (🚧 EN PROGRESO)

### Estado: 🚧 Implementación en curso

**Progreso:**
- ✅ Schema de base de datos `SpotComment` creado
- ✅ API endpoints implementados:
  - `POST /api/spots/:id/comments` - Crear comentario
  - `GET /api/spots/:id/comments` - Listar comentarios
  - `PATCH /api/spots/:id/comments/:commentId` - Editar comentario
  - `DELETE /api/spots/:id/comments/:commentId` - Eliminar comentario
- ✅ Componentes Frontend creados:
  - `CommentItem.tsx` - Comentario individual
  - `CommentForm.tsx` - Formulario de comentarios
  - `SpotComments.tsx` - Lista de comentarios con paginación
- ✅ Integración en UnifiedMap popup con botón collapsible
- ⏳ **PENDIENTE**: Ejecutar `npx prisma db push` cuando la BD esté disponible

### 2.1 Esquema de Base de Datos

```prisma
model SpotComment {
  id          Int @id @default(autoincrement())
  spotId      Int
  userId      String  // Email del usuario
  content     String  @db.Text
  likes       Int     @default(0)
  dislikes    Int     @default(0)
  isPinned    Boolean @default(false)  // Comentario fijado por admin
  isHidden    Boolean @default(false)  // Oculto por baja puntuación
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  spot        Spot     @relation(fields: [spotId], references: [id])
  user        User     @relation(fields: [userId], references: [email])

  @@index([spotId])
  @@index([userId])
  @@index([createdAt])
  @@index([likes, dislikes]) // Para ordenar por popularidad
}

// Relación en Spot
model Spot {
  // ... campos existentes
  comments    SpotComment[]
}

// Relación en User
model User {
  // ... campos existentes
  comments    SpotComment[]
}
```

### 2.2 Endpoints API

#### `GET /api/spots/:id/comments`
- Obtiene comentarios de un spot
- Query params: `?sort=popular|recent&limit=10&offset=0`
- Respuesta:
```typescript
{
  comments: [
    {
      id: 1,
      content: "El bowl está increíble, mejor ir en la mañana",
      likes: 15,
      dislikes: 2,
      userVote: 'like' | 'dislike' | null,
      user: {
        name: "Juan Pérez",
        photo: "url",
        reputation: 150
      },
      createdAt: "2024-01-15T10:30:00Z",
      isPinned: false
    }
  ],
  total: 45,
  hasMore: true
}
```

#### `POST /api/spots/:id/comments`
- Crear nuevo comentario
- Body: `{ content: string (max 500 caracteres) }`
- Validaciones:
  - Máximo 500 caracteres
  - No spam (palabras repetidas)
  - Usuario debe tener reputación > 0
  - Rate limit: 1 comentario por minuto por spot

#### `PATCH /api/spots/:id/comments/:commentId`
- Editar comentario propio
- Solo autor puede editar
- Máximo 500 caracteres

#### `DELETE /api/spots/:id/comments/:commentId`
- Eliminar comentario propio o admin
- Soft delete (marcar como eliminado)

### 2.3 Componentes Frontend

#### `SpotComments.tsx`
- Lista de comentarios con scroll infinito
- Ordenar por: Popular | Reciente
- Mostrar: contenido, autor, fecha, likes/dislikes, botones de votación
- Paginación automática

#### `CommentItem.tsx`
- Comentario individual con:
  - Foto y nombre del autor
  - Fecha relativa ("hace 2 horas")
  - Contenido del comentario
  - Botones like/dislike
  - Contador de likes/dislikes
  - Menú para editar/eliminar (propietario)
  - Badge de reputación del autor

---

## 📋 Fase 3: Like/Dislike en Comentarios (PENDIENTE)

### Estado: ⏳ Planeado

### 3.1 Esquema de Base de Datos

```prisma
model CommentVote {
  id          Int @id @default(autoincrement())
  commentId   Int
  userId      String  // Email del usuario
  voteType    String  // 'like' | 'dislike'
  createdAt   DateTime @default(now())

  comment     SpotComment @relation(fields: [commentId], references: [id])
  user        User        @relation(fields: [userId], references: [email])

  @@unique([commentId, userId]) // Un voto por usuario por comentario
  @@index([commentId])
  @@index([userId])
}
```

### 3.2 Endpoints API

#### `POST /api/spots/:spotId/comments/:commentId/vote`
- Votar en comentario
- Body: `{ voteType: 'like' | 'dislike' }`
- Si vota like después de dislike → actualiza
- Si vota dislike después de like → actualiza
- Si vota lo mismo 2 veces → elimina voto

#### `DELETE /api/spots/:spotId/comments/:commentId/vote`
- Eliminar voto propio

### 3.3 Reglas de Moderación

**Ocultar automáticamente comentarios si:**
- Dislikes > Likes + 5
- Ratio dislikes/likes > 0.7
- Más de 5 reportes

**Fijar comentarios si:**
- Score > 50
- Creado por admin
- Marcado como útil por 10+ usuarios

### 3.4 Sistema de Reputación

**Acciones que dan puntos:**
- Comentario útil recibe like: +1 pt por like
- Comentario verified: +5 pts
- Crear comentario: +2 pts

**Acciones que quitan puntos:**
- Comentario oculto: -10 pts
- Comentario eliminado: -20 pts
- Reporte abusivo: -50 pts

---

## 📋 Fase 4: UI/UX Mejoras (PENDIENTE)

### 4.1 Componentes Avanzados

#### `CommentForm.tsx`
- Formulario para crear comentarios
- Character counter
- Vista previa antes de publicar
- Auto-save como borrador

#### `CommentThread.tsx`
- Hilos de comentarios (respuestas)
- Anidamiento ilimitado
- Collapse/expand

#### `CommentModeration.tsx` (Admin)
- Panel de moderación
- Cola de comentarios reportados
- Aprobar/rechazar comentarios
- Banear usuarios

### 4.2 Notificaciones

- Al recibir like en comentario
- Al recibir respuesta
- Cuando comentario es oculto
- Reporte de moderación

---

## 📋 Fase 5: Analytics y Reports (PENDIENTE)

### 5.1 Métricas

- Comentarios por spot
- Comentarios por usuario
- Engagement rate
- Comentarios más útiles
- Usuarios más activos

### 5.2 Reports

- Top 100 spots con más comentarios
- Top 100 usuarios más útiles
- Comentarios más votados
- Tendencias temporales

---

## 🛠️ Plan de Implementación

### Sprint 1: Backend (2-3 días)
1. Crear migraciones de DB
2. Endpoints CRUD para comentarios
3. Validaciones y rate limiting
4. Tests unitarios

### Sprint 2: Frontend Básico (2 días)
1. Componente `SpotComments`
2. Componente `CommentItem`
3. Integración con mapa
4. Tests E2E

### Sprint 3: Sistema de Votos (2 días)
1. Endpoint de votación
2. Actualización de UI con contadores
3. Lógica de moderación automática
4. Tests

### Sprint 4: Features Avanzadas (2-3 días)
1. Hilos de comentarios
2. Auto-save de borradores
3. Notificaciones
4. Panel admin

---

## 🔒 Consideraciones de Seguridad

### Validaciones
- ✅ Sanitización de HTML (prevenir XSS)
- ✅ Rate limiting (1 comentario/minuto)
- ✅ Longitud máxima 500 caracteres
- ✅ Detección de spam (palabras repetidas)
- ✅ Solo usuarios autenticados
- ✅ Verificar reputación mínima

### Moderación
- ✅ Auto-ocultar comentarios con baja puntuación
- ✅ Reportes para contenido inapropiado
- ✅ Admin puede pin/ocultar/banear
- ✅ Soft delete (recuperable)

### RLS (Row Level Security)
- ✅ Solo editar comentarios propios
- ✅ Solo eliminar comentarios propios (o admin)
- ✅ Verificación de ownership

---

## 📊 Criterios de Éxito

### Fase 1 (✅ Completado)
- [x] Validación GPS funcionando
- [x] +2 pts de reputación
- [x] Sistema de stages

### Fase 2 (Comentarios básicos) - 🚧 EN PROGRESO
- [x] Crear comentarios (API + Frontend)
- [x] Listar comentarios (API + Frontend)
- [x] Editar comentarios propios (API + Frontend)
- [x] Eliminar comentarios (API + Frontend)
- [x] Rate limiting implementado
- [ ] **PENDIENTE**: Ejecutar `npx prisma db push` para crear tabla en BD

### Fase 3 (Votos en comentarios)
- [ ] Like/dislike en comentarios
- [ ] Contador actualizado en tiempo real
- [ ] Moderación automática por puntuación
- [ ] Sistema de reputación integrado

### Fase 4 (UI avanzada)
- [ ] Hilos de comentarios
- [ ] Auto-save de borradores
- [ ] Notificaciones
- [ ] Panel de moderación admin

---

## 🚀 Quick Start para Futura Implementación

### Prioridad 1 - MVP de Comentarios
1. Schema `SpotComment`
2. Endpoint `POST /api/spots/:id/comments`
3. Endpoint `GET /api/spots/:id/comments`
4. Componente `SpotComments` básico
5. Integración en popup del mapa

### Prioridad 2 - Sistema de Votos
1. Schema `CommentVote`
2. Endpoint `POST /api/spots/:id/comments/:id/vote`
3. Actualizar `CommentItem` con botones
4. Lógica de moderación

### Prioridad 3 - Features Avanzadas
1. Hilos de comentarios
2. Notificaciones
3. Panel admin
4. Analytics

---

## 📝 Notas Técnicas

### Performance
- Índices necesarios: `spotId`, `userId`, `createdAt`, `likes+dislikes`
- Cache de comentarios populares (Redis)
- Paginación obligatoria (max 50 por request)
- Compress HTML de comentarios

### UI/UX
- Lazy loading de comentarios (cargar 10, scroll → cargar más)
- Skeleton screens mientras carga
- Actualizaciones optimistas (likes)
- Toast notifications para acciones

### Testing
- Unit tests para endpoints
- E2E tests para flujo completo
- Tests de moderación automática
- Tests de carga (1000 comentarios)

---

## 📚 Referencias

- **Design System**: `/docs/DESIGN_SYSTEM.md`
- **Base de Datos**: Prisma Schema en `/prisma/schema.prisma`
- **API Routes**: `/src/app/api/`

---

**Última actualización**: 2025-01-22
**Responsable**: Dev Team
**Estado**: Documentación para Fase 2+
