import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Obtener un spot por ID
export async function GET(
  req: Request,
  { params }: { params: { spotId: string } }
) {
  try {
    const spotId = parseInt(params.spotId);

    if (isNaN(spotId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    return NextResponse.json({ spot });
  } catch (error) {
    console.error('Error obteniendo spot:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Actualizar un spot (solo creador o admin)
export async function PUT(
  req: Request,
  { params }: { params: { spotId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const spotId = parseInt(params.spotId);

    if (isNaN(spotId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Verificar que el spot existe
    const existingSpot = await prisma.spot.findUnique({
      where: { id: spotId },
    });

    if (!existingSpot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    // Verificar permisos (solo creador o admin)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    const isAdmin = user?.role === 'admin';
    const isCreator = existingSpot.createdBy === session.user.email;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar este spot' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      type,
      description,
      address,
      city,
      state,
      country,
      latitude,
      longitude,
      phone,
      website,
      instagram,
      photos,
      features,
    } = body;

    // Validaciones
    if (type && type !== 'skatepark' && type !== 'skateshop') {
      return NextResponse.json(
        { error: 'Tipo debe ser "skatepark" o "skateshop"' },
        { status: 400 }
      );
    }

    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      return NextResponse.json({ error: 'Latitud inválida' }, { status: 400 });
    }

    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      return NextResponse.json({ error: 'Longitud inválida' }, { status: 400 });
    }

    // Solo admin puede verificar spots
    const updateData: Prisma.SpotUpdateInput = {
      ...(name && { name }),
      ...(type && { type }),
      ...(description !== undefined && { description }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(country && { country }),
      ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
      ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
      ...(phone !== undefined && { phone }),
      ...(website !== undefined && { website }),
      ...(instagram !== undefined && { instagram }),
      ...(photos && { photos }),
      ...(features && { features }),
    };

    const spot = await prisma.spot.update({
      where: { id: spotId },
      data: updateData,
    });

    return NextResponse.json({ success: true, spot });
  } catch (error) {
    console.error('Error actualizando spot:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Eliminar un spot (solo creador o admin)
export async function DELETE(
  req: Request,
  { params }: { params: { spotId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const spotId = parseInt(params.spotId);

    if (isNaN(spotId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Verificar que el spot existe
    const existingSpot = await prisma.spot.findUnique({
      where: { id: spotId },
    });

    if (!existingSpot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    // Verificar permisos (solo creador o admin)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    const isAdmin = user?.role === 'admin';
    const isCreator = existingSpot.createdBy === session.user.email;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this spot' },
        { status: 403 }
      );
    }

    await prisma.spot.delete({
      where: { id: spotId },
    });

    return NextResponse.json({ success: true, message: 'Spot eliminado' });
  } catch (error) {
    console.error('Error eliminando spot:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
