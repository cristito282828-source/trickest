# Sistema de Validación Social de Spots - Documento de Diseño

**Versión:** 2.0
**Fecha:** Enero 2026
**Estado:** En Diseño - MVP Pendiente

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Modelo de Datos](#modelo-de-datos)
3. [Algoritmo de Confianza](#algoritmo-de-confianza)
4. [Heurísticas Inteligentes](#heurísticas-inteligentes)
5. [Sistema de Notificaciones por Proximidad](#sistema-de-notificaciones-por-proximidad)
6. [API Endpoints](#api-endpoints)
7. [Flujo de Usuario](#flujo-de-usuario)
8. [Prevención de Spam](#prevención-de-spam)
9. [Gamificación](#gamificación)
10. [Checkpoints MVP](#checkpoints-mvp)

---

## 🎯 Resumen Ejecutivo

**Objetivo:** Crear un sistema crowdsourced de spots de skate que se auto-valida mediante heurísticas inteligentes, sin necesidad de moderación manual.

**Problema a Resolver:**
- Los spots de skate cambian constantemente (cierran, son demolidos, ponen seguridad)
- Necesitamos mantener la información actualizada
- Debe ser confiable y evitar spam/registros falsos

**Solución:**
Sistema de validación social con multiple capas:
1. ✅ Validaciones de usuarios con reputación
2. ✅ GPS proximity (solo valida si estás físicamente ahí)
3. ✅ Fotos con metadata EXIF
4. ✅ Decaimiento temporal (spots sin actividad bajan de nivel)
5. ✅ Notificaciones pasivas por proximidad

---

## 🗄️ Modelo de Datos

### Schema Prisma Completo

```prisma
model Spot {
  id              Int      @id @default(autoincrement())
  uuid            String   @unique @default(uuid())
  name            String
  type            SpotType
  latitude        Float
  longitude       Float

  // VECTOR DE CONFIANZA
  confidenceScore Int      @default(0)  // 0-200+
  stage           SpotStage @default(GHOST)
  lastVerifiedAt  DateTime @default(now())

  // Historial para decaimiento
  statusHistory   Json     @default("[]")

  // Spot "hot" = mucha actividad reciente
  isHot           Boolean  @default(false)
  hotUntil        DateTime?

  // Relaciones
  validations     SpotValidation[]
  checkIns        SpotCheckIn[]
  photos          SpotPhoto[]
  reports         SpotReport[]

  // Metadata para decaimiento
  lastActivityAt  DateTime @default(now())
  staleAt         DateTime?
  deadAt          DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([latitude, longitude])
  @@index([stage, confidenceScore])
  @@index([isHot, lastActivityAt])
}

model SpotValidation {
  id          Int      @id @default(autoincrement())
  spotId      Int
  userId      String
  userWeight  Int      @default(1)  // Peso según reputación (1-5)
  method      ValidationMethod

  // Anti-spam: Detección de patrones
  ipAddress   String?
  deviceFingerprint String?

  // Datos GPS exactos
  validatedLat Float?
  validatedLng Float?
  accuracy    Float?  // Precisión GPS en metros

  createdAt   DateTime @default(now())

  spot        Spot     @relation(fields: [spotId], references: [id])

  @@unique([spotId, userId, method])
  @@index([spotId])
  @@index([userId, createdAt])
}

model SpotCheckIn {
  id          Int      @id @default(autoincrement())
  spotId      Int
  userId      String
  latitude    Float
  longitude   Float
  accuracy    Float?

  // Contexto del check-in
  crowdLevel  CrowdLevel?
  isOpen      Boolean?  // Para skateshops

  createdAt   DateTime @default(now())

  spot        Spot     @relation(fields: [spotId], references: [id])

  @@index([spotId, createdAt])
  @@index([userId, createdAt])
}

model SpotPhoto {
  id        Int      @id @default(autoincrement())
  spotId    Int
  userId    String
  url       String

  // Metadata EXIF para validación
  isLive    Boolean  @default(false)
  hasExif   Boolean  @default(false)
  exifLat   Float?
  exifLng   Float?
  takenAt   DateTime?

  createdAt DateTime @default(now())

  spot      Spot     @relation(fields: [spotId], references: [id])

  @@index([spotId])
}

model SpotReport {
  id        Int      @id @default(autoincrement())
  spotId    Int
  userId    String
  reason    ReportReason
  details   String?
  status    ReportStatus @default(PENDING)

  // Contexto del reporte
  reporterLat Float?
  reporterLng Float?
  wasOnLocation Boolean?

  createdAt DateTime @default(now())
  reviewedAt DateTime?

  spot      Spot     @relation(fields: [spotId], references: [id])

  @@index([spotId, status])
}

// ENUMS
enum SpotType {
  SKATEPARK
  SKATESHOP
  SPOT
}

enum SpotStage {
  GHOST      // 0-9: Solo visible para creador
  REVIEW     // 10-49: Visible con advertencia 🟡
  VERIFIED   // 50-99: Verificado ✅
  LEGENDARY  // 100+: Legendary 🏆
  STALE      // Decaído (sin actividad) ⚠️
  DEAD       // Confirmado cerrado 💀
}

enum ValidationMethod {
  GPS_PROXIMITY  // Usuario dentro de 50m (+2 pts)
  PHOTO_UPLOAD   // Foto con EXIF (+5 pts)
  LIVE_PHOTO     // Foto en tiempo real (+10 pts)
  CHECK_IN       // Check-in manual (+1 pt)
  CROWD_REPORT   // Reporte de ocupación (+3 pts)
}

enum ReportReason {
  CLOSED
  FAKE
  DUPLICATE
  INCORRECT_LOCATION
  NO_LONGER_EXISTS
  INACCURATE_INFO
  OWNED_BY_BUSINESS
}

enum ReportStatus {
  PENDING
  REVIEWED
  ACCEPTED
  REJECTED
  AUTO_VERIFIED
}

enum CrowdLevel {
  EMPTY
  LOW
  MODERATE
  BUSY
  CROWDED
}
```

---

## 🧮 Algoritmo de Confianza

### Fórmula Principal

```typescript
async function calculateConfidenceScore(spot: Spot): Promise<number> {
  let score = 0;

  // 1. Validaciones únicas (máx 50 puntos)
  const uniqueValidations = new Map<string, SpotValidation>();
  spot.validations.forEach(v => {
    const key = v.userId;
    if (!uniqueValidations.has(key) || v.userWeight > uniqueValidations.get(key)!.userWeight) {
      uniqueValidations.set(key, v);
    }
  });
  score += Math.min(uniqueValidations.size * 5, 50);

  // 2. Peso acumulado por método (máx 60 puntos)
  const methodWeights = spot.validations.reduce((sum, v) => {
    return sum + (v.userWeight * getMethodWeight(v.method));
  }, 0);
  score += Math.min(methodWeights, 60);

  // 3. Fotos únicas con bonus EXIF (máx 40 puntos)
  const uniquePhotos = new Set(spot.photos.map(p => p.userId));
  const exifBonus = spot.photos.filter(p => p.hasExif).length * 2;
  const liveBonus = spot.photos.filter(p => p.isLive).length * 5;
  score += Math.min(uniquePhotos.size * 3 + exifBonus + liveBonus, 40);

  // 4. Check-ins recientes (máx 30 puntos)
  const recentCheckIns = this.getRecentActivity(spot, 30);
  score += Math.min(recentCheckIns * 2, 30);

  // 5. BONUS: Spot "hot" (últimas 24h)
  const veryRecentActivity = this.getRecentActivity(spot, 1);
  if (veryRecentActivity >= 5) {
    score += 15;
  }

  // 6. Historicidad (máx 20 puntos)
  const daysSinceCreation = this.daysBetween(spot.createdAt, new Date());
  if (daysSinceCreation > 180) score += 20;
  else if (daysSinceCreation > 90) score += 10;
  else if (daysSinceCreation > 30) score += 5;

  // 7. Bono por tipo de spot
  score += this.getTypeSpecificBonus(spot);

  // PENALIZACIONES
  score -= this.calculateDecayPenalty(spot);
  score -= this.getReportPenalty(spot);
  score -= this.getSuspiciousPatternPenalty(spot);

  return Math.max(0, score);
}

function getMethodWeight(method: ValidationMethod): number {
  switch (method) {
    case 'LIVE_PHOTO': return 10;
    case 'PHOTO_UPLOAD': return 5;
    case 'CROWD_REPORT': return 3;
    case 'GPS_PROXIMITY': return 2;
    case 'CHECK_IN': return 1;
    default: return 1;
  }
}
```

---

## 🧠 Heurísticas Inteligentes

### 1. Decaimiento Temporal (Frescura)

**Regla:** Si un spot no tiene actividad por 4 meses, pierde 5 puntos por semana.

```typescript
function calculateDecayPenalty(spot: Spot): number {
  const daysSinceLastActivity = this.daysBetween(spot.lastActivityAt, new Date());

  if (daysSinceLastActivity > 120) { // 4 meses
    const weeksOverdue = Math.floor((daysSinceLastActivity - 120) / 7);
    return weeksOverdue * 5; // -5 puntos por semana
  }

  return 0;
}
```

**Efecto:**
- Mantiene el mapa actualizado
- Evita "spots fantasma"
- Obliga a la comunidad a revalidar

### 2. Diferenciación por Tipo

**Skateshops:**
- Validar horario de apertura
- Penalización si está cerrado fuera de horario comercial
- Check-ins después de las 8 PM marcando "cerrado" = alerta automática

**Street Spots:**
- EXIF de GPS es OBLIGATORIO
- Sin EXIF = penalización del 50%
- La foto debe coincidir con las coordenadas del pin

**Skateparks:**
- Bono por antigüedad (+10 puntos después de 1 año)
- No requieren validación de horario

```typescript
function getTypeSpecificBonus(spot: Spot): number {
  switch (spot.type) {
    case 'SKATESHOP':
      // Validar horario comercial
      const afterHoursClosed = spot.checkIns.filter(c =>
        !isBusinessHour(c.createdAt) && c.isOpen === false
      ).length;

      if (afterHoursClosed > 0) return -10;
      return 5;

    case 'SPOT':
      // Validar EXIF
      const photosWithExif = spot.photos.filter(p => p.hasExif);
      if (photosWithExif.length === 0 && spot.photos.length > 0) {
        return -20;
      }
      return photosWithExif.length * 3;

    case 'SKATEPARK':
      // Bono por antigüedad
      return this.daysBetween(spot.createdAt, new Date()) > 365 ? 10 : 0;
  }
}
```

### 3. Detección de Patrones Sospechosos

```typescript
async function getSuspiciousPatternPenalty(spot: Spot): Promise<number> {
  let penalty = 0;

  // Detectar "círculo de validación"
  const validationPairs = this.findValidationPairs(spot);
  if (validationPairs.length > 3) {
    penalty += 30; // Amigos validándose entre sí
  }

  // Detectar misma IP/dispositivo
  const suspiciousIPs = await this.findSuspiciousIPs(spot);
  if (suspiciousIPs.length > 0) {
    penalty += suspiciousIPs.length * 15;
  }

  // Detectar velocidad no natural (demasiado rápido)
  const validationBurst = this.detectValidationBurst(spot);
  if (validationBurst) {
    penalty += 25;
  }

  return penalty;
}
```

---

## 🔔 Sistema de Notificaciones por Proximidad

### Tipos de Notificaciones

| Tipo | Trigger | Radio | Acción |
|------|---------|-------|--------|
| **SPOT_DISCOVERY** | Spot GHOST cercano | 50m | "¡Descubriste un nuevo spot!" |
| **VALIDATION_REQUEST** | Spot verificado | 50m | "¿Hay gente hoy?" |
| **STALE_SPOT_ALERT** | Spot desactualizado | 100m | "Este spot necesita actualización" |
| **CROWD_WARNING** | Spot "hot" | 100m | "¡Muy lleno ahora!" |

### Flujo de Notificación

```
1. Usuario entra en radio de 200m de spot
   ↓
2. Sistema verifica:
   - ¿Ya validó este spot recientemente?
   - ¿Ya tiene check-in reciente?
   ↓
3. Si NO, esperar 30 segundos
   ↓
4. Mostrar notificación según tipo
   ↓
5. Usuario responde (1 tap)
   ↓
6. Enviar a backend → Procesar validación
   ↓
7. Feedback visual (+3 puntos)
   ↓
8. Notificación se descarta
```

### Implementación Técnica

**Hook de Notificaciones:**
```typescript
export function useProximityNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Watch GPS position
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Consultar backend
        const response = await fetch(
          `/api/proximity/check?lat=${latitude}&lng=${longitude}`
        );
        const data = await response.json();

        // Filtrar no expiradas
        const valid = data.notifications.filter(n =>
          new Date(n.expiresAt) > new Date()
        );

        setNotifications(valid);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { notifications };
}
```

---

## 🌐 API Endpoints

### Core Endpoints

```
POST /api/spots/register
- Registrar nuevo spot
- Body: { name, type, latitude, longitude, photo }
- Response: { spot, status }

POST /api/spots/:id/validate
- Validar spot existente
- Body: { method, latitude, longitude, crowdLevel? }
- Response: { success, pointsEarned }

POST /api/spots/:id/checkin
- Check-in en spot
- Body: { latitude, longitude, crowdLevel?, isOpen? }
- Response: { success, message }

POST /api/spots/:id/report
- Reportar spot (cerrado, fake, etc)
- Body: { reason, details, wasOnLocation }
- Response: { success, reportId }

GET /api/spots/nearby?lat=&lng=&radius=
- Spots cercanos con estado
- Response: { spots, count }

GET /api/spots/hot
- Spots en tendencia (últimas 24h)
- Response: { spots }

GET /api/spots/stale
- Spots que necesitan actualización
- Response: { spots }
```

### Proximity Endpoints

```
GET /api/proximity/check?lat=&lng=
- Verificar notificaciones por proximidad
- Response: { notifications, nearbySpotsCount }

POST /api/proximity/action
- Responder a notificación
- Body: { notificationId, action, data }
- Response: { success, pointsEarned }
```

### Admin Endpoints

```
GET /api/spots/:id/validators
- Lista de validadores del spot
- Response: { validators }

GET /api/users/validator-stats
- Estadísticas del validador
- Response: { score, level, validations, reputation }

POST /api/spots/:id/blind-test
- Prueba ciega a validador
- Body: { question, correctAnswer }
- Response: { success, accuracy }
```

---

## 🎮 Flujo de Usuario Completo

### Escenario 1: Registrar Nuevo Spot

```
1. Usuario está en un lugar sin spot en el mapa
   ↓
2. Sistema GPS detecta ubicación (no hay spots en 200m)
   ↓
3. Notificación: "¿Quieres agregar este spot?"
   ↓
4. Usuario toca "Sí"
   ↓
5. Se abre formulario rápido:
   - Nombre del spot (solo eso)
   - Tipo (Park/Shop/Spot)
   - FOTO (tomada AHORA, no de galería)
   ↓
6. Spot creado con:
   - stage: GHOST
   - confidenceScore: 0
   - Solo visible para el creador
   ↓
7. Usuario comparte enlace con amigos
   ↓
8. Amigos validan (deben estar físicamente ahí, GPS < 50m)
   ↓
9. Al llegar a 10 puntos → stage: REVIEW (amarillo)
   ↓
10. Al llegar a 50 puntos → stage: VERIFIED ✅
    ↓
11. Al llegar a 100 puntos → stage: LEGENDARY 🏆
```

### Escenario 2: Validación Pasiva (UX Mínima)

```
1. Usuario camina por un spot verificado
   ↓
2. GPS detecta: está dentro del spot (< 50m)
   ↓
3. Sistema verifica: ¿Ya validó recientemente?
   - Sí → No hacer nada
   - No → Continuar
   ↓
4. Esperar 30 segundos (para confirmar que está ahí)
   ↓
5. Notificación aparece: "¿Hay mucha gente hoy en [Nombre]?"
   ↓
6. Opciones (1 tap):
   - 🔴 Vacío
   - 🟡 Poca gente
   - 🟠 Hay gente
   - 🔴 Lleno
   ↓
7. Usuario selecciona una opción
   ↓
8. Check-in creado automáticamente
   ↓
9. Feedback: "¡Gracias! +3 puntos"
   ↓
10. Spot actualizado con:
    - lastActivityAt: now
    - isHot: true (por 24h)
    - confidenceScore: +3
```

### Escenario 3: Spot Desactualizado

```
1. Spot verificado no tiene actividad por 4 meses
   ↓
2. Sistema marca: stage: STALE ⚠️
   ↓
3. Usuario entra al área (< 100m)
   ↓
4. Notificación: "⚠️ Este spot necesita actualización"
   ↓
5. Opciones:
   - ✅ Sigue abierto
   - ❌ Cerró
   ↓
6. Si confirma abierto:
   - stage: VERIFIED otra vez
   - confidenceScore: +10
   - lastActivityAt: now
   ↓
7. Si reporta cerrado:
   - Crear SpotReport
   - stage: DEAD (si se confirma)
```

---

## 🛡️ Prevención de Spam

### 1. Validación por Proximidad GPS

```typescript
async function validateGPSProximity(userId: string, spotLat: number, spotLng: number) {
  const userLocation = await getUserCurrentLocation(userId);

  const distance = calculateDistance(
    userLocation.lat, userLocation.lng,
    spotLat, spotLng
  );

  if (distance > 50) {
    throw new Error('Debes estar dentro del spot para validarlo');
  }

  return true;
}
```

### 2. Shadow Ban para Validadores Sospechosos

```typescript
async function detectSuspiciousUser(userId: string): Promise<boolean> {
  // Patrón 1: Siempre valida lo mismo que otro usuario
  const mutualValidations = await findMutualValidationPatterns(userId);
  if (mutualValidations > 5) {
    await reduceCrossValidationWeight(userId);
    return true;
  }

  // Patrón 2: Falla pruebas ciegas
  const blindTests = await getBlindTestResults(userId);
  const accuracy = blindTests.correct / blindTests.total;

  if (accuracy < 0.6 && blindTests.total > 5) {
    await reduceUserReputationWeight(userId, 0.5);
    return true;
  }

  // Patrón 3: Reportes falsos
  const rejectedReports = await countRejectedReportsByUser(userId);
  const totalReports = await countTotalReportsByUser(userId);

  if (totalReports > 5 && rejectedReports / totalReports > 0.7) {
    await markUserForReview(userId);
    return true;
  }

  return false;
}
```

### 3. Heurística de Coincidencia

```typescript
async function handleNewSpotRegistration(newSpot: SpotCreateInput) {
  // Buscar spots en radio de 20 metros
  const nearbySpots = await findNearbySpots(newSpot.latitude, newSpot.longitude, 20);

  if (nearbySpots.length >= 2) {
    return {
      action: 'MERGE_CANDIDATE',
      message: `¿Es este "${nearbySpots[0].name}"? Confirma la ubicación`,
      nearbySpots
    };
  }

  return { action: 'CREATE_NEW' };
}
```

---

## 🎖️ Gamificación

### Niveles de Reputación del Usuario

```typescript
interface UserReputation {
  score: number;
  level: 'NEW' | 'TRUSTED' | 'VETERAN' | 'MASTER';
  validationWeight: number; // 1-5
}

function getUserReputation(userId: string): UserReputation {
  const user = await getUserWithStats(userId);

  let score = 0;
  score += user.validationsGiven * 1;
  score += user.spotsVerified * 5;
  score += user.reportsAccepted * 3;
  score -= user.reportsRejected * 10; // Penalizaciones

  if (score < 20) return { score, level: 'NEW', validationWeight: 1 };
  if (score < 100) return { score, level: 'TRUSTED', validationWeight: 2 };
  if (score < 500) return { score, level: 'VETERAN', validationWeight: 3 };
  return { score, level: 'MASTER', validationWeight: 5 };
}
```

### Badges

```
🗺️ Explorer   - 5 validaciones
✅ Validator   - 20 validaciones
🛡️ Guardian   - 50 validaciones
🏆 Legend      - 100 validaciones
🔥 Hot Spotter - Validó 10 spots "hot"
👁️ Watcher    - Reportó 5 spots cerrados
```

---

## ✅ Checkpoints MVP

### Fase 1: MVP Core (2-3 semanas)

- [x] **Checkpoint 1.1:** Modelo de datos básico ✅ COMPLETADO
  - [x] Tablas: Spot (actualizada), SpotValidation, SpotCheckIn, SpotPhoto, SpotReport, UserReputation
  - [x] Enums básicos: SpotType, SpotStage, ValidationMethod
  - [x] Migración de Prisma (aplicada con db push)
  - [x] Tipos TypeScript creados en src/types/spot-validation.ts
  - [x] Todos los índices necesarios creados

- [x] **Checkpoint 1.2:** API de registro ✅ COMPLETADO
  - [x] `POST /api/spots/register` - Creado
  - [x] Validación GPS básica (máx 50 metros)
  - [x] Detección de spots duplicados
  - [x] Creación automática de validación inicial
  - [x] `GET /api/spots/nearby` - Buscar spots cercanos
  - [x] `POST /api/spots/:id/validate` - Validar spots
  - [x] Algoritmo de confianza básico implementado
  - [x] Sistema de reputación de usuarios (UserReputation)

- [x] **Checkpoint 1.3:** Algoritmo de confianza simple ✅ COMPLETADO
  - [x] Validaciones únicas (Set de userIds)
  - [x] Peso por método (GPS: 2, FOTO: 5, LIVE: 10, CHECK_IN: 1, CROWD: 3)
  - [x] Actualización automática de stage (GHOST → REVIEW → VERIFIED → LEGENDARY)
  - [x] Máximo score de 200 puntos

- [x] **Checkpoint 1.4:** Mapa con nuevos estados ✅ COMPLETADO
  - [x] Iconos por stage (GHOST: oculto, REVIEW: 🟡, VERIFIED: ✅, LEGENDARY: 🏆)
  - [x] Sistema de storage con Supabase configurado
  - [x] Componente PhotoUploader creado
  - [x] API upload/delete de fotos (`/api/upload/photo`)
  - [x] API para agregar fotos a spots (`/api/spots/:id/photos`)

### Fase 2: Validaciones (2-3 semanas)

- [ ] **Checkpoint 2.1:** API de validación
  - [ ] `POST /api/spots/:id/validate`
  - [ ] Verificación GPS obligatoria
  - [ ] Metadata EXIF de fotos

- [ ] **Checkpoint 2.2:** Check-ins
  - [ ] `POST /api/spots/:id/checkin`
  - [ ] Reporte de ocupación
  - [ ] Para skateshops: isOpen

- [ ] **Checkpoint 2.3:** Notificaciones por proximidad
  - [ ] `GET /api/proximity/check`
  - [ ] Hook `useProximityNotifications`
  - [ ] Componente de notificación

- [ ] **Checkpoint 2.4:** UX de "Una Pregunta"
  - [ ] Notificación después de 30s
  - [ ] 4 botones de ocupación
  - [ ] Feedback visual (+3 puntos)

### Fase 3: Heurísticas Avanzadas (2-3 semanas)

- [ ] **Checkpoint 3.1:** Decaimiento temporal
  - [ ] Job programado (cada hora)
  - [ ] Penalización por inactividad
  - [ ] Cambio automático de stage

- [ ] **Checkpoint 3.2:** Diferenciación por tipo
  - [ ] Validación de horarios (shops)
  - [ ] EXIF obligatorio (spots)
  - [ ] Bono antigüedad (parks)

- [ ] **Checkpoint 3.3:** Detección de spam
  - [ ] Patrones de validación cruzada
  - [ ] Detección de IPs sospechosas
  - [ ] Validación ciega

- [ ] **Checkpoint 3.4:** Reportes
  - [ ] `POST /api/spots/:id/report`
  - [ ] Flujo de revisión
  - [ ] Cambio a stage DEAD

### Fase 4: Gamificación (1-2 semanas)

- [ ] **Checkpoint 4.1:** Sistema de reputación
  - [ ] Cálculo de score de usuario
  - [ ] Niveles (NEW → MASTER)
  - [ ] Peso de validación

- [ ] **Checkpoint 4.2:** Badges
  - [ ] Asignación de badges
  - [ ] Perfil público
  - [ ] Leaderboard

- [ ] **Checkpoint 4.3:** Notificaciones de logros
  - [ ] "¡Nuevo badge desbloqueado!"
  - [ ] "¡Subiste de nivel!"
  - [ ] Compartir en redes

### Fase 5: Polish & Optimización (1-2 semanas)

- [ ] **Checkpoint 5.1:** Performance
  - [ ] Optimizar queries
  - [ ] Caching de spots cercanos
  - [ ] Índices de BD

- [ ] **Checkpoint 5.2:** Testing
  - [ ] Tests unitarios (algoritmos)
  - [ ] Tests de integración (APIs)
  - [ ] Tests E2E (flujo completo)

- [ ] **Checkpoint 5.3:** Documentación
  - [ ] Guía de usuario
  - [ ] API docs
  - [ ] Deploy checklist

---

## 📊 Métricas de Éxito

### Métricas Técnicas
- Time to validate: < 2 minutos desde registro
- GPS accuracy: < 10 metros en 95% de casos
- False positive rate: < 5%
- False negative rate: < 10%

### Mé- spots verifyrate: > 60% de spots verificados en 30 días
- spots decay rate: < 10% de spots stale después de 6 meses
- User engagement: > 50% de usuarios hacen check-ins mensuales
- Validation rate: > 3 validaciones por usuario/mes

### Métricas de Negocio
- User retention: > 70% después de 30 días
- Daily active users (DAU): > 20% de MAU
- Check-ins per session: > 2 por usuario
- Notification response rate: > 40%
- Report accuracy: > 80% de reportes confirmados

---

## 🚀 Próximos Pasos

1. **Revisar este documento** con el equipo
2. **Aprobar el diseño** del modelo de datos
3. **Priorizar MVP Checkpoints** según recursos
4. **Asignar tareas** al equipo de desarrollo
5. **Definir timeline** (estimado: 8-10 semanas MVP completo)
6. **Setup del ambiente** de desarrollo
7. **Comenzar con Checkpoint 1.1** (modelo de datos)

---

## 📝 Notas Adicionales

### Consideraciones Técnicas
- Usar **PostGIS** para queries geoespaciales eficientes
- Implementar **caching** con Redis para spots cercanos
- **WebSockets** para actualizaciones en tiempo real del mapa
- **CDN** para fotos de spots
- **Background jobs** para decaimiento y recálculos

### Consideraciones de UX
- Onboarding tutorial para primeros ```typescript
// Momento 1: Crear la interfaz de usuario (UI) para el primer registro
// Guía interactiva que explique cómo añadir spots
// Permita que los usuarios entiendan el proceso intuitivamente
// Simplificar el registro al máximo posible

### Consideraciones Legales y Privacidad
- Requerir **consentimiento explícito** para GPS
- Permitir **opt-out** de notificaciones
- **Política de privacidad** transparente
- **GDPR compliance** para usuarios UE
- **Términos de servicio** claros sobre contenido generado

### Estrategia de Rollout
- **Lanzamiento beta** con 100 usuarios
- **Test en 2 ciudades** primero
- **Feedback loops** rápidos
- **Iteración ágil** basada en métricas
- **Expansión gradual** a más ciudades

---

**Fin del Documento de Diseño v2.0**

---

*Este documento es vivo y debe actualizarse conforme avanza el desarrollo.*
