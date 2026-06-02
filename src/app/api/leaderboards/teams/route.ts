import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Obtener todos los teams activos con sus miembros
    const teams = await prisma.team.findMany({
      where: {
        isActive: true,
      },
      include: {
        owner: {
          select: {
            email: true,
            name: true,
            photo: true,
          },
        },
        members: {
          select: {
            email: true,
            name: true,
            photo: true,
          },
        },
      },
    });

    // Calcular scores de cada team
    const teamsWithScores = await Promise.all(
      teams.map(async (team) => {
        const memberEmails = team.members.map((m) => m.email);

        const submissions = await prisma.submission.findMany({
          where: {
            userId: { in: memberEmails },
            status: 'approved',
          },
          select: {
            score: true,
            challengeId: true,
          },
        });

        const totalScore = submissions.reduce(
          (acc, sub) => acc + (sub.score || 0),
          0
        );

        const challengesCompleted = new Set(
          submissions.map((s) => s.challengeId)
        ).size;

        return {
          id: team.id,
          name: team.name,
          description: team.description,
          logo: team.logo,
          owner: team.owner,
          memberCount: team.members.length,
          maxMembers: team.maxMembers,
          totalScore,
          challengesCompleted,
          submissionsApproved: submissions.length,
        };
      })
    );

    // Ordenar por score y asignar ranking
    const leaderboard = teamsWithScores
      .filter((t) => t.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((team, index) => ({
        rank: index + 1,
        ...team,
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
    console.error('Error obteniendo leaderboard de teams:', error);
    return NextResponse.json(
      { error: 'Error al obtener el leaderboard de teams' },
      { status: 500 }
    );
  }
}
