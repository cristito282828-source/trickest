#!/usr/bin/env node

/**
 * Script para probar el sistema de auto-aprobación
 *
 * Uso:
 *   node scripts/test-auto-approve.js [url] [secret]
 *
 * Ejemplos:
 *   node scripts/test-auto-approve.js
 *   node scripts/test-auto-approve.js http://localhost:3000
 *   node scripts/test-auto-approve.js https://trickest.vercel.app your-secret
 */

const baseURL = process.argv[2] || 'http://localhost:3000';
const cronSecret = process.argv[3] || process.env.CRON_SECRET || '';

console.log('🔄 Probando Sistema de Auto-Aprobación\n');
console.log(`📍 URL: ${baseURL}`);
console.log(
  `🔐 Secret: ${cronSecret ? '✓ Configurado' : '✗ No configurado'}\n`
);

async function getStats() {
  console.log('📊 Obteniendo estadísticas...\n');

  try {
    const response = await fetch(
      `${baseURL}/api/submissions/auto-approve?details=true`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('📈 ESTADÍSTICAS ACTUALES:');
    console.log(`   Pendientes totales: ${data.stats.pending}`);
    console.log(
      `   Elegibles para auto-aprobación: ${data.stats.eligibleForAutoApproval}`
    );
    console.log(
      `   Auto-aprobadas (total histórico): ${data.stats.communityApproved}`
    );
    console.log(`   Necesitan más votos: ${data.stats.needingVotes}\n`);

    if (data.eligibleSubmissions && data.eligibleSubmissions.length > 0) {
      console.log('🎯 SUBMISSIONS ELEGIBLES:');
      data.eligibleSubmissions.forEach((sub, i) => {
        console.log(
          `   ${i + 1}. ${sub.challenge} (${sub.level}) - ${sub.user}`
        );
        console.log(
          `      Votos: ${sub.upvotes}👍 / ${sub.downvotes}👎 (${sub.positivePercentage}%)`
        );
      });
      console.log('');
    } else {
      console.log('✨ No hay submissions elegibles para auto-aprobación\n');
    }

    console.log('⚙️ CONFIGURACIÓN:');
    console.log(`   Votos mínimos: ${data.config.minVotes}`);
    console.log(`   % positivo mínimo: ${data.config.minPositivePercentage}%`);
    console.log(`   Puntaje auto-aprobado: ${data.config.autoApproveScore}\n`);

    return data;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
    process.exit(1);
  }
}

async function runAutoApprove() {
  console.log('🚀 Ejecutando auto-aprobación...\n');

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (cronSecret) {
      headers['Authorization'] = `Bearer ${cronSecret}`;
    }

    const response = await fetch(`${baseURL}/api/submissions/auto-approve`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `HTTP ${response.status}: ${error.error || response.statusText}`
      );
    }

    const result = await response.json();

    console.log('✅ EJECUCIÓN COMPLETADA:');
    console.log(`   ${result.message}\n`);

    if (result.summary) {
      console.log('📊 RESUMEN:');
      console.log(`   Procesadas: ${result.summary.processed}`);
      console.log(`   ✅ Aprobadas: ${result.summary.approved}`);
      console.log(`   ❌ Rechazadas: ${result.summary.rejected}\n`);

      if (result.summary.details.approvedSubmissions.length > 0) {
        console.log('✅ APROBADAS:');
        result.summary.details.approvedSubmissions.forEach((sub) => {
          console.log(
            `   • ${sub.challenge} - ${sub.user} (${sub.percentage.toFixed(
              1
            )}%)`
          );
        });
        console.log('');
      }

      if (result.summary.details.rejectedSubmissions.length > 0) {
        console.log('❌ RECHAZADAS:');
        result.summary.details.rejectedSubmissions.forEach((sub) => {
          console.log(
            `   • ${sub.challenge} - ${sub.user} (${sub.percentage.toFixed(
              1
            )}%)`
          );
        });
        console.log('');
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Error ejecutando auto-aprobación:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('════════════════════════════════════════════════════\n');

  // Obtener estadísticas pre-ejecución
  await getStats();

  // Preguntar si continuar
  console.log('¿Continuar con la ejecución? (Ctrl+C para cancelar)');
  console.log('Esperando 3 segundos...\n');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Ejecutar auto-aprobación
  await runAutoApprove();

  // Obtener estadísticas post-ejecución
  console.log('════════════════════════════════════════════════════\n');
  console.log('📊 ESTADÍSTICAS POST-EJECUCIÓN:\n');
  await getStats();

  console.log('════════════════════════════════════════════════════');
  console.log('✅ Proceso completado exitosamente');
}

main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
