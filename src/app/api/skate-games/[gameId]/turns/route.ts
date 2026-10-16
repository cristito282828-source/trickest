import { getServerSession } from 'next-auth';
import { SkateGameStatus } from '@prisma/client';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';
import { findAccessibleSkateGame, nextSkateLetter, parsePositiveInteger } from '@/lib/skate-games';

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
    if (!isTurnRequest(body)) {
      return errorResponse('INVALID_TURN', 'A player, trick, and landed result are required', 400);
    }
    const trickName = body.trickName.trim();
    const judgeNote = body.judgeNote?.trim() || null;
    if (!trickName || trickName.length > 80) {
      return errorResponse('INVALID_TRICK', 'Trick name must be between 1 and 80 characters', 400);
    }
    if (judgeNote && judgeNote.length > 500) {
      return errorResponse('NOTE_TOO_LONG', 'Judge notes must be 500 characters or fewer', 400);
    }

    const game = await findAccessibleSkateGame(gameId, email);
    if (!game) return errorResponse('NOT_FOUND', 'Skate game not found', 404);
    if (game.judgeId !== email) return errorResponse('JUDGE_ONLY', 'Only the assigned judge can record turns', 403);
    if (game.status !== SkateGameStatus.IN_PROGRESS) {
      return errorResponse('GAME_NOT_IN_PROGRESS', 'This game is not accepting turns', 409);
    }

    const playerIds = [game.challengerId, game.opponentId];
    const attemptedBy = body.attemptedBy === 'challenger' ? game.challengerId
      : body.attemptedBy === 'opponent' ? game.opponentId : null;
    const letterAwardedTo = body.letterAwardedTo === 'challenger' ? game.challengerId
      : body.letterAwardedTo === 'opponent' ? game.opponentId : body.letterAwardedTo ?? null;
    if (!attemptedBy) {
      return errorResponse('INVALID_PLAYER', 'The attempted trick must belong to one of the players', 400);
    }
    if (letterAwardedTo !== null) {
      if (body.landed || !playerIds.includes(letterAwardedTo)) {
        return errorResponse('INVALID_LETTER', 'A letter can only be awarded to a player after a missed trick', 400);
      }
      const letters = letterAwardedTo === game.challengerId
        ? game.challengerLetters
        : game.opponentLetters;
      if (!nextSkateLetter(letters)) {
        return errorResponse('PLAYER_HAS_SKATE', 'This player already has all five letters', 409);
      }
    }

    const result = await prisma.$transaction(async (transaction) => {
      const turnClaim = await transaction.skateGame.updateMany({
        where: {
          id: gameId,
          status: SkateGameStatus.IN_PROGRESS,
          updatedAt: game.updatedAt,
        },
        data: { updatedAt: new Date() },
      });
      if (!turnClaim.count) throw new Error('TURN_ALREADY_RECORDED');

      const turnNumber = await transaction.skateGameTurn.count({ where: { gameId } }) + 1;
      const turn = await transaction.skateGameTurn.create({
        data: {
          gameId,
          turnNumber,
          attemptedBy,
          trickName,
          landed: body.landed,
          letterAwardedTo,
          judgeNote,
        },
      });

      let challengerLetters = game.challengerLetters;
      let opponentLetters = game.opponentLetters;
      if (letterAwardedTo === game.challengerId) {
        challengerLetters += nextSkateLetter(challengerLetters);
      } else if (letterAwardedTo === game.opponentId) {
        opponentLetters += nextSkateLetter(opponentLetters);
      }

      const status = challengerLetters.length === 5 || opponentLetters.length === 5
        ? SkateGameStatus.AWAITING_REPORT
        : SkateGameStatus.IN_PROGRESS;
      await transaction.skateGame.update({
        where: { id: gameId },
        data: { challengerLetters, opponentLetters, status },
      });
      return { turn, challengerLetters, opponentLetters, status };
    });

    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'TURN_ALREADY_RECORDED') {
      return errorResponse('TURN_CONFLICT', 'The game changed while saving. Refresh before recording another turn.', 409);
    }
    console.error('[API /skate-games/[gameId]/turns] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not record the game turn', 500);
  }
}

function isTurnRequest(value: unknown): value is {
  attemptedBy: 'challenger' | 'opponent';
  trickName: string;
  landed: boolean;
  letterAwardedTo?: 'challenger' | 'opponent' | null;
  judgeNote?: string;
} {
  return Boolean(
    value && typeof value === 'object' &&
    'attemptedBy' in value && (value.attemptedBy === 'challenger' || value.attemptedBy === 'opponent') &&
    'trickName' in value && typeof value.trickName === 'string' &&
    'landed' in value && typeof value.landed === 'boolean' &&
    (!('letterAwardedTo' in value) ||
      value.letterAwardedTo === null ||
      value.letterAwardedTo === 'challenger' || value.letterAwardedTo === 'opponent') &&
    (!('judgeNote' in value) || typeof value.judgeNote === 'string')
  );
}
