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
    if (!body || typeof body !== 'object' || !('accept' in body) || typeof body.accept !== 'boolean') {
      return errorResponse('INVALID_RESPONSE', 'An accept decision is required', 400);
    }

    const game = await prisma.skateGame.findUnique({ where: { id: gameId } });
    if (!game || game.status !== SkateGameStatus.PENDING_ACCEPTANCE) {
      return errorResponse('GAME_NOT_OPEN', 'This game is no longer awaiting acceptance', 409);
    }
    if (email !== game.opponentId && email !== game.judgeId && (body.accept || email !== game.challengerId)) {
      return errorResponse('FORBIDDEN', 'You are not invited to this game', 403);
    }
    if (!body.accept) {
      const cancelled = await prisma.$transaction(async (transaction) => {
        const result = await transaction.skateGame.updateMany({
          where: { id: gameId, status: SkateGameStatus.PENDING_ACCEPTANCE },
          data: { status: SkateGameStatus.CANCELLED },
        });
        if (!result.count) return false;
        const recipients = email === game.challengerId
          ? [game.opponentId, game.judgeId]
          : [game.challengerId, email === game.opponentId ? game.judgeId : game.opponentId];
        await transaction.notification.createMany({
          data: recipients.map((userId) => ({
            userId,
            type: 'skate_game_cancelled',
            title: 'Game of Skate cancelled',
            message: 'A participant declined or cancelled the game invitation.',
            link: `/dashboard/skate-games/${gameId}`,
          })),
        });
        return true;
      });
      if (!cancelled) return errorResponse('GAME_NOT_OPEN', 'This game is no longer awaiting acceptance', 409);
      return successResponse({ status: SkateGameStatus.CANCELLED });
    }

    const acceptedAt = new Date();
    const updated = await prisma.$transaction(async (transaction) => {
      const accepted = await transaction.skateGame.updateMany({
        where: { id: gameId, status: SkateGameStatus.PENDING_ACCEPTANCE },
        data: {
          ...(email === game.opponentId ? { opponentAcceptedAt: acceptedAt } : {}),
          ...(email === game.judgeId ? { judgeAcceptedAt: acceptedAt } : {}),
        },
      });
      if (!accepted.count) return null;
      const acceptances = await transaction.skateGame.findUniqueOrThrow({
        where: { id: gameId },
        select: { opponentAcceptedAt: true, judgeAcceptedAt: true },
      });
      const status = acceptances.opponentAcceptedAt && acceptances.judgeAcceptedAt
        ? SkateGameStatus.READY
        : SkateGameStatus.PENDING_ACCEPTANCE;
      if (status === SkateGameStatus.READY) {
        await transaction.skateGame.update({
          where: { id: gameId },
          data: { status },
        });
      }
      const recipients = [game.challengerId, game.opponentId, game.judgeId].filter((id) => id !== email);
      await transaction.notification.createMany({
        data: recipients.map((userId) => ({
          userId,
          type: 'skate_game_response',
          title: 'Game of Skate invitation update',
          message: status === SkateGameStatus.READY
            ? 'All participants accepted. Check in at the selected spot to start.'
            : 'A participant accepted the Game of Skate invitation.',
          link: `/dashboard/skate-games/${gameId}`,
        })),
      });
      return { status };
    });

    if (!updated) return errorResponse('GAME_NOT_OPEN', 'This game is no longer awaiting acceptance', 409);
    return successResponse({ status: updated.status });
  } catch (error) {
    console.error('[API /skate-games/[gameId]/respond] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not save your response', 500);
  }
}
