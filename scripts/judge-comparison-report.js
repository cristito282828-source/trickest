/**
 * SCRIPT: Reporte visual de comparación Juez Humano vs AI
 *
 * Genera un HTML interactivo con comparaciones visuales
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateComparisonReport() {
  console.log('📊 Generando reporte visual de comparación...\n');

  // Obtener todos los ScoutReports con submissions
  const reports = await prisma.scoutReport.findMany({
    where: {
      analysis: {
        path: ['submissionId'],
        not: null,
      }
    },
    include: {
      skater: {
        select: {
          name: true,
          email: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  if (reports.length === 0) {
    console.log('⚠️  No hay reportes para analizar. Ejecuta primero: node scripts/analyze-existing-submissions.js\n');
    return;
  }

  // Enriquecer datos con scores humanos
  const enrichedData = [];

  for (const report of reports) {
    const submissionId = report.analysis.submissionId;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        challenge: {
          select: { name: true, difficulty: true }
        },
        evaluatedBy: true,
      }
    });

    if (!submission?.score) continue;

    const humanScore = submission.score;
    const aiScore = report.techniqueScore || 0;
    const difference = Math.abs(humanScore - aiScore);

    enrichedData.push({
      id: report.id,
      skaterName: report.skater.name,
      challengeName: submission.challenge.name,
      difficulty: submission.challenge.difficulty,
      humanScore,
      aiScore,
      difference,
      agreement: difference <= 5 ? 'EXCELLENT' : difference <= 10 ? 'GOOD' : difference <= 15 ? 'ACCEPTABLE' : 'POOR',
      judgeEmail: submission.evaluatedBy,
      confidence: report.confidence || 0,
      detectedTricks: report.detectedTricks || [],
      comparisonNotes: report.comparisonNotes,
    });
  }

  // Calcular estadísticas
  const stats = {
    total: enrichedData.length,
    avgHumanScore: enrichedData.reduce((s, x) => s + x.humanScore, 0) / enrichedData.length,
    avgAiScore: enrichedData.reduce((s, x) => s + x.aiScore, 0) / enrichedData.length,
    avgDifference: enrichedData.reduce((s, x) => s + x.difference, 0) / enrichedData.length,
    excellent: enrichedData.filter(x => x.agreement === 'EXCELLENT').length,
    good: enrichedData.filter(x => x.agreement === 'GOOD').length,
    acceptable: enrichedData.filter(x => x.agreement === 'ACCEPTABLE').length,
    poor: enrichedData.filter(x => x.agreement === 'POOR').length,
  };

  // Agrupar por dificultad
  const byDifficulty = {};
  enrichedData.forEach(x => {
    if (!byDifficulty[x.difficulty]) {
      byDifficulty[x.difficulty] = {
        count: 0,
        avgDifference: 0,
        scores: []
      };
    }
    byDifficulty[x.difficulty].count++;
    byDifficulty[x.difficulty].avgDifference += x.difference;
    byDifficulty[x.difficulty].scores.push(x);
  });

  Object.keys(byDifficulty).forEach(diff => {
    byDifficulty[diff].avgDifference /= byDifficulty[diff].count;
  });

  // Agrupar por juez
  const byJudge = {};
  enrichedData.forEach(x => {
    if (!byJudge[x.judgeEmail]) {
      byJudge[x.judgeEmail] = { count: 0, avgDifference: 0 };
    }
    byJudge[x.judgeEmail].count++;
    byJudge[x.judgeEmail].avgDifference += x.difference;
  });

  Object.keys(byJudge).forEach(judge => {
    byJudge[judge].avgDifference /= byJudge[judge].count;
  });

  // Generar HTML
  const html = generateHTML(stats, enrichedData, byDifficulty, byJudge);

  // Guardar reporte
  const fs = require('fs');
  const outputPath = './judge-ai-comparison-report.html';
  fs.writeFileSync(outputPath, html);

  console.log(`✅ Reporte generado: ${outputPath}`);
  console.log(`📂 Abre el archivo en tu navegador para visualizar\n`);

  await prisma.$disconnect();
}

function generateHTML(stats, data, byDifficulty, byJudge) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Juez Humano vs AI - Reporte de Comparación</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      text-align: center;
      color: #667eea;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 40px;
      font-size: 1.1em;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 15px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    .stat-card.excellent { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
    .stat-card.poor { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); }
    .stat-value {
      font-size: 3em;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .stat-label {
      font-size: 1.1em;
      opacity: 0.9;
    }
    .chart-container {
      margin-bottom: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 15px;
    }
    .chart-title {
      font-size: 1.5em;
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #667eea;
      color: white;
      font-weight: 600;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: bold;
      display: inline-block;
    }
    .badge-excellent { background: #38ef7d; color: white; }
    .badge-good { background: #38b6ff; color: white; }
    .badge-acceptable { background: #ffc107; color: #333; }
    .badge-poor { background: #f45c43; color: white; }
    .score-diff {
      font-weight: bold;
    }
    .score-diff.low { color: #38ef7d; }
    .score-diff.medium { color: #ffc107; }
    .score-diff.high { color: #f45c43; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚖️ Juez Humano vs Juez AI</h1>
    <p class="subtitle">Análisis comparativo de evaluaciones de submissions de skate</p>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Submissions Analizadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.avgHumanScore.toFixed(1)}</div>
        <div class="stat-label">Score Promedio Humano</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.avgAiScore.toFixed(1)}</div>
        <div class="stat-label">Score Promedio AI</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.avgDifference.toFixed(1)}</div>
        <div class="stat-label">Diferencia Promedio</div>
      </div>
      <div class="stat-card excellent">
        <div class="stat-value">${((stats.excellent / stats.total) * 100).toFixed(0)}%</div>
        <div class="stat-label">Acuerdo Excelente</div>
      </div>
      <div class="stat-card poor">
        <div class="stat-value">${((stats.poor / stats.total) * 100).toFixed(0)}%</div>
        <div class="stat-label">Acuerdo Pobre</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="chart-container">
      <div class="chart-title">📊 Distribución de Acuerdos</div>
      <canvas id="agreementChart"></canvas>
    </div>

    <div class="chart-container">
      <div class="chart-title">📈 Scores: Humano vs AI</div>
      <canvas id="scoreComparisonChart"></canvas>
    </div>

    <div class="chart-container">
      <div class="chart-title">🎯 Diferencia por Nivel de Dificultad</div>
      <canvas id="difficultyChart"></canvas>
    </div>

    <!-- Detailed Table -->
    <div class="chart-container">
      <div class="chart-title">📋 Detalle de Comparaciones</div>
      <table>
        <thead>
          <tr>
            <th>Skater</th>
            <th>Challenge</th>
            <th>Dificultad</th>
            <th>Score Humano</th>
            <th>Score AI</th>
            <th>Diferencia</th>
            <th>Acuerdo</th>
            <th>Confianza AI</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td><strong>${row.skaterName}</strong></td>
              <td>${row.challengeName}</td>
              <td><span class="badge badge-${row.difficulty}">${row.difficulty}</span></td>
              <td><strong>${row.humanScore}</strong></td>
              <td><strong>${row.aiScore}</strong></td>
              <td><span class="score-diff ${row.difference <= 10 ? 'low' : row.difference <= 15 ? 'medium' : 'high'}">${row.difference.toFixed(1)} pts (${(row.difference / row.humanScore * 100).toFixed(1)}%)</span></td>
              <td><span class="badge badge-${row.agreement.toLowerCase()}">${row.agreement}</span></td>
              <td>${(row.confidence * 100).toFixed(0)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- By Judge -->
    <div class="chart-container">
      <div class="chart-title">👨‍⚖️ Desempeño por Juez</div>
      <table>
        <thead>
          <tr>
            <th>Juez</th>
            <th>Submissions Evaluadas</th>
            <th>Diferencia Promedio vs AI</th>
            <th>Alineación con AI</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(byJudge).map(([judge, data]) => `
            <tr>
              <td><code>${judge.split('@')[0]}</code></td>
              <td>${data.count}</td>
              <td><span class="score-diff ${data.avgDifference <= 10 ? 'low' : 'high'}">${data.avgDifference.toFixed(1)} pts</span></td>
              <td><span class="badge badge-${data.avgDifference <= 10 ? 'excellent' : data.avgDifference <= 15 ? 'good' : 'poor'}">${data.avgDifference <= 10 ? 'MUY ALTA' : data.avgDifference <= 15 ? 'ALTA' : 'MEDIA'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="margin-top: 40px; text-align: center; color: #666; font-size: 0.9em;">
      <p>Generado el ${new Date().toLocaleString('es-ES')}</p>
      <p>SkateWorld AI Judge vs Human Judge Comparison System</p>
    </div>
  </div>

  <script>
    // Agreement Distribution Chart
    new Chart(document.getElementById('agreementChart'), {
      type: 'doughnut',
      data: {
        labels: ['Excelente (≤5pts)', 'Bueno (≤10pts)', 'Aceptable (≤15pts)', 'Pobre (>15pts)'],
        datasets: [{
          data: [${stats.excellent}, ${stats.good}, ${stats.acceptable}, ${stats.poor}],
          backgroundColor: ['#38ef7d', '#38b6ff', '#ffc107', '#f45c43'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    // Score Comparison Chart
    new Chart(document.getElementById('scoreComparisonChart'), {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Submissions',
          data: ${JSON.stringify(data.map(d => ({ x: d.humanScore, y: d.aiScore })))},
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          borderColor: 'rgba(102, 126, 234, 1)',
          pointRadius: 8,
          pointHoverRadius: 10
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: 'Score Humano' },
            min: 0, max: 100
          },
          y: {
            title: { display: true, text: 'Score AI' },
            min: 0, max: 100
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return \`Humano: \${context.raw.x}, AI: \${context.raw.y}\`;
              }
            }
          }
        }
      }
    });

    // Difficulty Chart
    new Chart(document.getElementById('difficultyChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(Object.keys(byDifficulty))},
        datasets: [{
          label: 'Diferencia Promedio',
          data: ${JSON.stringify(Object.values(byDifficulty).map(d => d.avgDifference.toFixed(1)))},
          backgroundColor: ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)', 'rgba(235, 51, 73, 0.8)', 'rgba(56, 239, 125, 0.8)'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            title: { display: true, text: 'Diferencia (puntos)' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  </script>
</body>
</html>
  `;
}

// Ejecutar
generateComparisonReport().catch(console.error);
