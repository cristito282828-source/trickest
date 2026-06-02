import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/teams/[id]/join - Unirse a un team
export async function POST(
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

    // Verificar si el usuario ya tiene un team
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { teamId: true },
    });

    if (user?.teamId) {
      return NextResponse.json(
        { error: 'You already belong to a team. You must leave first.' },
        { status: 400 }
      );
    }

    // Obtener el team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: { email: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (!team.isActive) {
      return NextResponse.json(
        { error: 'This team is not active' },
        { status: 400 }
      );
    }

    // Verificar si hay espacio
    if (team.members.length >= team.maxMembers) {
      return NextResponse.json(
        { error: 'The team is full' },
        { status: 400 }
      );
    }

    // Agregar al usuario al team
    await prisma.user.update({
      where: { email: session.user.email },
      data: { teamId: teamId },
    });

    return NextResponse.json({
      success: true,
      message: `You have joined team ${team.name}`,
    });
  } catch (error) {
    console.error('Error uniéndose al team:', error);
    return NextResponse.json(
      { error: 'Error joining team' },
      { status: 500 }
    );
  }
}
