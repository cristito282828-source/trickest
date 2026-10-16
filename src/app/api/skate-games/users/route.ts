import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';
import { calculateDistanceMeters, skateGameRadiusMeters } from '@/lib/skate-games';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);

    const challenger = await prisma.user.findUnique({
      where: { email },
      select: { latitude: true, longitude: true, showOnMap: true },
    });
    if (!challenger?.showOnMap || challenger.latitude === null || challenger.longitude === null) {
      return errorResponse('LOCATION_REQUIRED', 'Enable location sharing and refresh your location before searching', 400);
    }

    const query = request.nextUrl.searchParams.get('q')?.trim() || '';
    if (query.length < 2) return successResponse({ users: [] });

    const latitudeDelta = skateGameRadiusMeters / 111_320;
    const longitudeDelta = latitudeDelta / Math.max(Math.cos(challenger.latitude * Math.PI / 180), 0.01);
    const users = await prisma.user.findMany({
      where: {
        email: { not: email },
        isActive: true,
        profileStatus: 'complete',
        showOnMap: true,
        latitude: { gte: challenger.latitude - latitudeDelta, lte: challenger.latitude + latitudeDelta },
        longitude: { gte: challenger.longitude - longitudeDelta, lte: challenger.longitude + longitudeDelta },
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { username: true, name: true, photo: true, role: true, latitude: true, longitude: true },
      orderBy: { username: 'asc' },
      take: 250,
    });
    const nearbyUsers = users.flatMap((user) => {
      if (!user.username || user.latitude === null || user.longitude === null) return [];
      const distance = calculateDistanceMeters(challenger.latitude!, challenger.longitude!, user.latitude, user.longitude);
      if (distance > skateGameRadiusMeters) return [];
      return [{
        username: user.username,
        name: user.name,
        photo: user.photo,
        role: user.role,
        distanceMeters: Math.round(distance / 10) * 10,
      }];
    }).slice(0, 10);
    return successResponse({ users: nearbyUsers, radiusMeters: skateGameRadiusMeters });
  } catch (error) {
    console.error('[API /skate-games/users] GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not search users', 500);
  }
}
