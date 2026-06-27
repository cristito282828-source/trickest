import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/count
 * Devuelve el conteo total de usuarios registrados.
 * Usado por la sección "Challenges coming soon" del home para mostrar
 * la barra de progreso hacia los 1000 registros.
 */
export async function GET() {
  try {
    const count = await prisma.user.count();
    return NextResponse.json({ count });
  } catch (error) {
    console.error('[API /users/count] GET error:', error);
    // Devolver 0 silenciosamente: la home no debe romperse si falla el conteo.
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
