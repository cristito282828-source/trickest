import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Obtener ubicación del usuario
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (email !== session.user.email) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        ciudad: true,
        departamento: true,
        estado: true,
        latitude: true,
        longitude: true,
        showOnMap: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Actualizar ubicación del usuario
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { email, ciudad, departamento, estado, latitude, longitude, showOnMap } = body;

    // Verificar que el usuario solo pueda editar su propia ubicación
    if (email !== session.user.email) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Validación: si showOnMap es true y se están proporcionando coordenadas, estas deben ser válidas
    if (showOnMap && (latitude !== undefined && latitude !== null) && (!latitude || !longitude)) {
      return NextResponse.json(
        { error: 'Valid coordinates are required to appear on the map' },
        { status: 400 }
      );
    }

    // Construir objeto de actualización condicional
    const updateData: Prisma.UserUpdateInput = {};

    if (ciudad !== undefined) updateData.ciudad = ciudad || null;
    if (departamento !== undefined) updateData.departamento = departamento || null;
    if (estado !== undefined) updateData.estado = estado || null;
    if (latitude !== undefined) updateData.latitude = latitude || null;
    if (longitude !== undefined) updateData.longitude = longitude || null;
    if (showOnMap !== undefined) updateData.showOnMap = showOnMap;

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData,
      select: {
        id: true,
        email: true,
        ciudad: true,
        departamento: true,
        estado: true,
        latitude: true,
        longitude: true,
        showOnMap: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
