import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const gameRanking = searchParams.get('sort') === 'skate';

    // Obtener todos los usuarios con sus submissions aprobadas
    const usersWithScores = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { submissions: { some: { status: 'approved' } } },
          { skateGameWins: { some: { status: 'COMPLETED' } } },
          { skateGameLosses: { some: { status: 'COMPLETED' } } },
        ],
      },
      select: {
        email: true,
        username: true,
        name: true,
        photo: true,
        departamento: true,
        ciudad: true,
        team: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        submissions: {
          where: {
            status: 'approved',
          },
          select: {
            score: true,
            challengeId: true,
          },
        },
        skateGameWins: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
        skateGameLosses: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
      },
    });
    const judgeRatings = usersWithScores.length
      ? await prisma.skateGameRating.groupBy({
          by: ['judgeId'],
          where: { judgeId: { in: usersWithScores.map((user) => user.email) } },
          _avg: { score: true },
          _count: { _all: true },
        })
      : [];
    const judgeRatingsByUser = new Map(
      judgeRatings.map((rating) => [rating.judgeId, {
        average: rating._avg.score,
        count: rating._count._all,
      }])
    );

    // Calcular scores y ordenar
    const rankedUsers = usersWithScores
      .map((user) => {
        const totalScore = user.submissions.reduce(
          (acc, sub) => acc + (sub.score || 0),
          0
        );
        const challengesCompleted = new Set(
          user.submissions.map((s) => s.challengeId)
        ).size;

        return {
          email: user.email,
          username: user.username,
          name: user.name || 'Anonymous Skater',
          photo: user.photo,
          location: user.ciudad
            ? `${user.ciudad}, ${user.departamento}`
            : user.departamento || null,
          team: user.team,
          totalScore,
          challengesCompleted,
          submissionsApproved: user.submissions.length,
          skateGamesWon: user.skateGameWins.length,
          skateGamesLost: user.skateGameLosses.length,
          judgeRating: judgeRatingsByUser.get(user.email)?.average ?? null,
          judgeRatingCount: judgeRatingsByUser.get(user.email)?.count ?? 0,
        };
      })
      .sort(gameRanking
        ? (a, b) => b.skateGamesWon - a.skateGamesWon ||
          a.skateGamesLost - b.skateGamesLost ||
          b.totalScore - a.totalScore
        : (a, b) => b.totalScore - a.totalScore);
    const leaderboard = rankedUsers
      .map((user, index) => ({
        rank: index + 1,
        ...user,
      }));

    // Aplicar paginación
    const paginatedLeaderboard = leaderboard.slice(offset, offset + limit);

    return NextResponse.json({
      leaderboard: paginatedLeaderboard,
      total: leaderboard.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error obteniendo leaderboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener el leaderboard' },
      { status: 500 }
    );
  }
}
