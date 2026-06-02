import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notifyTeamAccepted } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// POST /api/teams/invitations/[id]/accept - Aceptar una invitación
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const invitationId = parseInt(params.id);

    if (isNaN(invitationId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Obtener la invitación
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Verificar que la invitación es para el usuario actual
    if (invitation.invitedUserEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'This invitation is not for you' },
        { status: 403 }
      );
    }

    // Verificar que la invitación está pendiente
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invitation has already been processed' },
        { status: 400 }
      );
    }

    // Verificar que el usuario no tiene equipo
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { teamId: true },
    });

    if (user?.teamId) {
      return NextResponse.json(
        { error: 'Ya perteneces a un equipo' },
        { status: 400 }
      );
    }

    // Verificar que el equipo no está lleno
    if (invitation.team.members.length >= invitation.team.maxMembers) {
      return NextResponse.json(
        { error: 'The team is full' },
        { status: 400 }
      );
    }

    // Aceptar la invitación y unirse al equipo
    await prisma.$transaction([
      // Actualizar la invitación
      prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'accepted' },
      }),
      // Agregar al usuario al equipo
      prisma.user.update({
        where: { email: session.user.email },
        data: { teamId: invitation.teamId },
      }),
    ]);

    // Enviar notificación de confirmación
    await notifyTeamAccepted({
      userEmail: session.user.email,
      teamName: invitation.team.name,
      teamId: invitation.teamId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error aceptando invitación:', error);
    return NextResponse.json(
      { error: 'Error accepting invitation' },
      { status: 500 }
    );
  }
}
