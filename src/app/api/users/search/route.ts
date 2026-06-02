import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/users/search?q=query - Buscar usuarios por nombre, email o username
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Buscar usuarios que coincidan con la query
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { username: { contains: query, mode: 'insensitive' } },
            ],
          },
          // No mostrar al usuario actual
          { email: { not: session.user.email } },
          // Solo usuarios con perfil completo
          { profileStatus: 'complete' },
        ],
      },
      select: {
        email: true,
        name: true,
        username: true,
        photo: true,
        teamId: true,
      },
      take: 10, // Máximo 10 resultados
      orderBy: {
        name: 'asc',
      },
    });

    // Agregar información de disponibilidad
    const usersWithAvailability = users.map((user) => ({
      email: user.email,
      name: user.name,
      username: user.username,
      photo: user.photo,
      hasTeam: user.teamId !== null,
    }));

    return NextResponse.json({ users: usersWithAvailability });
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    return NextResponse.json(
      { error: 'Error al buscar usuarios' },
      { status: 500 }
    );
  }
}
