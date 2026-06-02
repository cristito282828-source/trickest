import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface ValidateSpotRequest {
  method: 'GPS_PROXIMITY' | 'PHOTO_UPLOAD' | 'LIVE_PHOTO' | 'CHECK_IN' | 'CROWD_REPORT';
  latitude: number;
  longitude: number;
  crowdLevel?: 'EMPTY' | 'LOW' | 'MODERATE' | 'BUSY' | 'CROWDED';
  isOpen?: boolean;
  photoUrl?: string;
}

// POST /api/spots/:spotId/validate - Validar un spot
export async function POST(
  req: Request,
  { params }: { params: { spotId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'You must log in', 401);
    }

    const userEmail = session.user.email;
    const spotId = parseInt(params.spotId);
    if (isNaN(spotId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid spot ID', 400);
    }

    const body: ValidateSpotRequest = await req.json();
    const { method, latitude, longitude, crowdLevel, isOpen, photoUrl } = body;

    // Validar que el spot existe
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: {
        validations: true
      }
    });

    if (!spot) {
      return errorResponse('NOT_FOUND', 'Spot not found', 404);
    }

    // Validar coordenadas GPS
    const distance = calculateDistance(latitude, longitude, spot.latitude, spot.longitude);

    // REGLA: Usuario debe estar a menos de 50 metros para validar
    if (distance > 50) {
      return NextResponse.json({
        success: false,
        message: `Debes estar dentro del spot para validarlo`,
        currentDistance: Math.round(distance),
        maxDistance: 50,
        hint: distance < 200
          ? 'Estás cerca, acércate un poco más'
          : 'Estás muy lejos, verifica tu ubicación'
      }, { status: 400 });
    }

    // Verificar que el usuario no haya validado ya con este método
    const existingValidation = await prisma.spotValidation.findUnique({
      where: {
        spotId_userId_method: {
          spotId,
          userId: userEmail,
          method
        }
      }
    });

    if (existingValidation) {
      return errorResponse(
        'ALREADY_VALIDATED',
        'Ya validaste este spot con este método anteriormente',
        400
      );
    }

    // Obtener reputación del usuario
    const userReputation = await getUserReputation(userEmail);
    const userWeight = userReputation?.validationWeight || 1;

    // Crear validación
    const validation = await prisma.spotValidation.create({
      data: {
        spotId,
        userId: userEmail,
        userWeight,
        method,
        validatedLat: latitude,
        validatedLng: longitude,
        accuracy: distance // Precisión = distancia al punto exacto
      }
    });

    // Si es un CHECK_IN con crowdLevel, también crear registro en SpotCheckIn
    if (method === 'CHECK_IN' && crowdLevel) {
      await prisma.spotCheckIn.create({
        data: {
          spotId,
          userId: userEmail,
          latitude,
          longitude,
          accuracy: distance,
          crowdLevel,
          isOpen
        }
      });
    }

    // Recalcular confidence score del spot
    const newScore = await calculateConfidenceScore(spotId);

    // Contar total de validaciones únicas para este spot
    const validationCountData = await prisma.spotValidation.groupBy({
      by: ['userId'],
      where: { spotId }
    });

    const uniqueValidationCount = validationCountData.length;

    // Actualizar el spot
    const updatedSpot = await prisma.spot.update({
      where: { id: spotId },
      data: {
        confidenceScore: newScore,
        lastActivityAt: new Date(),
        // Actualizar stage basado en score
        stage: getStageFromScore(newScore),
        // Si tiene actividad reciente, marcar como "hot"
        isHot: true,
        hotUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      }
    });

    // Actualizar reputación del usuario
    await updateUserReputation(userEmail, {
      validationsGiven: { increment: 1 },
      reputationScore: { increment: getMethodPoints(method) }
    });

    return successResponse({
      validation,
      spot: updatedSpot,
      pointsEarned: getMethodPoints(method),
      newScore,
      validationCount: uniqueValidationCount, // Total de validaciones únicas
      message: '¡Spot validado successfully!'
    });

  } catch (error) {
    console.error('Error validando spot:', error);
    return errorResponse('INTERNAL_ERROR', 'Error al validar el spot', 500);
  }
}

// Helper functions

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getStageFromScore(score: number): string {
  if (score < 10) return 'GHOST';
  if (score < 50) return 'REVIEW';
  if (score < 100) return 'VERIFIED';
  return 'LEGENDARY';
}

function getMethodPoints(method: string): number {
  switch (method) {
    case 'LIVE_PHOTO': return 10;
    case 'PHOTO_UPLOAD': return 5;
    case 'CROWD_REPORT': return 3;
    case 'GPS_PROXIMITY': return 2;
    case 'CHECK_IN': return 1;
    default: return 1;
  }
}

async function calculateConfidenceScore(spotId: number): Promise<number> {
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    include: {
      validations: true,
      photos_records: true
    }
  });

  if (!spot) return 0;

  let score = 0;

  // Validaciones únicas (máx 50 puntos)
  const uniqueValidations = new Set(spot.validations.map(v => v.userId));
  score += Math.min(uniqueValidations.size * 5, 50);

  // Peso acumulado por método (máx 60 puntos)
  const methodWeights = spot.validations.reduce((sum, v) => {
    return sum + (v.userWeight * getMethodPoints(v.method));
  }, 0);
  score += Math.min(methodWeights, 60);

  // Fotos únicas (máx 40 puntos)
  const uniquePhotos = new Set(spot.photos_records.map(p => p.userId));
  score += Math.min(uniquePhotos.size * 3, 40);

  return Math.min(score, 200); // Máximo 200
}

async function getUserReputation(userId: string) {
  return await prisma.userReputation.findUnique({
    where: { userId }
  });
}

async function updateUserReputation(userId: string, updates: Prisma.UserReputationUpdateInput) {
  await prisma.userReputation.upsert({
    where: { userId },
    create: {
      userId,
      level: 'NEW',
      validationWeight: 1,
      validationsGiven: 0,
      reputationScore: 0,
      spotsVerified: 0,
      badges: []
    },
    update: updates
  });
}
