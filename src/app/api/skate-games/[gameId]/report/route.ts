import { getServerSession } from 'next-auth';
import { SkateGameStatus } from '@prisma/client';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';
import { parsePositiveInteger } from '@/lib/skate-games';

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
    if (!body || typeof body !== 'object' || !('winner' in body) ||
        (body.winner !== 'challenger' && body.winner !== 'opponent') ||
        !('report' in body) || typeof body.report !== 'string') {
      return errorResponse('INVALID_REPORT', 'Winner and judge report are required', 400);
    }

    const report = body.report.trim();
    if (report.length < 10 || report.length > 3000) {
      return errorResponse('INVALID_REPORT', 'The report must be between 10 and 3000 characters', 400);
    }

    const game = await prisma.skateGame.findUnique({ where: { id: gameId } });
    if (!game) return errorResponse('NOT_FOUND', 'Skate game not found', 404);
    if (game.judgeId !== email) return errorResponse('JUDGE_ONLY', 'Only the assigned judge can submit the report', 403);
    if (game.status !== SkateGameStatus.IN_PROGRESS && game.status !== SkateGameStatus.AWAITING_REPORT) {
      return errorResponse('GAME_NOT_REPORTABLE', 'This game cannot be reported in its current state', 409);
    }
    const winnerId = body.winner === 'challenger' ? game.challengerId : game.opponentId;
    const turnCount = await prisma.skateGameTurn.count({ where: { gameId } });
    if (!turnCount) return errorResponse('NO_TURNS', 'Record at least one trick before reporting the result', 409);

    const loserId = winnerId === game.challengerId ? game.opponentId : game.challengerId;
    const updated = await prisma.$transaction(async (transaction) => {
      const result = await transaction.skateGame.updateMany({
        where: {
          id: gameId,
          status: { in: [SkateGameStatus.IN_PROGRESS, SkateGameStatus.AWAITING_REPORT] },
        },
        data: {
          winnerId,
          loserId,
          judgeReport: report,
          status: SkateGameStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
      if (result.count) {
        await transaction.notification.createMany({
          data: [game.challengerId, game.opponentId].map((userId) => ({
            userId,
            type: 'skate_game_reported',
            title: 'Game of Skate result',
            message: 'The judge has published the official game result.',
            link: `/dashboard/skate-games/${gameId}`,
          })),
        });
      }
      return result;
    });
    if (!updated.count) {
      return errorResponse('GAME_ALREADY_REPORTED', 'This game has already been reported', 409);
    }

    return successResponse({ status: SkateGameStatus.COMPLETED, winner: body.winner, loserId });
  } catch (error) {
    console.error('[API /skate-games/[gameId]/report] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not save the judge report', 500);
  }
}
