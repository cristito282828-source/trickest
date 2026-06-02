# 🗺️ ROADMAP - Trickest Skate Platform

> **Versión:** 1.0
> **Última actualización:** Enero 27, 2026
> **Estado:** Activo en desarrollo

---

## 📍 **DONDE ESTAMOS AHORA**

### **✅ Features Completadas**

#### **Core Platform**
- [x] Sistema de autenticación (Google OAuth + Credentials)
- [x] Sistema de challenges (10 niveles + bonus)
- [x] Submission de videos (YouTube)
- [x] Sistema de evaluación por jueces (score 0-100)
- [x] Perfiles de usuario con redes sociales
- [x] Sistema de equipos (Teams)
- [x] Invitaciones a equipos
- [x] Dashboard para skaters y jueces

#### **Spots System**
- [x] Mapa interactivo de spots
- [x] Registro de spots (skateparks, street, skateshops)
- [x] Sistema de validación social (confidence score)
- [x] Check-ins GPS
- [x] Upload de fotos de spots
- [x] Reportes de spots
- [x] **Comentarios en spots** ✨ NUEVO
- [x] **Hilos de comentarios (respuestas)** ✨ NUEVO
- [x] **Votos en comentarios** ✨ NUEVO
- [x] **Notificaciones de comentarios** ✨ NUEVO

#### **Comments System (Recién Completado)**
- [x] Comentarios principales en spots
- [x] Respuestas a comentarios (threading)
- [x] Sistema de likes/dislikes en comentarios
- [x] Contador de respuestas
- [x] Notificaciones a:
  - [x] Autor del spot cuando hay comentarios
  - [x] Otros comentaristas
  - [x] Autor de comentario cuando alguien responde

---

## 🚀 **LO QUE VIENE PRONTO**

### **Fase 1: Completar Comments (Semana Actual)**

#### **Pendientes menores**
- [ ] Modal de edición de comentarios
- [ ] Moderación de comentarios (ocultar inapropiados)
- [ ] Notificaciones en tiempo real (WebSocket o polling)
- [ ] Badge de notificaciones no leídas en navbar

**Prioridad:** MEDIA
**Estimado:** 3-5 días

---

### **Fase 2: SkateWorld - Economía Fantasy (2-3 semanas)**

Esta es la PRÓXIMA GRAN FEATURE. Ver documento completo: [SKATEWORLD-IMPLEMENTACION-V2.md](SKATEWORLD-IMPLEMENTATION-V2.md)

#### **2.1 Wallet & SkateCoins (Semana 1)**

**Base de datos:**
- [ ] Modelo `UserWallet` (billetera de SKT)
- [ ] Modelo `Transaction` (historial de transacciones)
- [ ] Relaciones con User existente

**API:**
- [ ] `GET /api/wallet/balance` - Ver saldo SKT
- [ ] `GET /api/wallet/transactions` - Historial
- [ ] `POST /api/wallet/grant` - Otorgar SKT (admin)

**Frontend:**
- [ ] `/wallet` - Página de billetera
- [ ] Mostrar saldo con animaciones
- [ ] Tabla de transacciones
- [ ] Gráfico de ganancias/pérdidas

**Sistema de recompensas:**
- [ ] 20 SKT por submission aprobada
- [ ] 10 SKT por challenge completado
- [ ] 2 SKT por nuevo seguidor
- [ ] 1 SKT por login diario
- [ ] 100 SKT por top semanal

#### **2.2 Skater Market (Semana 2)**

**Base de datos:**
- [ ] Modelo `SkaterMarket` (mercado de skaters)
- [ ] Modelo `MarketListing` (skaters en venta)

**API:**
- [ ] `GET /api/market/skaters` - Listar skaters
- [ ] `POST /api/market/list` - Poner a la venta
- [ ] `POST /api/market/buy` - Comprar skater
- [ ] `POST /api/market/cancel-listing` - Cancelar venta

**Lógica de pricing:**
```
Precio = (score * 0.5) + (challenges * 15) + (followers * 1) * (1 + transfers * 0.1)
```

