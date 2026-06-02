import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Obtener todos los spots o filtrar por tipo/ciudad
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // "skatepark", "skateshop", "spot"
    const city = searchParams.get('city');
    const stage = searchParams.get('stage'); // Filter by stage: GHOST, REVIEW, VERIFIED, LEGENDARY
    const verified = searchParams.get('verified'); // "true" para solo verificados (VERIFIED or LEGENDARY)

    const where: Prisma.SpotWhereInput = {};

    if (type) {
      // Convert "skateshop" to "SKATESHOP" if needed
      const typeUpper = type.toUpperCase();
      where.type = typeUpper;
    }
    if (city) where.city = { contains: city, mode: 'insensitive' };

    // Filter by verified status (VERIFIED or LEGENDARY stages)
    if (verified === 'true') {
      where.stage = { in: ['VERIFIED', 'LEGENDARY'] };
    }

    // Filter by specific stage
    if (stage) {
      where.stage = stage.toUpperCase();
    }

    const spots = await prisma.spot.findMany({
      where,
      orderBy: [
        { confidenceScore: 'desc' }, // Primero por puntuación de confianza
        { lastActivityAt: 'desc' }, // Luego por actividad reciente
        { createdAt: 'desc' } // Luego los más recientes
      ],
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        instagram: true,
        phone: true,
        website: true,
        stage: true,
        confidenceScore: true,
        rating: true,
        photos: true,
        features: true,
        isHot: true,
        _count: {
          select: {
            validations: true,
          }
        }
      },
    });

    // Transform spots to match the interface expected by UnifiedMap
    const transformedSpots = spots.map(spot => ({
      ...spot,
      type: spot.type.toLowerCase() as 'skatepark' | 'skateshop', // Convert to lowercase
      isVerified: spot.stage === 'VERIFIED' || spot.stage === 'LEGENDARY', // Map stage to isVerified
      validationCount: spot._count.validations, // Add validation count
    }));

    return NextResponse.json({ spots: transformedSpots });
  } catch (error) {
    console.error('Error obteniendo spots:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Crear un nuevo spot (requiere autenticación)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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

    // Validaciones básicas
    if (!name || !type || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Name, type, latitude and longitude are required' },
        { status: 400 }
      );
    }

    if (type !== 'skatepark' && type !== 'skateshop') {
      return NextResponse.json(
        { error: 'Type must be "skatepark" or "skateshop"' },
        { status: 400 }
      );
    }

    // Validar rango de coordenadas
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    const spot = await prisma.spot.create({
      data: {
        name,
        type,
        description: description || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || 'Colombia',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone: phone || null,
        website: website || null,
        instagram: instagram || null,
        photos: photos || [],
        features: features || [],
        createdBy: session.user.email,
      },
    });

    return NextResponse.json({ success: true, spot });
  } catch (error) {
    console.error('Error creando spot:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
