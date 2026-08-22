import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import {
  updateOrderStatusSchema,
  validateRequest,
  successResponse,
  errorResponse,
} from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/[id]
 *
 * Devuelve el detalle de una orden.
 * - Admin: puede ver cualquier orden
 * - Skater: solo puede ver sus propias órdenes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return errorResponse('INVALID_ID', 'Invalid order ID', 400);
    }

    const isAdmin = session.user.role === 'admin';
    const userEmail = session.user.email;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return errorResponse('NOT_FOUND', 'Order not found', 404);
    }

    // Skater solo puede ver sus propias órdenes
    if (!isAdmin && order.userId !== userEmail) {
      return errorResponse('FORBIDDEN', 'You can only view your own orders', 403);
    }

    return successResponse({ order });
  } catch (error) {
    console.error('[API /orders/[id]] GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error fetching order', 500);
  }
}

/**
 * PATCH /api/orders/[id]
 *
 * Actualiza el status de una orden. Solo admins.
 * Body: { status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" }
 *
 * Notifica al skater dueño del cambio de status.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    if (session.user.role !== 'admin') {
      return errorResponse('FORBIDDEN', 'Only admins can update order status', 403);
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return errorResponse('INVALID_ID', 'Invalid order ID', 400);
    }

    const body = await request.json();
    const { status, shippingGuideUrl } = await validateRequest(updateOrderStatusSchema, body);

    // Verificar que la orden existe
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Order not found', 404);
    }

    // Actualizar status (y shippingGuideUrl si vino en el body)
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(shippingGuideUrl && { shippingGuideUrl }),
      },
    });

    // Notificar al skater dueño de la orden
    if (existing.userId) {
      const statusMessages: Record<string, { title: string; emoji: string }> = {
        confirmed: { title: 'Tu pedido fue confirmado', emoji: '✅' },
        shipped: { title: 'Tu pedido está en camino', emoji: '🚚' },
        delivered: { title: 'Tu pedido fue entregado', emoji: '📦' },
        cancelled: { title: 'Tu pedido fue cancelado', emoji: '❌' },
        pending: { title: 'Tu pedido está pendiente', emoji: '⏳' },
      };

      const msg = statusMessages[status] ?? statusMessages.pending;

      try {
        await prisma.notification.create({
          data: {
            userId: existing.userId,
            type: `order_${status}`,
            title: `${msg.emoji} ${msg.title}`,
            message: `Tu pedido #${orderId} (${existing.totalItems} ${existing.totalItems === 1 ? 'producto' : 'productos'}) cambió a estado: ${status}`,
            link: '/dashboard/skaters/orders',
            metadata: {
              orderId,
              status,
              previousStatus: existing.status,
              ...(shippingGuideUrl && { shippingGuideUrl }),
            },
          },
        });
      } catch (notifError) {
        console.error('[API /orders/[id]] Notification error:', notifError);
      }
    }

    return successResponse({ order: updated });
  } catch (error) {
    console.error('[API /orders/[id]] PATCH error:', error);

    // Distinguish ValidationError so el cliente ve el mensaje real
    if (error instanceof Error && error.name === 'ValidationError') {
      return errorResponse('VALIDATION_ERROR', error.message, 400, (error as any).details);
    }

    // Prisma column-not-found / DB errors
    if (error instanceof Error && /column.*does not exist/i.test(error.message)) {
      return errorResponse(
        'DB_MIGRATION_REQUIRED',
        `Database column missing — run \`npx prisma migrate dev\`. Original: ${error.message}`,
        500
      );
    }

    return errorResponse('INTERNAL_ERROR', 'Error updating order', 500);
  }
}
