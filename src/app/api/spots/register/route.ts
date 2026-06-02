import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface RegisterSpotRequest {
  name: string;
  type: 'SKATEPARK' | 'SKATESHOP' | 'SPOT';
  latitude: number;
  longitude: number;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  photos?: string[];
  features?: string[];
  forceProceed?: boolean; // Forzar registro aunque haya spots cercanos
}

// POST /api/spots/register - Registrar nuevo spot
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar autenticación
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Debes iniciar sesión para registrar spots', 401);
    }

    const body: RegisterSpotRequest = await req.json();
    const {
      name,
      type,
      latitude,
      longitude,
      description,
      address,
      city,
      state,
      photos = [],
      features = [],
      forceProceed = false
    } = body;

    // Debug: log de las fotos recibidas
    console.log('📸 Registro de spot - Fotos recibidas:', {
      count: photos.length,
      photos: photos,
      userEmail: session.user.email
    });

    // Validaciones básicas
    if (!name || name.trim().length < 3) {
      return errorResponse('VALIDATION_ERROR', 'El nombre debe tener al menos 3 caracteres', 400);
    }

    if (!type || !['SKATEPARK', 'SKATESHOP', 'SPOT'].includes(type)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid spot type', 400);
    }

    if (!latitude || !longitude) {
      return errorResponse('VALIDATION_ERROR', 'Las coordenadas son obligatorias', 400);
    }

    // Validar coordenadas estén en rango razonable
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return errorResponse('VALIDATION_ERROR', 'Coordenadas GPS inválidas', 400);
    }

    // Verificar que el usuario esté cerca del spot (GPS proximity validation)
    // Por ahora, solo registramos la ubicación desde donde se creó
    const userLocation = { latitude, longitude };

    // Buscar spots duplicados cerca (radio de 100 metros)
    // Máximo 4 spots permitidos en el área antes de bloquear nuevos registros
    const nearbySpots = await prisma.spot.findMany({
      where: {
        AND: [
          { latitude: { gte: latitude - 0.001 } },
          { latitude: { lte: latitude + 0.001 } },
          { longitude: { gte: longitude - 0.001 } },
          { longitude: { lte: longitude + 0.001 } }
        ]
      },
      take: 5 // Obtener máximo 5 para mostrar
    });

    // Si hay 4 o más spots cercanos, advertir al usuario
    if (nearbySpots.length >= 4) {
      return NextResponse.json({
        success: false,
        message: 'Hay muchos spots registrados cerca de esta ubicación. ¿Seguro que es un spot nuevo?',
        code: 'TOO_MANY_NEARBY',
        nearbySpots: nearbySpots.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          stage: s.stage,
          distance: calculateDistance(latitude, longitude, s.latitude, s.longitude)
        })),
        suggest: 'Verifica que no sea un duplicado antes de continuar'
      }, { status: 409 });
    }

    // Si hay 1-3 spots cercanos, advertir pero permitir (a menos que forceProceed sea true)
    if (nearbySpots.length > 0 && !forceProceed) {
      return NextResponse.json({
        success: false,
        message: `Hay ${nearbySpots.length} spot(s) cercano(s). ¿Quieres registrar otro o validar uno existente?`,
        code: 'NEARBY_SPOTS_FOUND',
        nearbySpots: nearbySpots.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          stage: s.stage,
          distance: calculateDistance(latitude, longitude, s.latitude, s.longitude)
        })),
        canProceed: true // Permitir que el usuario decida
      }, { status: 409 });
    }

    // Crear el spot con estado GHOST
    const spot = await prisma.spot.create({
      data: {
        name: name.trim(),
        type,
        description,
        address,
        city,
        state,
        country: 'Colombia',
        latitude,
        longitude,
        photos,
        features,
        createdBy: session.user.email,
        confidenceScore: 0,
        stage: 'GHOST',
        lastVerifiedAt: new Date(),
        lastActivityAt: new Date(),
        statusHistory: [{
          action: 'CREATED',
          userId: session.user.email,
          timestamp: new Date().toISOString(),
          details: 'Spot creado inicialmente'
        }]
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        type: true,
        stage: true,
        confidenceScore: true,
        latitude: true,
        longitude: true,
        city: true,
        photos: true,
        createdAt: true
      }
    });

    // Crear registros de fotos en SpotPhoto para cada foto
    if (photos && photos.length > 0 && session.user.email) {
      const userEmail = session.user.email;
      const photoRecords = photos.map(photoUrl => ({
        spotId: spot.id,
        userId: userEmail,
        url: photoUrl,
        isLive: photoUrl.includes('LIVE_'), // Si el nombre contiene LIVE_, es foto en vivo
      }));

      console.log('💾 Creando registros de fotos:', photoRecords);

      await prisma.spotPhoto.createMany({
        data: photoRecords
      });

      console.log('✅ Fotos guardadas en base de datos');
    } else {
      console.log('⚠️ No hay fotos para guardar o usuario sin email');
    }

    // Crear validación inicial del creador
    await prisma.spotValidation.create({
      data: {
        spotId: spot.id,
        userId: session.user.email,
        userWeight: 1, // Peso inicial
        method: photos && photos.length > 0 ? 'PHOTO_UPLOAD' : 'GPS_PROXIMITY', // Si hay foto, usa PHOTO_UPLOAD
        validatedLat: latitude,
        validatedLng: longitude,
        accuracy: 10 // Asumimos 10 metros de precisión
      }
    });

    return successResponse({
      spot,
      message: 'Spot registrado successfully',
      nextSteps: [
        'Comparte el spot con amigos para que lo validen',
        '3 validaciones necesarias para aparecer en el mapa (stage REVIEW)',
        '10 validaciones para ser verificado (stage VERIFIED)'
      ]
    }, 201);

  } catch (error) {
    console.error('Error registrando spot:', error);
    return errorResponse('INTERNAL_ERROR', 'Error al registrar el spot', 500);
  }
}

// GET /api/spots/register - Obtener información para el formulario
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    // Retornar información útil para el formulario
    return successResponse({
      info: {
        spotTypes: [
          { value: 'SKATEPARK', label: '🛹 Skatepark', description: 'Parque público o privado para patinar' },
          { value: 'SKATESHOP', label: '🏪 Skateshop', description: 'Tienda de equipment o ropa' },
          { value: 'SPOT', label: '📍 Spot', description: 'Spot callejero, ledge, rail, etc.' }
        ],
        commonFeatures: [
          'street', 'bowl', 'mini-ramp', 'vert', 'pyramid',
          'rail', 'ledge', 'stairs', 'bank', 'gap',
          'coping', 'manual_pad', 'cradle', 'eurogap'
        ],
        requirements: {
          minNameLength: 3,
          maxNameLength: 100,
          photosRequired: false, // Opcional en MVP
          maxPhotos: 10
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo info de registro:', error);
    return errorResponse('INTERNAL_ERROR', 'Server error', 500);
  }
}

// Helper function para calcular distancia entre dos coordenadas (en metros)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radio de la Tierra en metros
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
