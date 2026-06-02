import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// GET /api/spots/:spotId/top-comment - Obtener el comentario con más likes
export async function GET(
  req: Request,
  { params }: { params: { spotId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const spotId = parseInt(params.spotId);
    if (isNaN(spotId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid spot ID', 400);
    }

    // Verificar que el spot existe
    const spot = await prisma.spot.findUnique({
      where: { id: spotId }
    });

    if (!spot) {
      return errorResponse('NOT_FOUND', 'Spot not found', 404);
    }

    // Obtener el comentario con más likes (que no esté oculto)
    const topComment = await prisma.spotComment.findFirst({
      where: {
        spotId,
        isHidden: false
      },
      orderBy: [
        { likes: 'desc' },
        { createdAt: 'desc' }
      ],
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

    if (!topComment) {
      return successResponse({
        comment: null,
        hasComments: false
      });
    }

    // Obtener el total de comentarios
    const totalComments = await prisma.spotComment.count({
      where: {
        spotId,
        isHidden: false
      }
    });

    // Procesar comentario para agregar el voto del usuario
    const processedComment = {
      ...topComment,
      userVote: topComment.votes?.[0]?.voteType || null,
      votes: undefined
    };

    return successResponse({
      comment: processedComment,
      hasComments: true,
      totalComments
    });

  } catch (error) {
    console.error('Error obteniendo top comentario:', error);

    // Detectar si es un error de tabla no existe
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2021') {
      return errorResponse(
        'TABLE_NOT_FOUND',
        'La tabla de comentarios no existe. Ejecuta: npx prisma db push',
        500
      );
    }

    // En desarrollo, mostrar el error completo
    const message = process.env.NODE_ENV === 'development'
      ? error instanceof Error ? error.message : String(error) || 'Error al obtener el comentario'
      : 'Error al obtener el comentario';

    return errorResponse('INTERNAL_ERROR', message, 500);
  }
}
