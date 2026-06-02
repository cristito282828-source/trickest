import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface VoteRequest {
  voteType: 'like' | 'dislike';
}

// POST /api/spots/:spotId/comments/:commentId/vote - Votar en comentario
export async function POST(
  req: Request,
  { params }: { params: { spotId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Debes iniciar sesión para votar', 401);
    }

    const userEmail = session.user.email;
    const spotId = parseInt(params.spotId);
    const commentId = parseInt(params.commentId);

    if (isNaN(spotId) || isNaN(commentId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid IDs', 400);
    }

    const body: VoteRequest = await req.json();
    const { voteType } = body;

    // Validar voteType
    if (voteType !== 'like' && voteType !== 'dislike') {
      return errorResponse(
        'VALIDATION_ERROR',
        'El tipo de voto debe ser "like" o "dislike"',
        400
      );
    }

    // Verificar que el comentario existe
    const comment = await prisma.spotComment.findUnique({
      where: { id: commentId },
      include: {
        votes: {
          where: { userId: userEmail }
        }
      }
    });

    if (!comment) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }

    // Verificar que el comentario pertenece al spot (seguridad)
    if (comment.spotId !== spotId) {
      return errorResponse('VALIDATION_ERROR', 'El comentario no pertenece a este spot', 400);
    }

    // Verificar si el usuario ya votó
    const existingVote = comment.votes[0];

    if (existingVote) {
      // Si ya votó lo mismo, no hacer nada (idempotente)
      if (existingVote.voteType === voteType) {
        return successResponse({
          message: 'Ya has votado esto',
          comment: {
            likes: comment.likes,
            dislikes: comment.dislikes
          }
        });
      }

      // Si votó diferente, actualizar el voto
      await prisma.$transaction(async (tx) => {
        // Eliminar el voto anterior
        await tx.commentVote.delete({
          where: {
            id: existingVote.id
          }
        });

        // Restar el voto anterior
        if (existingVote.voteType === 'like') {
          await tx.spotComment.update({
            where: { id: commentId },
            data: { likes: { decrement: 1 } }
          });
        } else {
          await tx.spotComment.update({
            where: { id: commentId },
            data: { dislikes: { decrement: 1 } }
          });
        }

        // Agregar el nuevo voto
        await tx.commentVote.create({
          data: {
            commentId,
            userId: userEmail,
            voteType
          }
        });

        // Sumar el nuevo voto
        if (voteType === 'like') {
          await tx.spotComment.update({
            where: { id: commentId },
            data: { likes: { increment: 1 } }
          });
        } else {
          await tx.spotComment.update({
            where: { id: commentId },
            data: { dislikes: { increment: 1 } }
          });
        }
      });

      // Obtener comentario actualizado
      const updatedComment = await prisma.spotComment.findUnique({
        where: { id: commentId },
        select: {
          likes: true,
          dislikes: true
        }
      });

      return successResponse({
        message: 'Voto actualizado',
        comment: updatedComment
      });
    }

    // Nuevo voto
    await prisma.$transaction(async (tx) => {
      // Crear el voto
      await tx.commentVote.create({
        data: {
          commentId,
          userId: userEmail,
          voteType
        }
      });

      // Actualizar contadores del comentario
      if (voteType === 'like') {
        await tx.spotComment.update({
          where: { id: commentId },
          data: { likes: { increment: 1 } }
        });
      } else {
        await tx.spotComment.update({
          where: { id: commentId },
          data: { dislikes: { increment: 1 } }
        });
      }
    });

    // Obtener comentario actualizado
    const updatedComment = await prisma.spotComment.findUnique({
      where: { id: commentId },
      select: {
        likes: true,
        dislikes: true
      }
    });

    return successResponse({
      message: 'Voto registrado',
      comment: updatedComment
    });

  } catch (error) {
    console.error('Error votando comentario:', error);

    // Detectar si es un error de tabla no existe
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2021') {
      return errorResponse(
        'TABLE_NOT_FOUND',
        'La tabla de votos no existe. Ejecuta: npx prisma db push',
        500
      );
    }

    return errorResponse('INTERNAL_ERROR', 'Error al votar', 500);
  }
}

// DELETE /api/spots/:spotId/comments/:commentId/vote - Remover voto
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

    // Verificar que el comentario existe y obtener el voto del usuario
    const comment = await prisma.spotComment.findUnique({
      where: { id: commentId },
      include: {
        votes: {
          where: { userId: userEmail }
        }
      }
    });

    if (!comment) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }

    // Verificar que el comentario pertenece al spot (seguridad)
    if (comment.spotId !== spotId) {
      return errorResponse('VALIDATION_ERROR', 'El comentario no pertenece a este spot', 400);
    }

    const existingVote = comment.votes[0];

    if (!existingVote) {
      return errorResponse('NOT_FOUND', 'No has votado en este comentario', 404);
    }

    // Eliminar el voto y actualizar contadores
    await prisma.$transaction(async (tx) => {
      // Eliminar el voto
      await tx.commentVote.delete({
        where: { id: existingVote.id }
      });

      // Restar el voto correspondiente
      if (existingVote.voteType === 'like') {
        await tx.spotComment.update({
          where: { id: commentId },
          data: { likes: { decrement: 1 } }
        });
      } else {
        await tx.spotComment.update({
          where: { id: commentId },
          data: { dislikes: { decrement: 1 } }
        });
      }
    });

    // Obtener comentario actualizado
    const updatedComment = await prisma.spotComment.findUnique({
      where: { id: commentId },
      select: {
        likes: true,
        dislikes: true
      }
    });

    return successResponse({
      message: 'Voto eliminado',
      comment: updatedComment
    });

  } catch (error) {
    console.error('Error eliminando voto:', error);
    return errorResponse('INTERNAL_ERROR', 'Error deleting vote', 500);
  }
}
