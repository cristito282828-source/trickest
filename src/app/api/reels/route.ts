import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reels
 *
 * Devuelve el top 10 de submissions aprobadas rankeadas por score.
 * Usado por la sección pública "Top Reels" del home.
 *
 * Solo expone: id, videoUrl, score, submittedAt, upvotes, voteCount,
 *              challenge {name, level, difficulty, points, isBonus},
 *              user {email, name, photo, username}.
 *
 * NO expone userId (email del skater — si está logueado) ni datos sensibles.
 */
export async function GET() {
  try {
    const submissions = await prisma.submission.findMany({
      where: {
        status: 'approved',
        // Solo submissions que tienen video (defensivo)
        videoUrl: { not: '' },
      },
      orderBy: [
        { score: 'desc' },
        { submittedAt: 'desc' }, // tiebreaker
      ],
      take: 10,
      include: {
        challenge: {
          select: {
            name: true,
            level: true,
            difficulty: true,
            points: true,
            isBonus: true,
          },
        },
        user: {
          select: {
            email: true,
            name: true,
            photo: true,
            username: true,
          },
        },
      },
    });

    return successResponse({ reels: submissions, count: submissions.length });
  } catch (error) {
    console.error('[API /reels] GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error fetching reels', 500);
  }
}
