/**
 * SCRIPT: Analizar submissions existentes con AI
 *
 * Objetivo: Comparar calificaciones de jueces humanos vs AI (GLM-4V)
 *
 * Uso:
 *   node scripts/analyze-existing-submissions.js
 *
 * Flujo:
 * 1. Obtiene submissions aprobadas con score humano
 * 2. Envía video a GLM-4V para análisis
 * 3. Compara scores (humano vs AI)
 * 4. Genera reporte de correlación
 * 5. Guarda análisis en ScoutReport
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuración GLM-4V
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

/**
 * Analizar video con GLM-4V
 */
async function analyzeVideoWithGLM(videoUrl) {
  const prompt = `Eres un juez experto de skateboarding. Analiza este video y genera un JSON con esta estructura exacta:

{
  "technique_score": 0-100,
  "execution_quality": 0-100,
  "style_creativity": 0-100,
  "difficulty": 0-100,
  "detected_tricks": ["ollie", "kickflip", ...],
  "tricks_completed": número,
  "landing_quality": "clean" | "sketchy" | "fall",
  "overall_impression": "muy bueno" | "bueno" | "promedio" | "necesita_mejora",
  "specific_feedback": "comentarios técnicos sobre la ejecución",
  "comparison_notes": "comparación con estándar profesional",
  "suggested_score": 0-100,
  "confidence": 0.0-1.0
}

Criterios de evaluación:
- TECHNIQUE (30%): Forma correcta, pop, timing
- EXECUTION (30%): Aterrizaje, fluidez, limpieza
- STYLE (20%): Originalidad, personalidad
- DIFFICULTY (20%): Complejidad de los trucos
`;

  try {
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4v',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'video_url', video_url: videoUrl }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      throw new Error(`GLM API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extraer JSON del contenido
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error analyzing video:', error);
    return null;
  }
}

/**
 * Calcular score final basado en componentes
 */
function calculateFinalScore(analysis) {
  if (!analysis) return null;

  // Fórmula ponderada (igual que jueces humanos)
  const technique = analysis.technique_score || 50;
  const execution = analysis.execution_quality || 50;
  const style = analysis.style_creativity || 50;
  const difficulty = analysis.difficulty || 50;

  const finalScore =
    (technique * 0.30) +
    (execution * 0.30) +
    (style * 0.20) +
    (difficulty * 0.20);

  return Math.round(finalScore);
}

/**
 * Comparar scores y calcular métricas
 */
function compareScores(humanScore, aiScore) {
  const difference = Math.abs(humanScore - aiScore);
  const percentDifference = (difference / humanScore) * 100;

  let agreement = '';
  if (difference <= 5) agreement = 'EXCELLENT';
  else if (difference <= 10) agreement = 'GOOD';
  else if (difference <= 15) agreement = 'ACCEPTABLE';
  else agreement = 'POOR';

  return {
    humanScore,
    aiScore,
    difference,
    percentDifference,
    agreement,
  };
}

/**
 * Procesar submissions existentes
 */
