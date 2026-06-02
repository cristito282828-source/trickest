import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notifyTeamInvitation } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// GET /api/teams/invitations - Obtener mis invitaciones pendientes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        invitedUserEmail: session.user.email,
        status: 'pending',
      },
      include: {
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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Agregar información adicional (memberCount)
    const invitationsWithInfo = invitations.map((inv) => ({
      id: inv.id,
      teamId: inv.teamId,
      teamName: inv.team.name,
      teamLogo: inv.team.logo,
      teamDescription: inv.team.description,
      owner: inv.team.owner,
      memberCount: inv.team.members.length,
      maxMembers: inv.team.maxMembers,
      createdAt: inv.createdAt,
    }));

    return NextResponse.json({ invitations: invitationsWithInfo });
  } catch (error) {
    console.error('Error obteniendo invitaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener invitaciones' },
      { status: 500 }
    );
  }
}

// POST /api/teams/invitations - Enviar una invitación
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { invitedUserEmail } = body;

    if (!invitedUserEmail || !invitedUserEmail.trim()) {
      return NextResponse.json(
        { error: 'Debes proporcionar el email del usuario a invitar' },
        { status: 400 }
      );
    }

    // Obtener el usuario actual y verificar que tenga un equipo
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        email: true,
        username: true,
        name: true,
        teamId: true,
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!user?.team) {
      return NextResponse.json(
        { error: 'No tienes un equipo' },
        { status: 400 }
      );
    }

    // Verificar que el usuario es el dueño del equipo
    if (user.team.ownerId !== user.username) {
      return NextResponse.json(
        { error: 'Only the team creator can send invitations' },
        { status: 403 }
      );
    }

    // Verificar que el equipo no esté lleno
    if (user.team.members.length >= user.team.maxMembers) {
      return NextResponse.json(
        { error: 'The team is full' },
        { status: 400 }
      );
    }

    // Verificar que el usuario invitado existe
    const invitedUser = await prisma.user.findUnique({
      where: { email: invitedUserEmail.trim() },
      select: { email: true, teamId: true },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: 'El usuario no existe' },
        { status: 404 }
      );
    }

    // Verificar que el usuario invitado no tiene equipo
    if (invitedUser.teamId) {
      return NextResponse.json(
        { error: 'Este usuario ya pertenece a un equipo' },
        { status: 400 }
      );
    }

    // Crear la invitación
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId: user.team.id,
        invitedUserEmail: invitedUser.email,
      },
    });

    // Enviar notificación
    await notifyTeamInvitation({
      userEmail: invitedUser.email,
      teamName: user.team.name,
      teamId: user.team.id,
      inviterName: session.user.name || null,
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error('Error enviando invitación:', error);
    return NextResponse.json(
      { error: 'Error sending invitation' },
      { status: 500 }
    );
  }
}
