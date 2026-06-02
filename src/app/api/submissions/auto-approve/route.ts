import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Configuration for auto-aprobación
const AUTO_APPROVAL_CONFIG = {
  minVotes: 10, // Mínimo de votos requeridos
  minPositivePercentage: 80, // Porcentaje mínimo de votos positivos
  autoApproveScore: 90, // Puntaje automático otorgado
};

export async function POST(request: Request) {
  try {
    // Verificar que la solicitud viene con un token de autorización (para cron jobs)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Si hay un CRON_SECRET configurado, validarlo
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    console.log('🔄 Iniciando proceso de auto-aprobación...');

    // Buscar submissions pendientes que cumplan con los criterios
    const eligibleSubmissions = await prisma.submission.findMany({
      where: {
        status: 'pending',
        communityApproved: false,
        voteCount: {
          gte: AUTO_APPROVAL_CONFIG.minVotes,
        },
      },
      include: {
        challenge: {
          select: {
            name: true,
            level: true,
            points: true,
          },
        },
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(
      `📊 Submissions elegibles encontradas: ${eligibleSubmissions.length}`
    );

    const approvedSubmissions = [];
    const rejectedSubmissions = [];

    for (const submission of eligibleSubmissions) {
      const totalVotes = submission.upvotes + submission.downvotes;

      // Calcular porcentaje de votos positivos
      const positivePercentage =
        totalVotes > 0 ? (submission.upvotes / totalVotes) * 100 : 0;

      console.log(`\n📝 Submission #${submission.id}:`);
      console.log(
        `   Usuario: ${submission.user.name || submission.user.email}`
      );
      console.log(
        `   Challenge: ${submission.challenge.name} (Nivel ${submission.challenge.level})`
      );
      console.log(
        `   Votos: ${submission.upvotes}👍 / ${
          submission.downvotes
        }👎 (${positivePercentage.toFixed(1)}%)`
      );

      // Auto-aprobar si cumple el threshold
      if (positivePercentage >= AUTO_APPROVAL_CONFIG.minPositivePercentage) {
        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            status: 'approved',
            score: AUTO_APPROVAL_CONFIG.autoApproveScore,
            communityApproved: true,
            autoApprovedAt: new Date(),
            feedback: `✅ Automatically approved by the community con ${positivePercentage.toFixed(
              1
            )}% de votos positivos (${
              submission.upvotes
            }/${totalVotes} votos).`,
            evaluatedAt: new Date(),
          },
        });

        approvedSubmissions.push({
          id: submission.id,
          user: submission.user.email,
          challenge: submission.challenge.name,
          votes: {
            upvotes: submission.upvotes,
            downvotes: submission.downvotes,
          },
          percentage: positivePercentage,
        });

        console.log(`   ✅ AUTO-APROBADO`);
      } else {
        // Marcar como rechazado si tiene suficientes votos pero no pasa el threshold
        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            status: 'rejected',
            score: 0,
            communityApproved: false,
            feedback: `❌ Rechazado por la comunidad con solo ${positivePercentage.toFixed(
              1
            )}% de votos positivos (${
              submission.upvotes
            }/${totalVotes} votos).`,
            evaluatedAt: new Date(),
          },
        });

        rejectedSubmissions.push({
          id: submission.id,
          user: submission.user.email,
          challenge: submission.challenge.name,
          votes: {
            upvotes: submission.upvotes,
            downvotes: submission.downvotes,
          },
          percentage: positivePercentage,
        });

        console.log(`   ❌ AUTO-RECHAZADO`);
      }
    }

    const summary = {
      timestamp: new Date().toISOString(),
      processed: eligibleSubmissions.length,
      approved: approvedSubmissions.length,
      rejected: rejectedSubmissions.length,
      config: AUTO_APPROVAL_CONFIG,
      details: {
        approvedSubmissions,
        rejectedSubmissions,
      },
    };

    console.log('\n📊 RESUMEN:');
    console.log(`   ✅ Aprobadas: ${approvedSubmissions.length}`);
    console.log(`   ❌ Rechazadas: ${rejectedSubmissions.length}`);
    console.log(`   📝 Total procesadas: ${eligibleSubmissions.length}`);

    return NextResponse.json({
      success: true,
      message: `Procesadas ${eligibleSubmissions.length} submissions: ${approvedSubmissions.length} aprobadas, ${rejectedSubmissions.length} rechazadas`,
      summary,
    });
  } catch (error) {
    console.error('❌ Error en auto-aprobación:', error);
    return NextResponse.json(
      {
        error: 'Error processing auto-approval',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

// GET endpoint para obtener estadísticas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('details') === 'true';

    // Obtener estadísticas generales
    const stats = {
      pending: await prisma.submission.count({
        where: { status: 'pending', communityApproved: false },
      }),
      eligibleForAutoApproval: await prisma.submission.count({
        where: {
          status: 'pending',
          communityApproved: false,
          voteCount: { gte: AUTO_APPROVAL_CONFIG.minVotes },
        },
      }),
      communityApproved: await prisma.submission.count({
        where: { communityApproved: true },
      }),
      needingVotes: await prisma.submission.count({
        where: {
          status: 'pending',
          voteCount: { lt: AUTO_APPROVAL_CONFIG.minVotes },
        },
      }),
    };

    interface AutoApprovalStatsResponse {
      config: typeof AUTO_APPROVAL_CONFIG;
      stats: typeof stats;
      eligibleSubmissions?: Array<{
        id: number;
        user: string;
        challenge: string;
        level: number;
        upvotes: number;
        downvotes: number;
        voteCount: number;
        positivePercentage: string | number;
        submittedAt: Date;
      }>;
    }

    const response: AutoApprovalStatsResponse = {
      config: AUTO_APPROVAL_CONFIG,
      stats,
    };

    if (includeDetails) {
      // Obtener submissions elegibles con detalles
      const eligibleSubmissions = await prisma.submission.findMany({
        where: {
          status: 'pending',
          communityApproved: false,
          voteCount: { gte: AUTO_APPROVAL_CONFIG.minVotes },
        },
        include: {
          challenge: {
            select: { name: true, level: true },
          },
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { voteCount: 'desc' },
      });

      response.eligibleSubmissions = eligibleSubmissions.map((s) => ({
        id: s.id,
        user: s.user.name || s.user.email,
        challenge: s.challenge.name,
        level: s.challenge.level,
        upvotes: s.upvotes,
        downvotes: s.downvotes,
        voteCount: s.voteCount,
        positivePercentage:
          s.voteCount > 0 ? ((s.upvotes / s.voteCount) * 100).toFixed(1) : 0,
        submittedAt: s.submittedAt,
      }));
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error fetching statistics' },
      { status: 500 }
    );
  }
}