async function analyzeSubmissions() {
  console.log('🎬 Analizando submissions existentes con AI...\n');

  // Obtener submissions aprobadas con score humano
  const submissions = await prisma.submission.findMany({
    where: {
      status: 'approved',
      score: { not: null }, // Tiene calificación humana
      videoUrl: { not: null }, // Tiene video
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        }
      },
      challenge: {
        select: {
          name: true,
          level: true,
          difficulty: true,
        }
      }
    },
    orderBy: { evaluatedAt: 'desc' },
    take: 50, // Analizar últimas 50 submissions
  });

  console.log(`📊 Encontradas ${submissions.length} submissions para analizar\n`);

  const results = [];
  const agreements = { EXCELLENT: 0, GOOD: 0, ACCEPTABLE: 0, POOR: 0 };

  for (let i = 0; i < submissions.length; i++) {
    const submission = submissions[i];
    const progress = `[${i + 1}/${submissions.length}]`;

    console.log(`${progress} Analizando: ${submission.user.name} - ${submission.challenge.name}`);
    console.log(`  Video: ${submission.videoUrl}`);
    console.log(`  Score humano: ${submission.score}`);

    try {
      // Analizar con AI
      const aiAnalysis = await analyzeVideoWithGLM(submission.videoUrl);

      if (!aiAnalysis) {
        console.log('  ❌ Error en análisis AI\n');
        continue;
      }

      // Calcular score AI
      const aiScore = calculateFinalScore(aiAnalysis);

      // Comparar
      const comparison = compareScores(submission.score, aiScore);

      console.log(`  Score AI: ${aiScore}`);
      console.log(`  Diferencia: ${comparison.difference} puntos (${comparison.percentDifference.toFixed(1)}%)`);
      console.log(`  Acuerdo: ${comparison.agreement}\n`);

      // Guardar reporte
      await prisma.scoutReport.create({
        data: {
          skaterEmail: submission.userId,
          videoUrl: submission.videoUrl,
          analysis: {
            ...aiAnalysis,
            submissionId: submission.id,
            challengeName: submission.challenge.name,
          },
          techniqueScore: aiAnalysis.technique_score,
          olympicPotential: aiScore, // Usamos score como proxy de potencial
          suggestedPrice: aiScore * 2, // Fórmula simple: 1 punto = 2 SKT
          detectedTricks: aiAnalysis.detected_tricks || [],
          comparisonNotes: `Juez humano: ${submission.score} | AI: ${aiScore} | Diferencia: ${comparison.difference}`,
          modelVersion: 'glm-4v',
          confidence: aiAnalysis.confidence || 0.7,
        }
      });

      // Acumular estadísticas
      agreements[comparison.agreement]++;

      results.push({
        submissionId: submission.id,
        skaterName: submission.user.name,
        challengeName: submission.challenge.name,
        humanScore: submission.score,
        aiScore,
        ...comparison,
        aiAnalysis,
      });

    } catch (error) {
      console.error(`  ❌ Error procesando submission ${submission.id}:`, error.message, '\n');
    }

    // Pequeña pausa para no sobrecargar API
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generar reporte final
  console.log('\n' + '='.repeat(80));
  console.log('📊 REPORTE FINAL: Juez Virtual vs Juez Humano');
  console.log('='.repeat(80));

  console.log(`\nTotal submissions analizadas: ${results.length}\n`);

  console.log('Distribución de acuerdos:');
  Object.entries(agreements).forEach(([level, count]) => {
    const percent = (count / results.length * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / results.length * 50));
    console.log(`  ${level.padEnd(12)} ${bar} ${count} (${percent}%)`);
  });

  // Calcular correlación
  const avgDifference = results.reduce((sum, r) => sum + r.difference, 0) / results.length;
  const avgPercentDiff = results.reduce((sum, r) => sum + r.percentDifference, 0) / results.length;
  const avgHumanScore = results.reduce((sum, r) => sum + r.humanScore, 0) / results.length;
  const avgAiScore = results.reduce((sum, r) => sum + r.aiScore, 0) / results.length;

  console.log(`\nEstadísticas:`);
  console.log(`  Score promedio humano: ${avgHumanScore.toFixed(1)}`);
  console.log(`  Score promedio AI: ${avgAiScore.toFixed(1)}`);
  console.log(`  Diferencia promedio: ${avgDifference.toFixed(1)} puntos`);
  console.log(`  Diferencia promedio: ${avgPercentDiff.toFixed(1)}%`);

  // Interpretación
  console.log(`\n📈 Interpretación:`);
  if (avgDifference <= 10) {
    console.log(`  ✅ EXCELENTE: El juez virtual está muy alineado con jueces humanos`);
    console.log(`     El AI puede usarse como segunda opinión confiable`);
  } else if (avgDifference <= 15) {
    console.log(`  ⚠️  ACEPTABLE: El juez virtual necesita ajustes`);
    console.log(`     Recomendado usar como referencia, no como única autoridad`);
  } else {
    console.log(`  ❌ POOR: El juez virtual necesita reentrenamiento`);
    console.log(`     El prompt actual no captura bien los criterios humanos`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Análisis completo. Reportes guardados en ScoutReport.\n');
}

/**
 * Buscar discrepancias grandes (outliers)
 */
async function findOutliers() {
  console.log('\n🔍 Buscando discrepancias grandes...\n');

  const reports = await prisma.scoutReport.findMany({
    where: {
      analysis: {
        path: ['submissionId'],
        not: null,
      }
    },
    take: 100,
    orderBy: { createdAt: 'desc' }
  });

  const outliers = [];

  for (const report of reports) {
    const analysis = report.analysis;
    if (!analysis.submissionId) continue;

    const submission = await prisma.submission.findUnique({
      where: { id: analysis.submissionId },
      select: { score: true }
    });

    if (!submission?.score) continue;

    const difference = Math.abs(submission.score - (report.techniqueScore || 0));

    if (difference > 20) {
      outliers.push({
        reportId: report.id,
        submissionId: analysis.submissionId,
        humanScore: submission.score,
        aiScore: report.techniqueScore,
        difference,
      });
    }
  }

  if (outliers.length > 0) {
    console.log(`⚠️  Encontradas ${outliers.length} discrepancias grandes (>20 puntos):\n`);
    outliers.forEach((o, i) => {
      console.log(`${i + 1}. Submission ${o.submissionId}`);
      console.log(`   Humano: ${o.humanScore} | AI: ${o.aiScore} | Diferencia: ${o.difference}\n`);
    });
  } else {
    console.log('✅ No se encontraron discrepancias mayores a 20 puntos\n');
  }
}

// Ejecutar análisis
async function main() {
  try {
    await analyzeSubmissions();
    await findOutliers();

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error en script principal:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
