import { getServerSession } from 'next-auth';
import { SkateGameStatus } from '@prisma/client';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';
import {
  calculateDistanceMeters,
  hasFreshSkateGameLocation,
  isQualifiedSkateJudge,
  parsePositiveInteger,
  skateGameRadiusMeters,
} from '@/lib/skate-games';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    if (!await isQualifiedSkateJudge(email)) {
      return errorResponse('FORBIDDEN', 'Only active judges can claim a game', 403);
    }

    const { gameId: rawGameId } = await params;
    const gameId = parsePositiveInteger(rawGameId);
    if (!gameId) return errorResponse('INVALID_ID', 'Invalid game ID', 400);

    const game = await prisma.skateGame.findUnique({
      where: { id: gameId },
      select: { challengerId: true, opponentId: true, judgeId: true, status: true },
    });
    if (!game) return errorResponse('NOT_FOUND', 'Skate game not found', 404);
    if (game.status !== SkateGameStatus.AWAITING_JUDGE || game.judgeId !== null) {
      return errorResponse('GAME_NO_LONGER_AVAILABLE', 'This game is no longer waiting for a judge', 409);
    }
    if (email === game.challengerId || email === game.opponentId) {
      return errorResponse('PLAYERS_CANNOT_JUDGE', 'Players cannot judge their own game', 403);
    }

    const participants = await prisma.user.findMany({
      where: { email: { in: [game.challengerId, game.opponentId, email] } },
      select: {
        email: true,
        latitude: true,
        longitude: true,
        showOnMap: true,
        locationUpdatedAt: true,
      },
    });
    const locations = new Map(participants.map((participant) => [participant.email, participant]));
    const challenger = locations.get(game.challengerId);
    const opponent = locations.get(game.opponentId);
    const judge = locations.get(email);
    if ([challenger, opponent, judge].some((participant) =>
      !participant?.showOnMap ||
      participant.latitude === null ||
      participant.longitude === null ||
      !hasFreshSkateGameLocation(participant.locationUpdatedAt)
    )) {
      return errorResponse(
        'LOCATION_REQUIRED',
        'All participants must have location sharing enabled and refresh their location before the judge claims this game',
        409
      );
    }

    const coordinates = [challenger!, opponent!, judge!];
    for (let first = 0; first < coordinates.length; first += 1) {
      for (let second = first + 1; second < coordinates.length; second += 1) {
        const distance = calculateDistanceMeters(
          coordinates[first].latitude!,
          coordinates[first].longitude!,
          coordinates[second].latitude!,
          coordinates[second].longitude!
        );
        if (distance > skateGameRadiusMeters) {
          return errorResponse(
            'PARTICIPANTS_NOT_NEARBY',
            'All three participants must be within 100 meters of each other',
            409
          );
        }
      }
    }

    const claimed = await prisma.$transaction(async (transaction) => {
      const result = await transaction.skateGame.updateMany({
        where: {
          id: gameId,
          status: SkateGameStatus.AWAITING_JUDGE,
          judgeId: null,
        },
        data: {
          judgeId: email,
          judgeAcceptedAt: new Date(),
          status: SkateGameStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });
      if (!result.count) return false;

      await transaction.notification.createMany({
        data: [game.challengerId, game.opponentId].map((userId) => ({
          userId,
          type: 'skate_game_judge_assigned',
          title: 'Game of Skate judge assigned',
          message: 'A judge has taken your game. Your match is ready to play.',
          link: `/dashboard/skate-games/${gameId}`,
        })),
      });
      return true;
    });
    if (!claimed) {
      return errorResponse('GAME_NO_LONGER_AVAILABLE', 'Another judge has already claimed this game', 409);
    }

    return successResponse({ status: SkateGameStatus.IN_PROGRESS });
  } catch (error) {
    console.error('[API /skate-games/[gameId]/claim] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not claim the skate game', 500);
  }
}
