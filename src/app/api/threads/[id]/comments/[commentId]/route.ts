import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';
import { isAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const MAX_COMMENT_LENGTH = 500;

/**
 * PATCH /api/threads/:id/comments/:commentId - Editar comentario del thread.
 * Solo el dueño puede editar.
 */
export async function PATCH(
  req: NextRequest,
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

    const body = await req.json();
    const { content } = body;
    if (!content || typeof content !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'Content is required', 400);
    }
    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_COMMENT_LENGTH) {
      return errorResponse('VALIDATION_ERROR', 'Invalid content length', 400);
    }

    const comment = await prisma.spotComment.findUnique({ where: { id: commentId } });
    if (!comment) return errorResponse('NOT_FOUND', 'Comment not found', 404);
    if (comment.threadId !== threadId) {
      return errorResponse('VALIDATION_ERROR', 'Comment does not belong to this thread', 400);
    }
    if (comment.userId !== userEmail) {
      return errorResponse('FORBIDDEN', 'You can only edit your own comments', 403);
    }

    const updated = await prisma.spotComment.update({
      where: { id: commentId },
      data: { content: trimmed, updatedAt: new Date() },
      include: { user: { select: { name: true, photo: true, username: true } } },
    });
    return successResponse({ comment: updated, message: 'Comment updated' });
  } catch (error) {
    console.error('[PATCH .../comments/:commentId] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not update comment', 500);
  }
}

/**
 * DELETE /api/threads/:id/comments/:commentId - Eliminar comentario.
 * Solo el dueño o admin puede eliminar.
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

    const comment = await prisma.spotComment.findUnique({ where: { id: commentId } });
    if (!comment) return errorResponse('NOT_FOUND', 'Comment not found', 404);
    if (comment.threadId !== threadId) {
      return errorResponse('VALIDATION_ERROR', 'Comment does not belong to this thread', 400);
    }

    const admin = await isAdmin(userEmail);
    if (!admin && comment.userId !== userEmail) {
      return errorResponse('FORBIDDEN', 'You cannot delete this comment', 403);
    }

    await prisma.spotComment.delete({ where: { id: commentId } });
    return successResponse({ message: 'Comment deleted' });
  } catch (error) {
    console.error('[DELETE .../comments/:commentId] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not delete comment', 500);
  }
}
