/**
 * LIB: Optimizador de Juez AI
 *
 * Ajusta el prompt y parámetros del AI basado en feedback humano
 * para mejorar la correlación entre jueces humanos y AI
 */

const fs = require('fs');
const path = require('path');

/**
 * Analizar discrepancias y generar recomendaciones
 */
async function optimizeJudge() {
  const prisma = require('@prisma/client').PrismaClient;
  const pr = new prisma.PrimaClient();

  console.log('🔧 Analizando desempeño del juez AI...\n');

  // Obtener reportes recientes
  const reports = await pr.scoutReport.findMany({
    where: {
      analysis: {
        path: ['submissionId'],
        not: null,
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      skater: {
        select: {
          name: true,
          email: true,
        }
      }
    }
  });

  // Enriquecer con scores humanos
  const enriched = [];

  for (const report of reports) {
    const submission = await pr.submission.findUnique({
      where: { id: report.analysis.submissionId },
      include: {
        challenge: { select: { difficulty: true } }
      }
    });

    if (!submission?.score) continue;

    enriched.push({
      report,
      humanScore: submission.score,
      aiScore: report.techniqueScore || 0,
      difference: Math.abs(submission.score - (report.techniqueScore || 0)),
      difficulty: submission.challenge.difficulty,
    });
  }

  // Analizar patrones de error
  const analysis = analyzeErrorPatterns(enriched);

  // Generar recomendaciones
  const recommendations = generateRecommendations(analysis);

  // Mostrar resultados
  console.log('📊 ANÁLISIS DE ERRORES:\n');

  Object.entries(analysis.patterns).forEach(([key, value]) => {
    console.log(`${key}:`);
    console.log(`  Casos: ${value.count}`);
    console.log(`  Error promedio: ${value.avgError.toFixed(1)} puntos`);
    console.log(`  Tendencia: ${value.trend}\n`);
  });

  console.log('\n💡 RECOMENDACIONES:\n');
  recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });

  // Guardar análisis
  const outputPath = './judge-optimization-report.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalAnalyzed: enriched.length,
    analysis,
    recommendations,
  }, null, 2));

  console.log(`\n✅ Análisis guardado en: ${outputPath}\n`);

  await pr.$disconnect();
}

/**
 * Detectar patrones de error
 */
function analyzeErrorPatterns(data) {
  const patterns = {
    'Sistematicamente alto (AI > Humano)': {
      count: 0,
      avgError: 0,
      trend: '',
    },
    'Sistematicamente bajo (AI < Humano)': {
      count: 0,
      avgError: 0,
      trend: '',
    },
    'Por nivel de dificultad': {
      easy: { count: 0, avgError: 0 },
      medium: { count: 0, avgError: 0 },
      hard: { count: 0, avgError: 0 },
      expert: { count: 0, avgError: 0 },
    }
  };

  data.forEach(({ humanScore, aiScore, difficulty }) => {
    const diff = aiScore - humanScore;

    // Tendencia general
    if (diff > 10) {
      patterns['Sistematicamente alto (AI > Humano)'].count++;
      patterns['Sistematicamente alto (AI > Humano)'].avgError += Math.abs(diff);
    } else if (diff < -10) {
      patterns['Sistematicamente bajo (AI < Humano)'].count++;
      patterns['Sistematicamente bajo (AI < Humano)'].avgError += Math.abs(diff);
    }

    // Por dificultad
    if (patterns['Por nivel de dificultad'][difficulty]) {
      patterns['Por nivel de dificultad'][difficulty].count++;
      patterns['Por nivel de dificultad'][difficulty].avgError += Math.abs(humanScore - aiScore);
    }
  });

  // Calcular promedios
  Object.values(patterns).forEach(pattern => {
    if (pattern.count > 0) {
      pattern.avgError /= pattern.count;
      pattern.trend = pattern.avgError < 10 ? '✅ Bueno' : pattern.avgError < 15 ? '⚠️ Aceptable' : '❌ Necesita mejora';
    }
  });

  return { patterns };
}

/**
 * Generar recomendaciones de ajuste
 */
