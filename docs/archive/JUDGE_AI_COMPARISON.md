# 🤖 SISTEMA DE JUEZ VIRTUAL AI
## Comparación y Optimización de Calificaciones con GLM-4V

---

## 📋 TABLA DE CONTENIDOS

1. [Descripción del Sistema](#descripción-del-sistema)
2. [Configuración Inicial](#configuración-inicial)
3. [Flujo de Trabajo](#flujo-de-trabajo)
4. [Scripts Disponibles](#scripts-disponibles)
5. [Interpretación de Resultados](#interpretación-de-resultados)
6. [Optimización Continua](#optimización-continua)

---

## 🎯 DESCRIPCIÓN DEL SISTEMA

Este sistema permite:

✅ **Analizar videos existentes** con GLM-4V (AI vision model)
✅ **Comparar calificaciones** de jueces humanos vs juez AI
✅ **Generar reportes visuales** con estadísticas y gráficos
✅ **Detectar patrones de error** para mejorar el prompt
✅ **Optimizar automáticamente** el juez AI basado en feedback

**Objetivo:** Crear un juez virtual que se alinee lo más posible con los criterios de los jueces humanos.

---

## ⚙️ CONFIGURACIÓN INICIAL

### **1. Agregar API Key de GLM**

```bash
# Editar .env.local
GLM_API_KEY=tu_api_key_aqui
```

**¿Cómo obtener API key?**
1. Ir a: https://open.bigmodel.cn/
2. Registrarse (gratis con créditos iniciales)
3. Crear API key en el dashboard
4. Costo aprox: $0.001-0.01 por análisis de video

### **2. Verificar modelo ScoutReport en schema**

El modelo `ScoutReport` debe existir en `prisma/schema.prisma`:

```prisma
model ScoutReport {
  id               Int      @id @default(autoincrement())
  skaterEmail      String
  videoUrl         String?
  analysis         Json
  techniqueScore   Int?
  olympicPotential Int?
  suggestedPrice   Decimal? @db.Decimal(10, 2)
  detectedTricks   String[]
  comparisonNotes  String?
  modelVersion     String?
  confidence       Decimal? @db.Decimal(3, 2)
  createdAt        DateTime @default(now())

  skater           User     @relation(fields: [skaterEmail], references: [email])

  @@index([skaterEmail])
  @@index([createdAt])
  @@map("scout_reports")
}
```

Ejecutar migrations si no existe:

```bash
npx prisma db push
```

### **3. Verificar que hay submissions para analizar**

```bash
node scripts/check-submissions.js
```

Este script verifica que tengas submissions con:
- `status: 'approved'`
- `score: NOT NULL` (calificación humana)
- `videoUrl: NOT NULL`

---

## 🔄 FLUJO DE TRABAJO

### **Paso 1: Analizar submissions existentes**

```bash
node scripts/analyze-existing-submissions.js
```

**Qué hace:**
1. Obtiene las últimas 50 submissions aprobadas
2. Envía cada video a GLM-4V para análisis
3. Compara score humano vs AI
4. Guarda resultados en `ScoutReport`
5. Muestra estadísticas en consola

**Salida esperada:**
```
🎬 Analizando submissions existentes con AI...

[1/50] Analizando: Juan Pérez - Ollie
  Video: https://youtube.com/watch?v=xxx
  Score humano: 75
  Score AI: 78
  Diferencia: 3 puntos (4.0%)
  Acuerdo: EXCELLENT

...

📊 REPORTE FINAL
Total submissions analizadas: 48
Diferencia promedio: 8.3 puntos
Diferencia promedio: 11.2%

Distribución de acuerdos:
  EXCELLENT   ████████████████████████████ 30 (62.5%)
  GOOD         ██████████████ 12 (25.0%)
  ACCEPTABLE   ████ 4 (8.3%)
  POOR         ████ 2 (4.2%)

✅ EXCELENTE: El juez virtual está muy alineado con jueces humanos
```

### **Paso 2: Generar reporte visual**

```bash
node scripts/judge-comparison-report.js
```

**Qué hace:**
- Genera archivo HTML `judge-ai-comparison-report.html`
- Contiene gráficos interactivos con Chart.js
- Tablas detalladas con todas las comparaciones
- Análisis por juez y por dificultad

**Abrir reporte:**
```bash
# En Windows
start judge-ai-comparison-report.html

# En Mac
open judge-ai-comparison-report.html

# En Linux
xdg-open judge-ai-comparison-report.html
```

**El reporte incluye:**
- 📊 Gráfico de distribución de acuerdos
- 📈 Scatter plot comparando scores
- 🎯 Análisis por nivel de dificultad
- 👨‍⚖️ Desempeño por juez individual
- 📋 Tabla detallada de cada submission

### **Paso 3: Optimizar juez AI (Opcional)**

```bash
node lib/judge-optimizer.js
```

**Qué hace:**
- Analiza patrones de error sistemáticos
- Genera recomendaciones de ajuste
- Sugiere modificaciones al prompt
- Exporta `judge-optimization-report.json`

---

## 📊 SCRIPTS DISPONIBLES

### **1. `analyze-existing-submissions.js`**

Analiza submissions existentes con AI y compara con jueces humanos.

```bash
node scripts/analyze-existing-submissions.js
```

**Opciones:**
- Edita `take: 50` para analizar más o menos submissions
- Edita `setTimeout` para cambiar pausa entre requests (evitar rate limiting)

### **2. `judge-comparison-report.js`**

Genera reporte visual HTML con gráficos.

```bash
node scripts/judge-comparison-report.js
```

**Salida:** `judge-ai-comparison-report.html`

### **3. `judge-optimizer.js`** (Librería)

Analiza patrones y genera recomendaciones para mejorar el AI.

```bash
node lib/judge-optimizer.js
```

**Salida:** `judge-optimization-report.json`

---

## 📈 INTERPRETACIÓN DE RESULTADOS

### **Niveles de Acuerdo**

| Nivel | Diferencia | Interpretación | Acción |
|-------|-----------|----------------|--------|
| **EXCELENTE** | ≤5 pts | AI muy alineado con humanos ✅ | Usar AI como segunda opinión confiable |
| **BUENO** | 6-10 pts | AI aceptable ⚠️ | Usar AI como referencia, verificar casos extremos |
| **ACEPTABLE** | 11-15 pts | AI necesita ajustes ⚠️ | No usar como única autoridad, requiere supervisión |
| **POOR** | >15 pts | AI requiere reentrenamiento ❌ | NO usar en producción, ajustar prompt |

### **Métricas Clave**

#### **1. Correlación General**
```
Diferencia promedio < 10 puntos = ✅ Buen sistema
Diferencia promedio 10-15 puntos = ⚠️ Necesita ajustes
Diferencia promedio > 15 puntos = ❌ Requiere cambios importantes
```

#### **2. Sesgo Sistemático**
```
Si AI > Humano consistentemente:
→ El AI es demasiado generoso
→ Reducir pesos de la fórmula en 10-15%

Si AI < Humano consistentemente:
→ El AI es demasiado estricto
→ Aumentar pesos de la fórmula en 10-15%
```

#### **3. Por Dificultad**
```
Verificar si el error es mayor en cierto nivel:
- easy: Debe tener menor error (trucos simples)
- expert: Mayor error aceptable (subjetividad alta)
```

#### **4. Por Juez**
```
Algunos jueces pueden ser más estrictos/generosos
Comparar la alineación de cada juez con el AI
Si un juez tiene correlación muy baja, investigar por qué
```

---

## 🔄 OPTIMIZACIÓN CONTINUA

### **Ciclo de Mejora**

```
1. Analizar submissions → Obtener datos
2. Generar reporte → Identificar problemas
3. Optimizar prompt → Ajustar criterios
4. Re-analizar → Verificar mejoras
5. Repetir cada 100 submissions o semanalmente
```

### **Ajustes Comunes**

#### **Ajuste 1: Modificar pesos de la fórmula**

```javascript
// Original (demasiado alto)
const finalScore =
  (technique * 0.30) +
  (execution * 0.30) +
  (style * 0.20) +
  (difficulty * 0.20);

// Ajustado (reducir 10%)
const finalScore =
  (technique * 0.27) +
  (execution * 0.27) +
  (style * 0.18) +
  (difficulty * 0.18);
```

#### **Ajuste 2: Modificar prompt**

**Prompt demasiado estricto:**
```
"No otorgues puntos >80 a menos que sea EXCELENTE"
```

**Prompt más equilibrado:**
```
"Otorga 70-80 puntos para ejecuciones limpias de trucos intermedios.
Otorga 80-90 para ejecuciones excelentes con creatividad.
Reserva 90-100 para nivel profesional."
```

#### **Ajuste 3: Agregar reglas por dificultad**

```javascript
// Agregar al prompt según dificultad:
if (difficulty === 'easy') {
  prompt += `
  Para nivel fácil, sé estricto en la forma básica:
  - Ollie/kickflip deben estar muy limpios para >70 puntos
  - Pequeños errores restan puntos significativamente
  `;
} else if (difficulty === 'expert') {
  prompt += `
  Para nivel experto, valora la complejidad:
  - Intentos de trucos complejos merecen 60+ aunque no salgan perfectos
  - La creatividad y progresión cuentan significativamente
  `;
}
```

---

## 🚀 USO EN PRODUCCIÓN

### **Opción 1: AI como segunda opinión**

```typescript
// app/api/submissions/evaluate/route.ts
export async function POST(req: Request) {
  const { submissionId } = await req.json();

  // 1. Evaluación del juez humano
  const humanEvaluation = await getHumanEvaluation(submissionId);

  // 2. Evaluación del AI
  const aiEvaluation = await analyzeWithAI(submissionId);

  // 3. Si hay discrepancia >15, requerir revisión
  if (Math.abs(humanEvaluation.score - aiEvaluation.score) > 15) {
    return {
      requiresReview: true,
      humanScore: humanEvaluation.score,
      aiScore: aiEvaluation.score,
      message: 'Discrepancia significativa. Requiere revisión adicional.'
    };
  }

  // 4. Promediar si están cerca
  const finalScore = Math.round(
    (humanEvaluation.score + aiEvaluation.score) / 2
  );

  return { score: finalScore };
}
```

### **Opción 2: AI como pre-filtro**

```typescript
// 1. AI evalúa primero (rápido)
const aiScore = await analyzeWithAI(submissionId);

// 2. Si está en rango aceptable, se aprueba automáticamente
if (aiScore >= 60 && aiScore <= 85) {
  return { autoApproved: true, score: aiScore };
}

// 3. Si es outlier, requiere juez humano
if (aiScore < 50 || aiScore > 90) {
  return { requiresHumanJudge: true, reason: 'Outlier detectado' };
}
```

---

## 📝 EJEMPLO DE USO COMPLETO

```bash
# 1. Analizar 50 submissions recientes
node scripts/analyze-existing-submissions.js

# 2. Generar reporte visual
node scripts/judge-comparison-report.js

# 3. Abrir reporte en navegador
start judge-ai-comparison-report.html

# 4. Si la diferencia promedio es >10, optimizar
node lib/judge-optimizer.js

# 5. Aplicar ajustes recomendados al prompt en lib/judge-optimizer.js

# 6. Re-analizar para verificar mejoras
node scripts/analyze-existing-submissions.js

# 7. Comparar antes vs después
node scripts/judge-comparison-report.js
```

---

## ⚠️ LIMITACIONES CONOCIDAS

1. **Videos de baja calidad** → AI no puede analizar bien si el video es oscuro, borroso o mal filmado
2. **Trucos muy técnicos** → AI puede confundir trick variations (ej: treflip vs varial heelflip)
3. **Estilo subjetivo** → La "creatividad" es difícil de objetivar
4. **Confianza del modelo** → Si confidence < 0.6, verificar con juez humano

**Solución:** Implementar umbrales de confianza y verificación humana para casos dudosos.

---

## 🎯 PRÓXIMOS PASOS

### **Fase 1: Pruebas (1 semana)**
- [ ] Analizar 50 submissions existentes
- [ ] Generar reporte inicial
- [ ] Identificar patrones de error
- [ ] Ajustar prompt inicial

### **Fase 2: Validación (2 semanas)**
- [ ] Usar AI como segunda opinión en 100 submissions nuevas
- [ ] Recopilar feedback de jueces
- [ ] Comparar vs evaluaciones humanas
- [ ] Ajustar según feedback

### **Fase 3: Producción (después)**
- [ ] Definir protocolo de uso (AI solo, AI+humano, etc.)
- [ ] Implementar umbrales de confianza
- [ ] Crear sistema de feedback loop continuo
- [ ] Monitorear performance semanalmente

---

**¿Listo para empezar? Ejecuta:**

```bash
node scripts/analyze-existing-submissions.js
```

**¡Genera tu primer reporte de comparación Juez Humano vs AI! 🚀**
