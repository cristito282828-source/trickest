import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/notifications/read-all - Marcar todas las notificaciones como leídas
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.email,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    return NextResponse.json(
      { error: 'Error al marcar notificaciones como leídas' },
      { status: 500 }
    );
  }
}
