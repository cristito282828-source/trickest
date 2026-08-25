import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { proposeSchema, successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_MS = 60 * 1000; // 1 propuesta por usuario por thread cada 60s

/**
 * POST /api/monthly-thread/propose
 *
 * Body: { threadId: number, text: string }
 * Auth: requerida.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'You must log in to propose', 401);
    }
    const userEmail = session.user.email;

    const body = await req.json();
    const parse = proposeSchema.safeParse(body);
    if (!parse.success) {
      const firstIssue = parse.error.issues[0];
      return errorResponse('VALIDATION_ERROR', firstIssue?.message || 'Invalid data', 400);
    }
    const { threadId, text } = parse.data;

    // Verificar que el thread existe y está activo
    const thread = await prisma.monthlyThread.findUnique({ where: { id: threadId } });
    if (!thread) {
      return errorResponse('NOT_FOUND', 'Thread not found', 404);
    }
    if (thread.status !== 'active' || thread.endsAt < new Date()) {
      return errorResponse('THREAD_CLOSED', 'This thread is closed', 400);
    }

    // Rate limit: 1 propuesta por usuario por thread cada 60s
    const recentProposal = await prisma.threadProposal.findFirst({
      where: { threadId, userId: userEmail },
      orderBy: { createdAt: 'desc' },
    });
    if (recentProposal) {
      const elapsed = Date.now() - recentProposal.createdAt.getTime();
      if (elapsed < RATE_LIMIT_MS) {
        return errorResponse(
          'RATE_LIMIT_EXCEEDED',
          'Wait a moment before proposing again',
          429
        );
      }
    }

    // Anti-spam: ratio de palabras únicas bajo (mismo patrón que reels comments)
    const words = text.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 4 && uniqueWords.size < words.length * 0.3) {
      return errorResponse('SPAM_DETECTED', 'Your proposal looks like spam', 400);
    }

    let proposal;
    try {
      proposal = await prisma.threadProposal.create({
        data: { threadId, userId: userEmail, text },
        include: {
          user: { select: { name: true, photo: true, username: true } },
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return errorResponse(
          'DUPLICATE_PROPOSAL',
          'You already proposed that exact text',
          409
        );
      }
      throw err;
    }

    return successResponse(
      {
        proposal: {
          id: proposal.id,
          text: proposal.text,
          voteCount: proposal.voteCount,
          createdAt: proposal.createdAt,
          userVoted: false,
          user: proposal.user,
        },
      },
      201
    );
  } catch (error) {
    console.error('[POST /api/monthly-thread/propose] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not submit your proposal', 500);
  }
}
