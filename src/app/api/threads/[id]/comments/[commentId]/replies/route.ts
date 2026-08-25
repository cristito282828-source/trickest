import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/threads/:id/comments/:commentId/replies
 * Obtener respuestas (replies) de un comentario del thread.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const { id, commentId: commentIdStr } = await params;
    const threadId = parseInt(id, 10);
    const commentId = parseInt(commentIdStr, 10);
    if (isNaN(threadId) || isNaN(commentId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid IDs', 400);
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    const parentComment = await prisma.spotComment.findUnique({
      where: { id: commentId },
    });
    if (!parentComment) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }
    if (parentComment.threadId !== threadId) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Comment does not belong to this thread',
        400
      );
    }

    const replies = await prisma.spotComment.findMany({
      where: {
        threadId,
        parentCommentId: commentId,
        isHidden: false,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
      include: {
        user: { select: { name: true, photo: true, username: true } },
        ...(userEmail
          ? {
              votes: {
                where: { userId: userEmail },
                select: { voteType: true },
              },
            }
          : {}),
      },
    });

    const processed = replies.map((r) => ({
      ...r,
      userVote: r.votes?.[0]?.voteType || null,
      votes: undefined,
    }));

    const total = await prisma.spotComment.count({
      where: { threadId, parentCommentId: commentId, isHidden: false },
    });

    return successResponse({
      replies: processed,
      total,
      hasMore: offset + processed.length < total,
    });
  } catch (error) {
    console.error('[GET .../replies] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not fetch replies', 500);
  }
}
