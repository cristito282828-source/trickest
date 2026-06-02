import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/teams/[id]/leave - Salir de un team
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

    // Verificar que el usuario pertenece al team
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { teamId: true },
    });

    if (user?.teamId !== teamId) {
      return NextResponse.json(
        { error: 'No perteneces a este equipo' },
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

    // Si es el owner y hay más miembros, transferir ownership o no permitir salir
    if (team.ownerId === session.user.email) {
      if (team.members.length > 1) {
        return NextResponse.json(
          {
            error:
              'Eres el creador del equipo. Transfiere el liderazgo o elimina el equipo.',
          },
          { status: 400 }
        );
      }
      // Si es el único miembro, eliminar el team
      await prisma.user.update({
        where: { email: session.user.email },
        data: { teamId: null },
      });
      await prisma.team.delete({
        where: { id: teamId },
      });
      return NextResponse.json({
        success: true,
        message: 'Has abandonado y el equipo fue eliminado',
      });
    }

    // Remover al usuario del team
    await prisma.user.update({
      where: { email: session.user.email },
      data: { teamId: null },
    });

    return NextResponse.json({
      success: true,
      message: `Has abandonado el equipo ${team.name}`,
    });
  } catch (error) {
    console.error('Error saliendo del team:', error);
    return NextResponse.json(
      { error: 'Error al salir del team' },
      { status: 500 }
    );
  }
}
