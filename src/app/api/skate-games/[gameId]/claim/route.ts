import { getServerSession } from 'next-auth';
import { SkateGameStatus } from '@prisma/client';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';
import { isQualifiedSkateJudge, parsePositiveInteger } from '@/lib/skate-games';

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
      select: { challengerId: true, opponentId: true },
    });
    if (!game) return errorResponse('NOT_FOUND', 'Skate game not found', 404);
    if (email === game.challengerId || email === game.opponentId) {
      return errorResponse('PLAYERS_CANNOT_JUDGE', 'Players cannot judge their own game', 403);
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
          status: SkateGameStatus.READY,
        },
      });
      if (!result.count) return false;

      await transaction.notification.createMany({
        data: [game.challengerId, game.opponentId].map((userId) => ({
          userId,
          type: 'skate_game_judge_assigned',
          title: 'Game of Skate judge assigned',
          message: 'A judge has taken your game. Check in at the selected spot to start.',
          link: `/dashboard/skate-games/${gameId}`,
        })),
      });
      return true;
    });
    if (!claimed) {
      return errorResponse('GAME_NO_LONGER_AVAILABLE', 'Another judge has already claimed this game', 409);
    }

    return successResponse({ status: SkateGameStatus.READY });
  } catch (error) {
    console.error('[API /skate-games/[gameId]/claim] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not claim the skate game', 500);
  }
}
