import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Obtener todos los usuarios con sus submissions aprobadas
    const usersWithScores = await prisma.user.findMany({
      where: {
        isActive: true,
        submissions: {
          some: {
            status: 'approved',
          },
        },
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
      },
    });

    // Calcular scores y ordenar
    const leaderboard = usersWithScores
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
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
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
