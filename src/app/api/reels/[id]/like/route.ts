import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reels/[id]/like
 * Da like a un reel (inserta en Vote con voteType='upvote').
 * Idempotente: si ya tiene like, retorna el reel sin cambios.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }
    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return errorResponse('INVALID_ID', 'Invalid reel ID', 400);
    }

    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      return errorResponse('NOT_FOUND', 'Reel not found', 404);
    }
    if (submission.status !== 'approved') {
      return errorResponse('NOT_APPROVED', 'Cannot like a non-approved reel', 400);
    }

    const userId = session.user.email;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.vote.findUnique({
        where: { submissionId_userId: { submissionId, userId } },
      });
      if (existing) {
        // Idempotente: ya tiene like
        return {
          alreadyLiked: true,
          submission: await tx.submission.findUnique({ where: { id: submissionId } }),
        };
      }
      await tx.vote.create({
        data: { submissionId, userId, voteType: 'upvote' },
      });
      const updated = await tx.submission.update({
        where: { id: submissionId },
        data: { upvotes: { increment: 1 }, voteCount: { increment: 1 } },
      });
      return { alreadyLiked: false, submission: updated };
    });

    return successResponse(result);
  } catch (error) {
    console.error('[API /reels/[id]/like] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error liking reel', 500);
  }
}

/**
 * GET /api/reels/[id]/like
 * Devuelve si el usuario actual dio like a este reel.
 * Retorna { liked: false } si no hay sesión.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return successResponse({ liked: false });
    }
    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return errorResponse('INVALID_ID', 'Invalid reel ID', 400);
    }
    const vote = await prisma.vote.findUnique({
      where: { submissionId_userId: { submissionId, userId: session.user.email } },
    });
    return successResponse({ liked: vote?.voteType === 'upvote' });
  } catch (error) {
    console.error('[API /reels/[id]/like] GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error checking like', 500);
  }
}

/**
 * DELETE /api/reels/[id]/like
 * Quita el like del usuario actual.
 * Idempotente: si no tenía like, no hace nada.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }
    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return errorResponse('INVALID_ID', 'Invalid reel ID', 400);
    }
    const userId = session.user.email;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.vote.findUnique({
        where: { submissionId_userId: { submissionId, userId } },
      });
      if (existing && existing.voteType === 'upvote') {
        await tx.vote.delete({ where: { id: existing.id } });
        await tx.submission.update({
          where: { id: submissionId },
          data: { upvotes: { decrement: 1 }, voteCount: { decrement: 1 } },
        });
      }
    });

    return successResponse({ message: 'Like removed' });
  } catch (error) {
    console.error('[API /reels/[id]/like] DELETE error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error removing like', 500);
  }
}
