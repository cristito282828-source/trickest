import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { closeThreadSchema, successResponse, errorResponse } from '@/lib/validation';
import { isAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/monthly-thread/:id/close
 *
 * Body: { winnerProposalId: number }
 * Auth: admin only.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'You must log in', 401);
    }
    if (!(await isAdmin(session.user.email))) {
      return errorResponse('NOT_ADMIN', 'Only admins can close threads', 403);
    }
    const { id } = await params;
    const threadId = parseInt(id, 10);
    if (isNaN(threadId)) return errorResponse('INVALID_ID', 'Invalid thread ID', 400);

    const body = await req.json();
    const parse = closeThreadSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid data', 400);
    }
    const { winnerProposalId } = parse.data;

    // Verificar thread existe y no está ya cerrado
    const thread = await prisma.monthlyThread.findUnique({ where: { id: threadId } });
    if (!thread) {
      return errorResponse('NOT_FOUND', 'Thread not found', 404);
    }
    if (thread.status === 'closed' || thread.status === 'archived') {
      return errorResponse('THREAD_ALREADY_CLOSED', 'Thread is already closed', 400);
    }

    // Verificar que winnerProposalId pertenece al thread
    const proposal = await prisma.threadProposal.findUnique({
      where: { id: winnerProposalId },
    });
    if (!proposal || proposal.threadId !== threadId) {
      return errorResponse(
        'PROPOSAL_NOT_IN_THREAD',
        'Proposal does not belong to this thread',
        400
      );
    }

    // Cerrar thread + setear ganador
    const updatedThread = await prisma.monthlyThread.update({
      where: { id: threadId },
      data: {
        status: 'closed',
        winnerProposalId,
      },
    });

    return successResponse({
      thread: {
        id: updatedThread.id,
        status: updatedThread.status,
        winnerProposalId: updatedThread.winnerProposalId,
      },
      winnerProposal: {
        id: proposal.id,
        text: proposal.text,
        voteCount: proposal.voteCount,
      },
    });
  } catch (error) {
    console.error('[POST /api/monthly-thread/:id/close] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not close the thread', 500);
  }
}