function generateRecommendations(analysis) {
  const recommendations = [];

  const highScores = analysis.patterns['Sistematicamente alto (AI > Humano)'];
  const lowScores = analysis.patterns['Sistematicamente bajo (AI < Humano)'];

  // Recomendación 1: Ajuste general
  if (highScores.count > lowScores.count * 1.5) {
    recommendations.push('El AI tiende a puntuar ALTO. Considera reducir los pesos de los componentes en un 10-15%');
    recommendations.push('Ajusta el fórmula: finalScore = (technique * 0.25 + execution * 0.25 + style * 0.20 + difficulty * 0.20)');
  } else if (lowScores.count > highScores.count * 1.5) {
    recommendations.push('El AI tiende a puntuar BAJO. Considera aumentar los pesos de los componentes en un 10-15%');
    recommendations.push('Ajusta el fórmula: finalScore = (technique * 0.35 + execution * 0.35 + style * 0.20 + difficulty * 0.20)');
  }

  // Recomendación 2: Por dificultad
  const byDifficulty = analysis.patterns['Por nivel de dificultad'];
  const worstDifficulty = Object.entries(byDifficulty)
    .sort(([, a], [, b]) => b.avgError - a.avgError)[0];

  if (worstDifficulty[1].avgError > 15) {
    recommendations.push(`El AI tiene dificultades con nivel ${worstDifficulty[0]}. Agrega instrucciones específicas en el prompt para este nivel.`);
  }

  // Recomendación 3: Confidence threshold
  const avgConfidence = data => data.reduce((sum, d) => sum + (d.report.confidence || 0), 0) / data.length;

  if (highScores.count + lowScores.count > data.length * 0.3) {
    recommendations.push('Considera implementar un umbral de confianza mínima (ej: 0.6) para usar calificaciones AI automáticamente');
  }

  // Recomendación 4: Human verification
  const highDiscrepancy = data => data.filter(d => d.difference > 20).length;

  if (highDiscrepancy > data.length * 0.2) {
    recommendations.push('Más del 20% de las evaluaciones tienen discrepancias >20 puntos. Implementa verificación humana obligatoria para scores con diferencia >15');
  }

  return recommendations;
}

/**
 * Ajustar prompt basado en análisis
 */
function adjustPrompt(analysis) {
  const basePrompt = `Eres un juez experto de skateboarding. Analiza este video y genera un JSON con esta estructura exacta:

{
  "technique_score": 0-100,
  "execution_quality": 0-100,
  "style_creativity": 0-100,
  "difficulty": 0-100,
  ...
}`;

  const adjustments = [];

  // Ajuste por sesgo alto
  if (analysis.patterns['Sistematicamente alto (AI > Humano)'].count > 10) {
    adjustments.push(`
IMPORTANTE: Sé más estricto en la evaluación.
- No otorgues puntos >80 a menos que la ejecución sea EXCELENTE
- Evalúa críticamente la limpieza del aterrizaje
- Considera que el 80% de los skaters están en nivel promedio (40-60 puntos)
- Un truco bien ejecutado pero sin creatividad adicional debería estar en 60-70 puntos máximo`);
  }

  // Ajuste por sesgo bajo
  if (analysis.patterns['Sistematicamente bajo (AI < Humano)'].count > 10) {
    adjustments.push(`
IMPORTANTE: Sé más generoso en la evaluación.
- Reconoce el esfuerzo y progresión del skater
- Valora positivamente la complejidad intentada, incluso si no es perfecta
- Considera que ejecuciones limpias de trucos intermedios merecen 70-80 puntos
- Un truco bien ejecutado con buena fluidez debería estar en 75-85 puntos`);
  }

  return {
    basePrompt,
    adjustments: adjustments.join('\n'),
    fullPrompt: basePrompt + '\n' + adjustments.join('\n'),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Exportar funciones
 */
module.exports = {
  optimizeJudge,
  analyzeErrorPatterns,
  generateRecommendations,
  adjustPrompt,
};

// Si se ejecuta directamente
if (require.main === module) {
  optimizeJudge().catch(console.error);
}
