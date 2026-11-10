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
    if (!game || (
      game.status !== SkateGameStatus.PENDING_ACCEPTANCE &&
      game.status !== SkateGameStatus.AWAITING_JUDGE
    )) {
      return errorResponse('GAME_NOT_OPEN', 'This game is no longer awaiting acceptance', 409);
    }
    const isChallenger = email === game.challengerId;
    const isOpponent = email === game.opponentId;
    const isAssignedJudge = email === game.judgeId;
    if (!isChallenger && !isOpponent && !isAssignedJudge) {
      return errorResponse('FORBIDDEN', 'You are not invited to this game', 403);
    }
    if (body.accept && game.status !== SkateGameStatus.PENDING_ACCEPTANCE) {
      return errorResponse('GAME_NO_LONGER_ACCEPTING', 'This game is no longer accepting responses', 409);
    }
    if (body.accept && !isOpponent && !isAssignedJudge) {
      return errorResponse('FORBIDDEN', 'Only invited participants can accept this game', 403);
    }
    if (!body.accept) {
      const cancelled = await prisma.$transaction(async (transaction) => {
        const result = await transaction.skateGame.updateMany({
          where: {
            id: gameId,
            status: { in: [SkateGameStatus.PENDING_ACCEPTANCE, SkateGameStatus.AWAITING_JUDGE] },
          },
          data: { status: SkateGameStatus.CANCELLED },
        });
        if (!result.count) return false;
        const recipients = [game.challengerId, game.opponentId, game.judgeId]
          .filter((userId): userId is string => Boolean(userId && userId !== email));
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
        select: { opponentAcceptedAt: true, judgeAcceptedAt: true, judgeId: true },
      });
      const status = acceptances.opponentAcceptedAt
        ? acceptances.judgeId
          ? acceptances.judgeAcceptedAt ? SkateGameStatus.READY : SkateGameStatus.PENDING_ACCEPTANCE
          : SkateGameStatus.AWAITING_JUDGE
        : SkateGameStatus.PENDING_ACCEPTANCE;
      if (status === SkateGameStatus.READY) {
        await transaction.skateGame.update({
          where: { id: gameId },
          data: { status },
        });
      }
      const recipients = [game.challengerId, game.opponentId, game.judgeId]
        .filter((id): id is string => Boolean(id && id !== email));
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
      if (status === SkateGameStatus.AWAITING_JUDGE) {
        const judges = await transaction.user.findMany({
          where: {
            role: { in: ['judge', 'admin'] },
            isActive: true,
            profileStatus: 'complete',
          },
          select: { email: true },
        });
        await transaction.notification.createMany({
          data: judges
            .filter(({ email: judgeEmail }) => judgeEmail !== game.challengerId && judgeEmail !== game.opponentId)
            .map(({ email: judgeEmail }) => ({
              userId: judgeEmail,
              type: 'skate_game_judge_queue',
              title: 'Game of Skate needs a judge',
              message: 'A new nearby game is waiting for a judge to claim it.',
              link: `/dashboard/skate-games/${gameId}`,
            })),
        });
      }
      return { status };
    });

    if (!updated) return errorResponse('GAME_NOT_OPEN', 'This game is no longer awaiting acceptance', 409);
    return successResponse({ status: updated.status });
  } catch (error) {
    console.error('[API /skate-games/[gameId]/respond] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not save your response', 500);
  }
}
