import type { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const challengeId = searchParams.get('challengeId');

    // Construir filtros
    const whereClause: Prisma.SubmissionWhereInput = {
      status: 'pending', // Solo submissions pendientes
      userId: {
        not: session.user.email, // No incluir propias submissions
      },
      votes: {
        none: {
          userId: session.user.email, // No incluir submissions ya votadas
        },
      },
    };

    // Filtro opcional por challenge
    if (challengeId) {
      whereClause.challengeId = parseInt(challengeId);
    }

    // Obtener submissions disponibles para votar
    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            name: true,
            photo: true,
          },
        },
        challenge: {
          select: {
            id: true,
            name: true,
            level: true,
            difficulty: true,
            points: true,
            description: true,
          },
        },
        votes: {
          select: {
            voteType: true,
            userId: true,
          },
        },
      },
      orderBy: [
        { voteCount: 'asc' }, // Priorizar submissions con menos votos
        { submittedAt: 'asc' }, // Más antiguas primero
      ],
      take: limit,
      skip: offset,
    });

    // Contar total de submissions disponibles
    const total = await prisma.submission.count({
      where: whereClause,
    });

    // Calcular porcentaje de votos positivos para cada submission
    const submissionsWithStats = submissions.map((submission) => {
      const totalVotes = submission.upvotes + submission.downvotes;
      const positivePercentage =
        totalVotes > 0
          ? Math.round((submission.upvotes / totalVotes) * 100)
          : 0;

      return {
        ...submission,
        stats: {
          totalVotes,
          positivePercentage,
          needsVotes: 10 - totalVotes, // Cuántos votos faltan para alcanzar el mínimo
          isCloseToApproval: totalVotes >= 10 && positivePercentage >= 80,
        },
      };
    });

    return NextResponse.json({
      submissions: submissionsWithStats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error al obtener submissions para votar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