**Frontend:**
- [ ] `/market` - Marketplace de skaters
- [ ] Grid de skaters con stats
- [ ] Filtros (precio, potencial, ubicación)
- [ ] Modal de compra con confirmación

#### **2.3 Fantasy Teams (Semana 3)**

**Base de datos:**
- [ ] Extender modelo `Team` existente
- [ ] Modelo `FantasyTeam` (stats de team)
- [ ] Modelo `FantasyRoster` (skaters en team)

**API:**
- [ ] `POST /api/fantasy-team/create` - Crear team fantasy
- [ ] `GET /api/fantasy-team/my-team` - Ver mi team
- [ ] `POST /api/fantasy-team/add-skater` - Añadir skater
- [ ] `DELETE /api/fantasy-team/remove-skater` - Remover skater

**Frontend:**
- [ ] `/team` - Mi equipo fantasy
- [ ] Ver stats del team
- [ ] Añadir/eliminar skaters
- [ ] Leaderboard de teams por valor

---

### **Fase 3: AI Judge System (Opcional, 1-2 semanas)**

Ver documento: [JUDGE_AI_COMPARISON.md](JUDGE_AI_COMPARISON.md)

#### **3.1 Análisis de Videos con AI**

**Infraestructura:**
- [ ] Configurar GLM-4V API key
- [ ] Crear librería `lib/glm.ts`
- [ ] Prompt engineering para skate

**Scripts:**
- [x] `analyze-existing-submissions.js` - Analizar con AI
- [x] `judge-comparison-report.js` - Reporte visual
- [x] `judge-optimizer.js` - Optimizar prompt

**Modelo de datos:**
- [ ] Modelo `ScoutReport` (reportes de AI)

**Objetivo:**
- Diferencia promedio con jueces humanos: <10 puntos
- Acuerdo excelente (≤5 pts): >60% de los casos
- Confidence mínimo: 0.6

#### **3.2 Integración en Production**

**Opciones de uso:**
1. **AI como segunda opinión** - Promediar humano + AI
2. **AI como pre-filtro** - Auto-aprobar si 60-85 puntos
3. **AI como verificador** - Revisar casos dudosos

---

## 🎯 **FEATURES FUTURAS (3-6 meses)**

### **Spots System Enhancements**

#### **Validación Mejorada**
- [ ] Algoritmo de decaimiento de spots (stale/dead)
- [ ] Sistema de "hot spots" (mucha actividad reciente)
- [ ] Badges para validadores frecuentes
- [ ] Leaderboard de top validadores

#### **Spots Social**
- [ ] Events en spots (sessions, contests)
- [ ] Check-in con fotos (live photo)
- [ ] Comentarios con multimedia (fotos, videos)
- [ ] Reviews con ratings (estrellas)

### **Competitions & Contests**

#### **Challenges Avanzados**
- [ ] Challenges semanales/mensuales
- [ ] Competencias entre skaters
- [ ] Trophies y badges virtuales
- [ ] Sistema de ligas por región/ciudad

#### **Live Events**
- [ ] Crear eventos en spots
- [ ] Inscripción a contests
- [ ] Live scoring durante eventos
- [ ] Streaming integrado

### **Social Features**

#### **Social Ampliado**
- [ ] Feed de actividad (tipo Instagram)
- [ ] Stories de skaters (videos efímeros)
- [ ] Direct messaging entre usuarios
- [ ] Groups/Comunidades por interés

#### **User Generated Content**
- [ ] Upload de fotos/perfil
- [ ] Galería de videos favoritos
- [ ] Playlists de trucos
- [ ] Tutorial creation (skaters enseñan)

### **Analytics & Insights**

#### **Para Skaters**
- [ ] Progreso personal (gráficos de mejora)
- [ ] Comparación con amigos
- [ ] Estadísticas de rendimiento
- [ ] Análisis de fortalezas/debilidades

