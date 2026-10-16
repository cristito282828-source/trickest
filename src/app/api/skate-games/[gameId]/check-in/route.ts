import { getServerSession } from 'next-auth';
import { SkateGameStatus } from '@prisma/client';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';
import {
  calculateDistanceMeters,
  findAccessibleSkateGame,
  parsePositiveInteger,
  skateGameCheckInFreshnessMs,
  skateGameMaxGpsAccuracyMeters,
  skateGameRadiusMeters,
} from '@/lib/skate-games';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);

    const { gameId: rawGameId } = await params;
    const gameId = parsePositiveInteger(rawGameId);
    if (!gameId) return errorResponse('INVALID_ID', 'Invalid game ID', 400);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }
    if (!isLocation(body)) {
      return errorResponse('INVALID_LOCATION', 'Valid location and accuracy are required', 400);
    }

    const game = await findAccessibleSkateGame(gameId, email);
    if (!game || game.judgeId !== email && game.opponentId !== email && game.challengerId !== email) {
      return errorResponse('NOT_FOUND', 'Skate game not found', 404);
    }
    if (game.status !== SkateGameStatus.READY && game.status !== SkateGameStatus.IN_PROGRESS) {
      return errorResponse('GAME_NOT_READY', 'All participants must accept before checking in', 409);
    }
    if (body.accuracy > skateGameMaxGpsAccuracyMeters) {
      return errorResponse('GPS_ACCURACY_LOW', 'Your GPS signal is not accurate enough. Try again outdoors.', 400);
    }

    const challengerLocation = await prisma.user.findUnique({
      where: { email: game.challengerId },
      select: { latitude: true, longitude: true, showOnMap: true },
    });
    if (!challengerLocation?.showOnMap ||
        challengerLocation.latitude === null ||
        challengerLocation.longitude === null) {
      return errorResponse('CHALLENGER_LOCATION_UNAVAILABLE', 'The challenger must keep location sharing enabled for this game', 409);
    }

    const distance = calculateDistanceMeters(
      body.latitude,
      body.longitude,
      challengerLocation.latitude,
      challengerLocation.longitude
    );
    if (distance > skateGameRadiusMeters) {
      return errorResponse('TOO_FAR_FROM_CHALLENGER', 'You must be within 100 meters of the challenger location', 400);
    }

    await prisma.skateGameCheckIn.upsert({
      where: { gameId_userId: { gameId, userId: email } },
      create: { gameId, userId: email, accuracyMeters: body.accuracy },
      update: { accuracyMeters: body.accuracy, checkedInAt: new Date() },
    });

    const checkIns = await prisma.skateGameCheckIn.findMany({
      where: { gameId },
      select: { userId: true, checkedInAt: true },
    });
    const freshCheckIns = checkIns.filter(
      (checkIn) => Date.now() - checkIn.checkedInAt.getTime() <= skateGameCheckInFreshnessMs
    );
    const checkedInEmails = new Set(freshCheckIns.map((checkIn) => checkIn.userId));
    const allParticipantsPresent = [game.challengerId, game.opponentId, game.judgeId]
      .every((participantId) => checkedInEmails.has(participantId));

    if (allParticipantsPresent) {
      await prisma.skateGame.updateMany({
        where: { id: gameId, status: SkateGameStatus.READY },
        data: { status: SkateGameStatus.IN_PROGRESS, startedAt: new Date() },
      });
    }

    return successResponse({
      checkedIn: true,
      allParticipantsPresent,
      radiusMeters: skateGameRadiusMeters,
    });
  } catch (error) {
    console.error('[API /skate-games/[gameId]/check-in] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not check in at the spot', 500);
  }
}

function isLocation(value: unknown): value is { latitude: number; longitude: number; accuracy: number } {
  if (!value || typeof value !== 'object' || !('latitude' in value) ||
      !('longitude' in value) || !('accuracy' in value)) return false;
  return typeof value.latitude === 'number' && Number.isFinite(value.latitude) &&
    value.latitude >= -90 && value.latitude <= 90 &&
    typeof value.longitude === 'number' && Number.isFinite(value.longitude) &&
    value.longitude >= -180 && value.longitude <= 180 &&
    typeof value.accuracy === 'number' && Number.isFinite(value.accuracy) &&
    value.accuracy > 0;
}
