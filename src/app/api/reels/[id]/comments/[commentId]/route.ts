import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface EditCommentRequest {
  content: string;
}

const MAX_COMMENT_LENGTH = 500;

/**
 * PATCH /api/reels/:id/comments/:commentId - Editar comentario.
 * Solo el autor puede editar.
 */
export async function PATCH(
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

    const body: EditCommentRequest = await req.json();
    const trimmed = (body.content ?? '').trim();
    if (!trimmed) {
      return errorResponse('VALIDATION_ERROR', 'Content is required', 400);
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      return errorResponse(
        'VALIDATION_ERROR',
        `Comment is too long (${trimmed.length}/${MAX_COMMENT_LENGTH})`,
        400
      );
    }

    const comment = await prisma.reelComment.findUnique({ where: { id: cid } });
    if (!comment) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }
    if (comment.submissionId !== submissionId) {
      return errorResponse('VALIDATION_ERROR', 'Comment does not belong to this reel', 400);
    }
    if (comment.userId !== session.user.email) {
      return errorResponse('FORBIDDEN', 'You can only edit your own comments', 403);
    }

    const updated = await prisma.reelComment.update({
      where: { id: cid },
      data: { content: trimmed },
      include: {
        user: { select: { name: true, photo: true, username: true } },
      },
    });

    return successResponse({ comment: updated, message: 'Comment updated' });
  } catch (error: any) {
    console.error('[API /reels/[id]/comments/[commentId]] PATCH error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error updating comment', 500);
  }
}

/**
 * DELETE /api/reels/:id/comments/:commentId - Eliminar comentario.
 * Autor o admin pueden eliminar.
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

    const comment = await prisma.reelComment.findUnique({ where: { id: cid } });
    if (!comment) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }
    if (comment.submissionId !== submissionId) {
      return errorResponse('VALIDATION_ERROR', 'Comment does not belong to this reel', 400);
    }

    const isOwner = comment.userId === session.user.email;
    const isAdmin = session.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return errorResponse('FORBIDDEN', 'You can only delete your own comments', 403);
    }

    await prisma.reelComment.delete({ where: { id: cid } });
    return successResponse({ message: 'Comment deleted' });
  } catch (error: any) {
    console.error('[API /reels/[id]/comments/[commentId]] DELETE error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error deleting comment', 500);
  }
}
