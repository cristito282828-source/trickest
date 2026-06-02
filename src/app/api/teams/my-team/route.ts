import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/teams/my-team - Obtener el team del usuario actual
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        username: true,
        teamId: true,
        team: {
          include: {
            owner: {
              select: {
                email: true,
                username: true,
                name: true,
                photo: true,
              },
            },
            members: {
              select: {
                email: true,
                username: true,
                name: true,
                photo: true,
                submissions: {
                  where: { status: 'approved' },
                  select: { score: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user?.team) {
      return NextResponse.json({ team: null });
    }

    // Calcular scores por miembro y total
    const membersWithScores = user.team.members.map((member) => {
      const memberScore = member.submissions.reduce(
        (acc, sub) => acc + (sub.score || 0),
        0
      );
      return {
        email: member.email,
        username: member.username,
        name: member.name,
        photo: member.photo,
        score: memberScore,
      };
    });

    const totalScore = membersWithScores.reduce(
      (acc, member) => acc + member.score,
      0
    );

    return NextResponse.json({
      team: {
        id: user.team.id,
        name: user.team.name,
        description: user.team.description,
        logo: user.team.logo,
        maxMembers: user.team.maxMembers,
        isActive: user.team.isActive,
        createdAt: user.team.createdAt,
        owner: user.team.owner,
        members: membersWithScores,
        memberCount: user.team.members.length,
        totalScore,
        isOwner: user.team.ownerId === user.username,
      },
    });
  } catch (error) {
    console.error('Error obteniendo my-team:', error);
    return NextResponse.json(
      { error: 'Error al obtener tu equipo' },
      { status: 500 }
    );
  }
}
