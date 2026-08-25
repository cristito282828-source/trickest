import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/monthly-thread/:id/vote
 *
 * NOTA: el param [id] en realidad es el proposalId (no el threadId).
 * Esto permite que cada propuesta tenga su propio endpoint de voto.
 *
 * Devuelve si el usuario actual votó la propuesta.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return successResponse({ hasVoted: false });
    }
    const { id } = await params;
    const proposalId = parseInt(id, 10);
    if (isNaN(proposalId)) return errorResponse('INVALID_ID', 'Invalid proposal ID', 400);

    const vote = await prisma.threadProposalVote.findUnique({
      where: { proposalId_userId: { proposalId, userId: session.user.email } },
    });
    return successResponse({ hasVoted: !!vote });
  } catch (error) {
    console.error('[GET /api/monthly-thread/:id/vote] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not check vote', 500);
  }
}

/**
 * POST /api/monthly-thread/:id/vote
 *
 * Crea un voto (toggle: si ya existe lo elimina; si no, lo crea).
 * Incrementa/decrementa `voteCount` en `ThreadProposal` dentro de una transacción.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'You must log in to vote', 401);
    }
    const userEmail = session.user.email;
    const { id } = await params;
    const proposalId = parseInt(id, 10);
    if (isNaN(proposalId)) return errorResponse('INVALID_ID', 'Invalid proposal ID', 400);

    // Verificar propuesta + thread activo (en transacción)
    const result = await prisma.$transaction(async (tx) => {
      const proposal = await tx.threadProposal.findUnique({
        where: { id: proposalId },
        include: { thread: true },
      });
      if (!proposal) {
        return { ok: false as const, status: 404, error: ['NOT_FOUND', 'Proposal not found'] };
      }
      if (proposal.thread.status !== 'active' || proposal.thread.endsAt < new Date()) {
        return { ok: false as const, status: 400, error: ['THREAD_CLOSED', 'This thread is closed'] };
      }

      // Toggle: buscar voto existente
      const existing = await tx.threadProposalVote.findUnique({
        where: { proposalId_userId: { proposalId, userId: userEmail } },
      });

      if (existing) {
        // Quitar voto
        await tx.threadProposalVote.delete({ where: { id: existing.id } });
        const updated = await tx.threadProposal.update({
          where: { id: proposalId },
          data: { voteCount: { decrement: 1 } },
        });
        return { ok: true as const, voteCount: updated.voteCount, voted: false };
      }

      // Crear voto
      await tx.threadProposalVote.create({
        data: { proposalId, userId: userEmail },
      });
      const updated = await tx.threadProposal.update({
        where: { id: proposalId },
        data: { voteCount: { increment: 1 } },
      });
      return { ok: true as const, voteCount: updated.voteCount, voted: true };
    });

    if (!result.ok) {
      return errorResponse(result.error[0], result.error[1], result.status);
    }

    return successResponse({
      proposalId,
      voteCount: result.voteCount,
      voted: result.voted,
    });
  } catch (error) {
    console.error('[POST /api/monthly-thread/:id/vote] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not register your vote', 500);
  }
}
