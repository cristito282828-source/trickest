import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface VoteRequest {
  voteType: 'like' | 'dislike';
}

/**
 * POST /api/threads/:id/comments/:commentId/vote
 * Votar like/dislike en un comentario del thread.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'You must log in to vote', 401);
    }
    const userEmail = session.user.email;
    const { id, commentId: commentIdStr } = await params;
    const threadId = parseInt(id, 10);
    const commentId = parseInt(commentIdStr, 10);
    if (isNaN(threadId) || isNaN(commentId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid IDs', 400);
    }

    const body: VoteRequest = await req.json();
    const { voteType } = body;
    if (voteType !== 'like' && voteType !== 'dislike') {
      return errorResponse('VALIDATION_ERROR', 'voteType must be like or dislike', 400);
    }

    const comment = await prisma.spotComment.findUnique({
      where: { id: commentId },
      include: { votes: { where: { userId: userEmail } } },
    });
    if (!comment) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }
    if (comment.threadId !== threadId) {
      return errorResponse('VALIDATION_ERROR', 'Comment does not belong to this thread', 400);
    }

    const existing = comment.votes[0];
    if (existing && existing.voteType === voteType) {
      return successResponse({
        message: 'Already voted',
        comment: { likes: comment.likes, dislikes: comment.dislikes },
      });
    }

    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.commentVote.delete({ where: { id: existing.id } });
        await tx.spotComment.update({
          where: { id: commentId },
          data: existing.voteType === 'like' ? { likes: { decrement: 1 } } : { dislikes: { decrement: 1 } },
        });
      }
      await tx.commentVote.create({
        data: { commentId, userId: userEmail, voteType },
      });
      await tx.spotComment.update({
        where: { id: commentId },
        data: voteType === 'like' ? { likes: { increment: 1 } } : { dislikes: { increment: 1 } },
      });
    });

    const updated = await prisma.spotComment.findUnique({
      where: { id: commentId },
      select: { likes: true, dislikes: true },
    });

    return successResponse({
      message: 'Vote registered',
      comment: updated,
    });
  } catch (error: any) {
    console.error('[POST /api/threads/:id/comments/:commentId/vote] Error:', error);
    if (error?.code === 'P2021') {
      return errorResponse('TABLE_NOT_FOUND', 'Run: npx prisma migrate dev', 500);
    }
    return errorResponse('INTERNAL_ERROR', 'Could not vote', 500);
  }
}

/**
 * DELETE /api/threads/:id/comments/:commentId/vote
 * Quitar voto del usuario en un comentario.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'You must log in', 401);
    }
    const userEmail = session.user.email;
    const { id, commentId: commentIdStr } = await params;
    const threadId = parseInt(id, 10);
    const commentId = parseInt(commentIdStr, 10);
    if (isNaN(threadId) || isNaN(commentId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid IDs', 400);
    }

    const comment = await prisma.spotComment.findUnique({
      where: { id: commentId },
      include: { votes: { where: { userId: userEmail } } },
    });
    if (!comment) return errorResponse('NOT_FOUND', 'Comment not found', 404);
    if (comment.threadId !== threadId) {
      return errorResponse('VALIDATION_ERROR', 'Comment does not belong to this thread', 400);
    }

    const existing = comment.votes[0];
    if (!existing) {
      return successResponse({
        message: 'No vote to remove',
        comment: { likes: comment.likes, dislikes: comment.dislikes },
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.commentVote.delete({ where: { id: existing.id } });
      await tx.spotComment.update({
        where: { id: commentId },
        data: existing.voteType === 'like' ? { likes: { decrement: 1 } } : { dislikes: { decrement: 1 } },
      });
    });

    const updated = await prisma.spotComment.findUnique({
      where: { id: commentId },
      select: { likes: true, dislikes: true },
    });

    return successResponse({
      message: 'Vote removed',
      comment: updated,
    });
  } catch (error) {
    console.error('[DELETE ...] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not remove vote', 500);
  }
}
