import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

interface AddPhotoRequest {
  spotId: number;
  url: string;
  isLive?: boolean;
  hasExif?: boolean;
  exifLat?: number;
  exifLng?: number;
}

// POST /api/spots/:spotId/photos - Agregar foto a un spot
export async function POST(
  req: Request,
  { params }: { params: { spotId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'UNAUTHORIZED',
        message: 'You must log in'
      }, { status: 401 });
    }

    const spotId = parseInt(params.spotId);
    if (isNaN(spotId)) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid spot ID'
      }, { status: 400 });
    }

    const body: AddPhotoRequest = await req.json();
    const { url, isLive = false, hasExif = false, exifLat, exifLng } = body;

    // Validar que el spot existe
    const spot = await prisma.spot.findUnique({
      where: { id: spotId }
    });

    if (!spot) {
      return NextResponse.json({
        error: 'NOT_FOUND',
        message: 'Spot not found'
      }, { status: 404 });
    }

    // Verificar que el usuario es el creador o un validador
    const userValidation = await prisma.spotValidation.findFirst({
      where: { spotId, userId: session.user.email }
    });

    if (!userValidation && spot.createdBy !== session.user.email) {
      return NextResponse.json({
        error: 'FORBIDDEN',
        message: 'Solo quienes han validado el spot pueden agregar fotos'
      }, { status: 403 });
    }

    // Crear registro de foto
    const photo = await prisma.spotPhoto.create({
      data: {
        spotId,
        userId: session.user.email,
        url,
        isLive,
        hasExif,
        exifLat,
        exifLng
      }
    });

    // Actualizar el array de photos en el spot
    const updatedSpot = await prisma.spot.update({
      where: { id: spotId },
      data: {
        photos: [...spot.photos, url],
        lastActivityAt: new Date()
      }
    });

    // Recalcular confidence score (las fotos dan puntos)
    // TODO: Llamar a calculateConfidenceScore(spotId)

    return NextResponse.json({
      success: true,
      photo,
      spot: updatedSpot,
      message: 'Foto agregada successfully'
    });

  } catch (error) {
    console.error('Error agregando foto:', error);
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Error al agregar la foto'
    }, { status: 500 });
  }
}
