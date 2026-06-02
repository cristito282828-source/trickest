import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

interface NearbySpot {
  id: number;
  uuid: string | null;
  name: string;
  type: string;
  stage: string;
  confidenceScore: number;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  isHot: boolean;
  distance: number; // Calculado
}

// GET /api/spots/nearby?lat=&lng=&radius=&stage=
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // No requiere autenticación para ver spots públicos
    // Pero si está autenticado, puede ver spots GHOST que creó

    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '5'); // Radio en km (default 5km)
    const stageFilter = searchParams.get('stage'); // Filtro opcional por stage
    const typeFilter = searchParams.get('type'); // Filtro opcional por tipo

    if (!lat || !lng) {
      return NextResponse.json({
        error: 'Coordenadas requeridas',
        message: 'Se requieren parámetros lat y lng'
      }, { status: 400 });
    }

    // Calcular delta para búsqueda geoespacial
    // Aproximadamente 1 grado ≈ 111 km
    const delta = radius / 111;

    // Construir filtro where
    const andFilters: Prisma.SpotWhereInput[] = [
      { latitude: { gte: lat - delta } },
      { latitude: { lte: lat + delta } },
      { longitude: { gte: lng - delta } },
      { longitude: { lte: lng + delta } }
    ];

    // Filtrar por stage si se especifica
    if (stageFilter) {
      andFilters.push({ stage: stageFilter });
    }

    // Filtrar por tipo si se especifica
    if (typeFilter) {
      andFilters.push({ type: typeFilter });
    }

    // Si NO está autenticado, solo mostrar spots REVIEW+
    if (!session?.user?.email) {
      andFilters.push({
        stage: { in: ['REVIEW', 'VERIFIED', 'LEGENDARY'] }
      });
    }

    const whereClause: Prisma.SpotWhereInput = {
      AND: andFilters
    };

    const spots = await prisma.spot.findMany({
      where: whereClause,
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
        state: true,
        isHot: true,
        lastActivityAt: true,
        photos: true,
        rating: true
      },
      orderBy: [
        { isHot: 'desc' }, // Spots "hot" primero
        { confidenceScore: 'desc' }, // Luego por confianza
        { lastActivityAt: 'desc' } // Luego por actividad reciente
      ]
    });

    // Obtener IDs de spots para contar validaciones
    const spotIds = spots.map(s => s.id);

    // Contar validaciones por spot
    const validationCounts = await prisma.spotValidation.groupBy({
      by: ['spotId'],
      where: {
        spotId: { in: spotIds }
      },
      _count: {
        spotId: true
      }
    });

    // Crear mapa de conteo de validaciones
    const validationMap = new Map(
      validationCounts.map(v => [v.spotId, v._count.spotId])
    );

    // Calcular distancia para cada spot y agregar validaciones
    const spotsWithDistance: NearbySpot[] = spots.map((spot) => ({
      ...spot,
      distance: calculateDistance(lat, lng, spot.latitude, spot.longitude),
      validationCount: validationMap.get(spot.id) || 0
    }));

    // Filtrar por radio exacto
    const spotsWithinRadius = spotsWithDistance.filter(
      spot => spot.distance <= radius * 1000 // Convertir km a metros
    );

    return NextResponse.json({
      success: true,
      spots: spotsWithinRadius,
      count: spotsWithinRadius.length,
      center: { lat, lng },
      radius
    });

  } catch (error) {
    console.error('Error buscando spots cercanos:', error);
    return NextResponse.json({
      error: 'Server error',
      message: 'Error al buscar spots cercanos'
    }, { status: 500 });
  }
}

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
