import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// GET /api/notifications - Obtener notificaciones del usuario
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const userEmail = session.user.email;
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (limit > 50) {
      return errorResponse('VALIDATION_ERROR', 'Maximum limit is 50 notifications', 400);
    }

    // Constramar el where clause
    const where: any = { userId: userEmail };
    if (unreadOnly) {
      where.isRead = false;
    }

    // Obtener notificaciones
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Contar total de notificaciones no leídas
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userEmail,
        isRead: false
      }
    });

    // Contar total de notificaciones (para el filtro actual)
    const total = await prisma.notification.count({ where });

    return successResponse({
      notifications,
      unreadCount,
      total,
      hasMore: offset + notifications.length < total
    });

  } catch (error: any) {
    console.error('Error obteniendo notificaciones:', error);

    const message = process.env.NODE_ENV === 'development'
      ? error.message || 'Error fetching notifications'
      : 'Error fetching notifications';

    return errorResponse('INTERNAL_ERROR', message, 500);
  }
}

// POST /api/notifications - Crear una notificación (interno/admin)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, type, title, message, link, metadata } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata || null,
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error creando notificación:', error);
    return NextResponse.json(
      { error: 'Error creating notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Marcar notificaciones como leídas
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'You must log in', 401);
    }

    const userEmail = session.user.email;
    const body = await req.json();
    const { notificationIds, markAll } = body;

    // Si markAll es true, marcar todas como leídas
    if (markAll) {
      await prisma.notification.updateMany({
        where: {
          userId: userEmail,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return successResponse({
        message: 'All notifications marked as read'
      });
    }

    // Si se proporcionan IDs específicos
    if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: userEmail
        },
        data: {
          isRead: true
        }
      });

      return successResponse({
        message: 'Notifications marked as read'
      });
    }

    return errorResponse('VALIDATION_ERROR', 'Must provide notificationIds or markAll=true', 400);

  } catch (error: any) {
    console.error('Error marcando notificaciones:', error);

    const message = process.env.NODE_ENV === 'development'
      ? error.message || 'Error marking notifications'
      : 'Error marking notifications';

    return errorResponse('INTERNAL_ERROR', message, 500);
  }
}

