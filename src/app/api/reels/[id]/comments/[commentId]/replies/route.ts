import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reels/:id/comments/:commentId/replies
 * Lista las replies de un comment principal.
 * Devuelve ordenados por createdAt ASC.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email ?? null;
    const { id, commentId } = await params;
    const submissionId = parseInt(id, 10);
    const cid = parseInt(commentId, 10);
    if (isNaN(submissionId) || isNaN(cid)) {
      return errorResponse('INVALID_ID', 'Invalid ID', 400);
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    if (limit > 50) {
      return errorResponse('VALIDATION_ERROR', 'Maximum limit is 50', 400);
    }

    const parent = await prisma.reelComment.findUnique({ where: { id: cid } });
    if (!parent) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }
    if (parent.submissionId !== submissionId) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Comment does not belong to this reel',
        400
      );
    }

    const replies = await prisma.reelComment.findMany({
      where: {
        parentCommentId: cid,
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

    const total = await prisma.reelComment.count({
      where: { parentCommentId: cid, isHidden: false },
    });

    return successResponse({
      replies: processed,
      total,
      hasMore: offset + processed.length < total,
    });
  } catch (error: any) {
    console.error('[API /reels/[id]/comments/[commentId]/replies] GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error fetching replies', 500);
  }
}
