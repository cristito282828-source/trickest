import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';
import { findAccessibleSkateGame, parsePositiveInteger, serializeSkateGame } from '@/lib/skate-games';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);

    const { gameId: rawGameId } = await params;
    const gameId = parsePositiveInteger(rawGameId);
    if (!gameId) return errorResponse('INVALID_ID', 'Invalid game ID', 400);

    const game = await findAccessibleSkateGame(gameId, email);
    if (!game) return errorResponse('NOT_FOUND', 'Skate game not found', 404);
    const ratingSummary = await prisma.skateGameRating.aggregate({
      where: { judgeId: game.judgeId },
      _avg: { score: true },
      _count: { _all: true },
    });

    return successResponse({
      game: serializeSkateGame(game, email),
      judgeRating: { average: ratingSummary._avg.score, count: ratingSummary._count._all },
    });
  } catch (error) {
    console.error('[API /skate-games/[gameId]] GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not load skate game', 500);
  }
}
