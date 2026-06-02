import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// GET /api/spots/:spotId/comments/:commentId/replies - Obtener respuestas de un comentario
export async function GET(
  req: Request,
  { params }: { params: { spotId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    const spotId = parseInt(params.spotId);
    const commentId = parseInt(params.commentId);

    if (isNaN(spotId) || isNaN(commentId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid IDs', 400);
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (limit > 50) {
      return errorResponse('VALIDATION_ERROR', 'El límite máximo es 50 respuestas', 400);
    }

    // Verificar que el comentario padre existe
    const parentComment = await prisma.spotComment.findUnique({
      where: { id: commentId }
    });

    if (!parentComment) {
      return errorResponse('NOT_FOUND', 'Comment not found', 404);
    }

    if (parentComment.spotId !== spotId) {
      return errorResponse('VALIDATION_ERROR', 'El comentario no pertenece a este spot', 400);
    }

    // Obtener respuestas
    const replies = await prisma.spotComment.findMany({
      where: {
        spotId,
        parentCommentId: commentId,
        isHidden: false
      },
      orderBy: { createdAt: 'asc' }, // Respuestas en orden cronológico
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            name: true,
            photo: true,
            username: true
          }
        },
        // Incluir votos del usuario actual si está autenticado
        ...(userEmail ? {
          votes: {
            where: { userId: userEmail },
            select: { voteType: true }
          }
        } : {})
      }
    });

    // Procesar respuestas para agregar el voto del usuario
    const processedReplies = replies.map(reply => ({
      ...reply,
      userVote: reply.votes?.[0]?.voteType || null,
      votes: undefined
    }));

    // Contar total de respuestas
    const total = await prisma.spotComment.count({
      where: {
        spotId,
        parentCommentId: commentId,
        isHidden: false
      }
    });

    return successResponse({
      replies: processedReplies,
      total,
      hasMore: offset + processedReplies.length < total
    });

  } catch (error) {
    console.error('Error obteniendo respuestas:', error);

    const message = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : 'Error al obtener las respuestas')
      : 'Error al obtener las respuestas';

    return errorResponse('INTERNAL_ERROR', message, 500);
  }
}
