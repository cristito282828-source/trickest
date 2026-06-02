import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface EditCommentRequest {
  content: string;
}

// PATCH /api/spots/:spotId/comments/:commentId - Editar comentario
export async function PATCH(
  req: Request,
  { params }: { params: { spotId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'You must log in', 401);
    }

    const userEmail = session.user.email;
    const spotId = parseInt(params.spotId);
    const commentId = parseInt(params.commentId);

    if (isNaN(spotId) || isNaN(commentId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid IDs', 400);
    }

    const body: EditCommentRequest = await req.json();
    const { content } = body;

    // Validaciones
    if (!content || typeof content !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'Content is required', 400);
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'El comentario no puede estar vacío', 400);
    }

    if (trimmedContent.length > 500) {
      return errorResponse(
        'VALIDATION_ERROR',
        `El comentario es muy largo (${trimmedContent.length}/500 caracteres)`,
        400
      );
    }

    // Verificar que el comentario existe
    const comment = await prisma.spotComment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }

    // Verificar que el comentario pertenece al spot
    if (comment.spotId !== spotId) {
      return errorResponse('VALIDATION_ERROR', 'El comentario no pertenece a este spot', 400);
    }

    // Verificar que el usuario es el dueño del comentario
    if (comment.userId !== userEmail) {
      return errorResponse('FORBIDDEN', 'You can only edit your own comments', 403);
    }

    // Actualizar comentario
    const updatedComment = await prisma.spotComment.update({
      where: { id: commentId },
      data: {
        content: trimmedContent,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            name: true,
            photo: true,
            username: true
          }
        }
      }
    });

    return successResponse({
      comment: updatedComment,
      message: 'Comentario actualizado'
    });

  } catch (error) {
    console.error('Error editando comentario:', error);
    return errorResponse('INTERNAL_ERROR', 'Error al editar comentario', 500);
  }
}

// DELETE /api/spots/:spotId/comments/:commentId - Eliminar comentario
export async function DELETE(
  req: Request,
  { params }: { params: { spotId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'You must log in', 401);
    }

    const userEmail = session.user.email;
    const spotId = parseInt(params.spotId);
    const commentId = parseInt(params.commentId);

    if (isNaN(spotId) || isNaN(commentId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid IDs', 400);
    }

    // Verificar que el comentario existe
    const comment = await prisma.spotComment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }

    // Verificar que el comentario pertenece al spot
    if (comment.spotId !== spotId) {
      return errorResponse('VALIDATION_ERROR', 'El comentario no pertenece a este spot', 400);
    }

    // Verificar permisos (dueño del comentario o admin)
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { role: true }
    });

    const isAdmin = user?.role === 'admin';
    const isOwner = comment.userId === userEmail;

    if (!isAdmin && !isOwner) {
      return errorResponse('FORBIDDEN', 'You cannot delete this comment', 403);
    }

    // Eliminar comentario (los votos se eliminan en cascade por la DB)
    await prisma.spotComment.delete({
      where: { id: commentId }
    });

    return successResponse({
      message: 'Comentario eliminado'
    });

  } catch (error) {
    console.error('Error eliminando comentario:', error);
    return errorResponse('INTERNAL_ERROR', 'Error deleting comment', 500);
  }
}
