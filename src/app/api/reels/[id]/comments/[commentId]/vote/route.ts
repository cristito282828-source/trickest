import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface VoteRequest {
  voteType: 'like' | 'dislike';
}

const VALID_VOTE_TYPES = ['like', 'dislike'] as const;

/**
 * POST /api/reels/:id/comments/:commentId/vote
 * Dar like o dislike a un comment.
 * Idempotente: si ya vota lo mismo, no hace nada.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }
    const { id, commentId } = await params;
    const submissionId = parseInt(id, 10);
    const cid = parseInt(commentId, 10);
    if (isNaN(submissionId) || isNaN(cid)) {
      return errorResponse('INVALID_ID', 'Invalid ID', 400);
    }

    const body: VoteRequest = await req.json();
    if (!body.voteType || !VALID_VOTE_TYPES.includes(body.voteType)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'voteType must be "like" or "dislike"',
        400
      );
    }

    const comment = await prisma.reelComment.findUnique({ where: { id: cid } });
    if (!comment) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }
    if (comment.submissionId !== submissionId) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Comment does not belong to this reel',
        400
      );
    }

    const userId = session.user.email;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.reelCommentVote.findUnique({
        where: { commentId_userId: { commentId: cid, userId } },
      });

      if (existing?.voteType === body.voteType) {
        // Idempotente
        const c = await tx.reelComment.findUnique({ where: { id: cid } });
        return { alreadyVoted: true, comment: c };
      }

      let likesDelta = 0;
      let dislikesDelta = 0;
      if (existing) {
        // Cambio de voto: restar el viejo, sumar el nuevo
        if (existing.voteType === 'like') likesDelta -= 1;
        else dislikesDelta -= 1;
        await tx.reelCommentVote.update({
          where: { id: existing.id },
          data: { voteType: body.voteType },
        });
      } else {
        await tx.reelCommentVote.create({
          data: { commentId: cid, userId, voteType: body.voteType },
        });
      }
      if (body.voteType === 'like') likesDelta += 1;
      else dislikesDelta += 1;

      const updated = await tx.reelComment.update({
        where: { id: cid },
        data: {
          likes: { increment: likesDelta },
          dislikes: { increment: dislikesDelta },
        },
      });
      return { alreadyVoted: false, comment: updated };
    });

    return successResponse(result);
  } catch (error: any) {
    console.error('[API /reels/[id]/comments/[commentId]/vote] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error voting on comment', 500);
  }
}

/**
 * DELETE /api/reels/:id/comments/:commentId/vote
 * Quita el voto del usuario.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }
    const { id, commentId } = await params;
    const submissionId = parseInt(id, 10);
    const cid = parseInt(commentId, 10);
    if (isNaN(submissionId) || isNaN(cid)) {
      return errorResponse('INVALID_ID', 'Invalid ID', 400);
    }
    const userId = session.user.email;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.reelCommentVote.findUnique({
        where: { commentId_userId: { commentId: cid, userId } },
      });
      if (!existing) return;
      let likesDelta = 0;
      let dislikesDelta = 0;
      if (existing.voteType === 'like') likesDelta -= 1;
      else dislikesDelta -= 1;
      await tx.reelCommentVote.delete({ where: { id: existing.id } });
      await tx.reelComment.update({
        where: { id: cid },
        data: {
          likes: { increment: likesDelta },
          dislikes: { increment: dislikesDelta },
        },
      });
    });

    return successResponse({ message: 'Vote removed' });
  } catch (error: any) {
    console.error('[API /reels/[id]/comments/[commentId]/vote] DELETE error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error removing vote', 500);
  }
}
