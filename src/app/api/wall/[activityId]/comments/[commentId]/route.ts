import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';
import { isWallActivityVisible } from '@/lib/wall-activity';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ activityId: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email;
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { activityId: rawActivityId, commentId: rawCommentId } = await params;
    const activityId = Number(rawActivityId);
    const commentId = Number(rawCommentId);
    if (!Number.isInteger(activityId) || activityId <= 0 || !Number.isInteger(commentId) || commentId <= 0) {
      return errorResponse('INVALID_ID', 'Invalid activity or comment ID', 400);
    }

    const activity = await prisma.wallActivity.findUnique({
      where: { id: activityId },
      select: { id: true, type: true, sourceId: true },
    });
    if (!activity || !(await isWallActivityVisible(activity.type, activity.sourceId))) {
      return errorResponse('NOT_FOUND', 'Wall activity not found', 404);
    }

    const [comment, user] = await Promise.all([
      prisma.wallComment.findFirst({
        where: { id: commentId, activityId },
        select: { id: true, userId: true },
      }),
      prisma.user.findUnique({
        where: { email: userId },
        select: { role: true },
      }),
    ]);
    if (!comment) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }
    if (comment.userId !== userId && user?.role !== 'admin') {
      return errorResponse('FORBIDDEN', 'You can only delete your own comments', 403);
    }

    await prisma.wallComment.delete({ where: { id: comment.id } });
    return successResponse({ message: 'Comment deleted' });
  } catch (error) {
    console.error('[API /wall/[activityId]/comments/[commentId]] DELETE error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error deleting wall comment', 500);
  }
}
