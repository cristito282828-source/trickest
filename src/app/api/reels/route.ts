import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reels
 *
 * Devuelve el top 10 de submissions aprobadas rankeadas por score.
 * Usado por la sección pública "Top Reels" del home.
 *
 * Si el usuario está logueado, incluye `userVote` (boolean) por reel
 * y `commentCount` (count de ReelComment).
 *
 * Solo expone: id, videoUrl, score, submittedAt, upvotes, voteCount,
 *              challenge {name, level, difficulty, points, isBonus},
 *              user {email, name, photo, username}.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email ?? null;

    const submissions = await prisma.submission.findMany({
      where: {
        status: 'approved',
        videoUrl: { not: '' },
      },
      orderBy: [
        { score: 'desc' },
        { submittedAt: 'desc' },
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
        _count: {
          select: { reelComments: true },
        },
      },
    });

    // Si hay sesión, batch-fetch los likes del usuario en una sola query
    let userLikes = new Map<number, boolean>();
    if (userEmail && submissions.length > 0) {
      const submissionIds = submissions.map((s) => s.id);
      const votes = await prisma.vote.findMany({
        where: {
          submissionId: { in: submissionIds },
          userId: userEmail,
          voteType: 'upvote',
        },
        select: { submissionId: true },
      });
      userLikes = new Map(votes.map((v) => [v.submissionId, true]));
    }

    // Enriquecer cada reel con userVote y commentCount
    const enriched = submissions.map((s) => ({
      ...s,
      userVote: userLikes.has(s.id) ? 'upvote' as const : null,
      commentCount: s._count?.reelComments ?? 0,
    }));

    return successResponse({ reels: enriched, count: enriched.length });
  } catch (error) {
    console.error('[API /reels] GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error fetching reels', 500);
  }
}
