import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SkateGameStatus } from '@prisma/client';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';
import {
  calculateDistanceMeters,
  isQualifiedSkateJudge,
  skateGameRadiusMeters,
} from '@/lib/skate-games';

export const dynamic = 'force-dynamic';

const gameRelations = {
  challenger: { select: { email: true, username: true, name: true, photo: true } },
  opponent: { select: { email: true, username: true, name: true, photo: true } },
  judge: { select: { email: true, username: true, name: true, photo: true } },
  winner: { select: { email: true, username: true, name: true, photo: true } },
  spot: { select: { id: true, name: true, city: true } },
  _count: { select: { turns: true, ratings: true } },
} as const;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);

    const canJudge = await isQualifiedSkateJudge(email);
    const [games, judgeQueue] = await Promise.all([
      prisma.skateGame.findMany({
        where: {
          OR: [{ challengerId: email }, { opponentId: email }, { judgeId: email }],
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        include: gameRelations,
      }),
      canJudge
        ? prisma.skateGame.findMany({
          where: {
            status: SkateGameStatus.AWAITING_JUDGE,
            judgeId: null,
            challengerId: { not: email },
            opponentId: { not: email },
          },
          orderBy: { updatedAt: 'asc' },
          take: 100,
          include: gameRelations,
        })
        : Promise.resolve([]),
    ]);
    const serializeGame = (game: (typeof games)[number]) => ({
      id: game.id,
      status: game.status,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      challengerAcceptedAt: game.challengerAcceptedAt,
      opponentAcceptedAt: game.opponentAcceptedAt,
      judgeAcceptedAt: game.judgeAcceptedAt,
      challengerLetters: game.challengerLetters,
      opponentLetters: game.opponentLetters,
      challenger: { username: game.challenger.username, name: game.challenger.name, photo: game.challenger.photo },
      opponent: { username: game.opponent.username, name: game.opponent.name, photo: game.opponent.photo },
      judge: game.judge
        ? { username: game.judge.username, name: game.judge.name, photo: game.judge.photo }
        : null,
      winner: game.winner ? { username: game.winner.username, name: game.winner.name } : null,
      spot: game.spot,
      turnCount: game._count.turns,
      ratingCount: game._count.ratings,
      viewerRole: game.challengerId === email ? 'challenger'
        : game.opponentId === email ? 'opponent' : 'judge',
    });
    return successResponse({
      games: games.map(serializeGame),
      judgeQueue: judgeQueue.map(serializeGame),
      canJudge,
    });
  } catch (error) {
    console.error('[API /skate-games] GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not load skate games', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }
    if (!isCreateGameRequest(body)) {
      return errorResponse('INVALID_GAME', 'An opponent is required', 400);
    }

    const [challenger, opponent, openChallenges] = await Promise.all([
      prisma.user.findUnique({
        where: { email },
        select: { email: true, name: true, isActive: true, profileStatus: true, showOnMap: true, latitude: true, longitude: true },
      }),
      prisma.user.findUnique({
        where: { username: body.opponentUsername.trim() },
        select: { email: true, name: true, isActive: true, profileStatus: true, showOnMap: true, latitude: true, longitude: true },
      }),
      prisma.skateGame.count({
        where: {
          challengerId: email,
          status: {
            in: [
              SkateGameStatus.PENDING_ACCEPTANCE,
              SkateGameStatus.AWAITING_JUDGE,
              SkateGameStatus.READY,
              SkateGameStatus.IN_PROGRESS,
              SkateGameStatus.AWAITING_REPORT,
            ],
          },
        },
      }),
    ]);

    if (!challenger?.isActive || challenger.profileStatus !== 'complete') {
      return errorResponse('PROFILE_INCOMPLETE', 'Complete your profile before creating a game', 403);
    }
    if (!challenger.showOnMap || challenger.latitude === null || challenger.longitude === null) {
      return errorResponse('LOCATION_REQUIRED', 'Enable location sharing and refresh your location before creating a game', 400);
    }
    if (!opponent?.isActive || opponent.profileStatus !== 'complete') {
      return errorResponse('OPPONENT_NOT_FOUND', 'Choose an active skater with a complete profile', 400);
    }
    const isAvailableNearChallenger = (user: NonNullable<typeof opponent>) =>
      user.showOnMap &&
      user.latitude !== null &&
      user.longitude !== null &&
      calculateDistanceMeters(challenger.latitude!, challenger.longitude!, user.latitude, user.longitude) <= skateGameRadiusMeters;
    if (!isAvailableNearChallenger(opponent)) {
      return errorResponse('OPPONENT_NOT_AVAILABLE', 'The selected skater is not sharing a location within 100 meters of yours', 400);
    }
    if (opponent.email === email) {
      return errorResponse('PARTICIPANTS_MUST_DIFFER', 'The players must be different users', 400);
    }
    if (openChallenges >= 3) {
      return errorResponse('TOO_MANY_GAMES', 'Finish or cancel an open game before creating another', 429);
    }

    const game = await prisma.$transaction(async (transaction) => {
      const createdGame = await transaction.skateGame.create({
        data: {
          challengerId: email,
          opponentId: opponent.email,
        },
        select: { id: true, status: true },
      });
      await transaction.notification.createMany({
        data: {
          userId: opponent.email,
          type: 'skate_game_invitation',
          title: 'Game of Skate invitation',
          message: `${challenger.name || 'A skater'} challenged you to a game nearby.`,
          link: `/dashboard/skate-games/${createdGame.id}`,
        },
      });
      return createdGame;
    });
    return successResponse({ game }, 201);
  } catch (error) {
    console.error('[API /skate-games] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not create skate game', 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

function isCreateGameRequest(value: unknown): value is {
  opponentUsername: string;
} {
  return Boolean(
    value && typeof value === 'object' &&
    'opponentUsername' in value && typeof value.opponentUsername === 'string'
  );
}
