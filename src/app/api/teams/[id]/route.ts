import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/teams/[id] - Obtener detalle de un team
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = parseInt(params.id);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
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
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Calcular scores por miembro y total
    const membersWithScores = team.members.map((member) => {
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
        id: team.id,
        name: team.name,
        description: team.description,
        logo: team.logo,
        maxMembers: team.maxMembers,
        isActive: team.isActive,
        createdAt: team.createdAt,
        owner: team.owner,
        members: membersWithScores,
        memberCount: team.members.length,
        totalScore,
      },
    });
  } catch (error) {
    console.error('Error obteniendo team:', error);
    return NextResponse.json(
      { error: 'Error fetching team' },
      { status: 500 }
    );
  }
}

// PUT /api/teams/[id] - Actualizar un team (solo owner)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const teamId = parseInt(params.id);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, logo } = body;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Obtener el username del usuario actual
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { username: true },
    });

    if (!user?.username || team.ownerId !== user.username) {
      return NextResponse.json(
        { error: 'Only the creator can edit the team' },
        { status: 403 }
      );
    }

    // Actualizar el team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name: name.trim() }),
        description: description?.trim() || null,
        logo: logo || null,
      },
    });

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error('Error actualizando team:', error);
    return NextResponse.json(
      { error: 'Error updating team' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Eliminar un team (solo owner)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const teamId = parseInt(params.id);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Obtener el username del usuario actual
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { username: true },
    });

    if (!user?.username || team.ownerId !== user.username) {
      return NextResponse.json(
        { error: 'Only the creator can delete the team' },
        { status: 403 }
      );
    }

    // Remover todos los miembros primero
    await prisma.user.updateMany({
      where: { teamId: teamId },
      data: { teamId: null },
    });

    // Eliminar el team
    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando team:', error);
    return NextResponse.json(
      { error: 'Error deleting team' },
      { status: 500 }
    );
  }
}
