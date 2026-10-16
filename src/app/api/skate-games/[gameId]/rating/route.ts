import { getServerSession } from 'next-auth';
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
    if (!body || typeof body !== 'object' || !('score' in body) ||
        typeof body.score !== 'number' || !Number.isInteger(body.score) ||
        body.score < 1 || body.score > 5 ||
        ('comment' in body && body.comment !== null && typeof body.comment !== 'string')) {
      return errorResponse('INVALID_RATING', 'A score from 1 to 5 and an optional comment are required', 400);
    }

    const comment = 'comment' in body && typeof body.comment === 'string' ? body.comment.trim() : '';
    if (comment.length > 500) {
      return errorResponse('COMMENT_TOO_LONG', 'Rating comments must be 500 characters or fewer', 400);
    }
    const game = await prisma.skateGame.findUnique({ where: { id: gameId } });
    if (!game || game.status !== 'COMPLETED') {
      return errorResponse('GAME_NOT_COMPLETED', 'Only completed games can be rated', 409);
    }
    if (email !== game.challengerId && email !== game.opponentId) {
      return errorResponse('PLAYERS_ONLY', 'Only players can rate the judge', 403);
    }

    const existingRating = await prisma.skateGameRating.findUnique({
      where: { gameId_raterId: { gameId, raterId: email } },
      select: { id: true },
    });
    if (existingRating) {
      return errorResponse('ALREADY_RATED', 'You have already rated the judge for this game', 409);
    }

    const rating = await prisma.skateGameRating.create({
      data: {
        gameId,
        raterId: email,
        judgeId: game.judgeId,
        score: body.score,
        comment: comment || null,
      },
      select: { id: true, score: true, comment: true, createdAt: true },
    });
    return successResponse({ rating }, 201);
  } catch (error) {
    console.error('[API /skate-games/[gameId]/rating] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not save the judge rating', 500);
  }
}