#### **Para Admins**
- [ ] Dashboard de actividad del platform
- [ ] Análisis de retención de usuarios
- [ ] Métricas de engagement
- [ ] Export de datos para análisis

---

## 🎨 **MEJORAS DE UX/UI**

### **Diseño Visual**
- [ ] Implementar [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) completo
- [ ] Animaciones y transiciones
- [ ] Dark/light mode toggle
- [ ] Temas personalizados

### **Performance**
- [ ] Optimizar loading de spots
- [ ] Lazy loading de imágenes
- [ ] Infinite scroll en feeds
- [ ] Caching inteligente

### **Mobile App**
- [ ] PWA (Progressive Web App)
- [ ] App nativa iOS/Android (React Native)
- [ ] Push notifications
- [ ] Offline mode

---

## 🔧 **TECHNICAL DEBT**

### **Refactoring Pendiente**

#### **Organización de Componentes**
- [ ] Migrar a estructura Atomic Design
- [ ] Separar atoms/molecules/organisms
- [ ] Documentar componentes en Storybook

#### **Código Legado**
- [ ] Migrar `/dashboard/jueces` a `/dashboard/judges`
- [ ] Estandarizar nombres de componentes
- [ ] Remover código duplicado
- [ ] Mejorar manejo de errores

#### **Testing**
- [ ] Unit tests (Jest/Vitest)
- [ ] Integration tests (API)
- [ ] E2E tests (Playwright)
- [ ] Test coverage >70%

---

## 🚀 **EXPANSIÓN FUTURA**

### **Nuevos Módulos**

#### **Skate Shop (E-commerce)**
- [ ] Catálogo de productos
- [ ] Pasarela de pagos (Stripe)
- [ ] Gestión de inventario
- [ ] Pedidos y envíos

#### **Skate Lessons**
- [ ] Directorio de instructores
- [ ] Reserva de clases
- [ ] Pagos a instructores
- [ ] Reviews de instructores

#### **Travel & Trips**
- [ ] Skate trips (viajes grupales)
- [ ] Reserva de alojamientos
- [ ] Itinerarios de spots
- [ ] Organización de viajes

---

## 📊 **MÉTRICAS DE ÉXITO**

### **Engagement**
- [ ] DAU (Daily Active Users) >100
- [ ] MAU (Monthly Active Users) >500
- [ ] 50+ submissions/semana
- [ ] 100+ spots registrados

### **Retención**
- [ ] Retención D1 >40%
- [ ] Retención D30 >20%
- [ ] Retención D90 >10%

### **Calidad**
- [ ] <2 bugs críticos por mes
- [ ] Uptime >99.5%
- [ ] Load time <3s

---

## 🎯 **PRIORIDADES**

### **ALTA (Próximas 4 semanas)**
1. ✅ Completar sistema de comentarios
2. 🔄 Wallet & SkateCoins
3. 🔄 Skater Market MVP

### **MEDIA (4-8 semanas)**
4. 🔄 Fantasy Teams
5. 🔄 AI Judge (MVP)
6. 🔄 Leaderboards

### **BAJA (8+ semanas)**
7. Spots enhancements
8. Social features
9. Mobile app
10. E-commerce

---

## 🤝 **CONTRIBUCIONES**

Este roadmap es vivo y se actualiza según:

- Feedback de la comunidad
- Cambios en prioridades de negocio
- Disponibilidad de desarrollo
- Retorno de inversión (ROI)

### **Cómo Proponer Features**

1. Abrir issue en GitHub describiendo la feature
2. Explicar el valor para skaters/jueces
3. Proponer solución técnica de alto nivel
4. Estimar complejidad (pequeño/mediano/grande)

---

## 📝 **NOTAS**

- **Fechas:** Estimadas, sujetas a cambios
- **Prioridades:** Pueden cambiar según necesidades del negocio
- **Features:** Algunos pueden ser descartados o reemplazados
- **Recursos:** Dependientes del tamaño del equipo

---

**Última actualización:** Enero 27, 2026
**Próxima revisión:** Febrero 15, 2026

🛹 **Let's build the future of skate!**
