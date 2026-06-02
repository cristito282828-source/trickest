import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/teams/invitations/[id]/reject - Rechazar y eliminar una invitación
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

    // Eliminar la invitación (así se puede invitar de nuevo al mismo usuario)
    await prisma.teamInvitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rechazando invitación:', error);
    return NextResponse.json(
      { error: 'Error rejecting invitation' },
      { status: 500 }
    );
  }
}
