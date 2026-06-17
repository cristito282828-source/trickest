import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import {
  createOrderSchema,
  validateRequest,
  successResponse,
  errorResponse,
} from '@/lib/validation';
import { rateLimitCheck, rateLimitResponse, RateLimits } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders
 *
 * Devuelve las órdenes:
 * - Si el usuario es admin: todas las órdenes (con filtros opcionales por status)
 * - Si el usuario es skater: solo las suyas
 * - Si no hay sesión: error 401
 *
 * Query params:
 *   - status: filter by status (pending, confirmed, shipped, delivered, cancelled)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get('status');

    const isAdmin = session.user.role === 'admin';
    const userEmail = session.user.email;

    const orders = await prisma.order.findMany({
      where: {
        // Skater solo ve las suyas; admin ve todas
        ...(isAdmin
          ? statusFilter
            ? { status: statusFilter }
            : {}
          : { userId: userEmail, ...(statusFilter ? { status: statusFilter } : {}) }),
        // Guest orders (sin userId) solo las ve el admin
        ...(isAdmin ? {} : { NOT: { userId: null } }),
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return successResponse({
      orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('[API /orders] GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error fetching orders', 500);
  }
}

/**
 * POST /api/orders
 *
 * Crea una nueva orden (solicitud de pedido).
 *
 * Body:
 * {
 *   customerName, customerEmail, customerPhone,
 *   shippingAddress, shippingCity, shippingNotes,
 *   items: [{ productId, productName, productPrice, productImage, productSlug, quantity }]
 * }
 *
 * - Si el usuario está logueado, su email se usa como userId
 * - Si no, se crea como guest order (userId = null)
 * - Crea la orden + items en una transacción
 * - Notifica a TODOS los admins en la campana
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Auth requerida: solo skaters logueados pueden hacer pedidos
    if (!session?.user?.email) {
      return errorResponse(
        'UNAUTHORIZED',
        'Debes iniciar sesión para hacer un pedido',
        401
      );
    }

    // Rate limiting: 5 por minuto por usuario
    const rateLimit = await rateLimitCheck(request, RateLimits.submitTrick);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const body = await request.json();
    const validatedData = await validateRequest(createOrderSchema, body);

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingNotes,
      items,
    } = validatedData;

    // El userId SIEMPRE viene de la sesión (nunca del form, por seguridad)
    const userId = session.user.email;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    // Crear la orden + items en una transacción
    const order = await prisma.$transaction(async (tx) => {
      // 1. Crear la orden
      const newOrder = await tx.order.create({
        data: {
          userId,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          shippingCity,
          shippingNotes: shippingNotes || null,
          status: 'pending',
          totalItems,
        },
      });

      // 2. Crear los items
      await tx.orderItem.createMany({
        data: items.map((item: {
          productId: string;
          productName: string;
          productPrice: string;
          productImage?: string;
          productSlug: string;
          quantity: number;
          variation?: unknown;
        }) => ({
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          productImage: item.productImage || null,
          productSlug: item.productSlug,
          quantity: item.quantity,
          variation: item.variation ?? Prisma.JsonNull,
        })),
      });

      return newOrder;
    });

    // 2. Notificar a TODOS los admins (fuera de la transacción)
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'admin' },
        select: { email: true },
      });

      if (admins.length > 0) {
        const itemSummary = items.length === 1
          ? `1 producto`
          : `${items.length} productos`;
        const firstItemName = items[0]?.productName ?? 'producto';

        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.email,
            type: 'order_created',
            title: '🛹 Nueva solicitud de pedido',
            message: `${customerName} quiere pedir ${itemSummary}${items.length === 1 ? `: ${firstItemName}` : ''}`,
            link: '/dashboard/admin/orders',
            metadata: {
              orderId: order.id,
              skaterEmail: customerEmail,
              totalItems,
              itemCount: items.length,
            },
          })),
        });
      }
    } catch (notifError) {
      // No fallar la orden si las notificaciones fallan
      console.error('[API /orders] Notification error:', notifError);
    }

    return successResponse(
      {
        orderId: order.id,
        message: 'Order created successfully',
      },
      201
    );
  } catch (error) {
    console.error('[API /orders] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error creating order', 500);
  }
}
