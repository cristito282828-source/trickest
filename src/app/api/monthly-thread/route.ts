import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/monthly-thread
 *
 * Devuelve el hilo activo (por defecto) o los cerrados/archivados según query param.
 * Incluye el thread, sus propuestas ordenadas por votos, top 5 comentarios del thread,
 * y datos del usuario (voto en cada propuesta).
 *
 * Query params:
 *   - status: 'active' (default) | 'closed' | 'archived'
 *
 * Auth: opcional. Si hay sesión, incluye `userVoted` por propuesta.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    if (!['active', 'closed', 'archived'].includes(status)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid status value', 400);
    }

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email ?? null;

    // Buscar el thread activo más reciente (o según filtro).
    // Si status='active' queremos el thread activo que aún no cerró (endsAt > now).
    const now = new Date();
    const thread = await prisma.monthlyThread.findFirst({
      where: {
        status,
        ...(status === 'active' ? { endsAt: { gte: now } } : {}),
      },
      orderBy: { endsAt: 'desc' },
      include: {
        winnerProposal: true,
      },
    });

    if (!thread) {
      return successResponse({
        thread: null,
        proposals: [],
        topComments: [],
        totalComments: 0,
        totalProposals: 0,
        totalVotes: 0,
      });
    }

    // Traer propuestas + voto del usuario actual
    const proposals = await prisma.threadProposal.findMany({
      where: { threadId: thread.id },
      orderBy: [{ voteCount: 'desc' }, { createdAt: 'asc' }],
      include: {
        user: { select: { name: true, photo: true, username: true, email: true } },
        votes: userEmail ? { where: { userId: userEmail }, select: { id: true } } : undefined,
      },
    });

    const proposalsWithVote = proposals.map((p) => ({
      id: p.id,
      text: p.text,
      voteCount: p.voteCount,
      createdAt: p.createdAt,
      userVoted: userEmail ? (p.votes?.length ?? 0) > 0 : false,
      user: {
        name: p.user.name,
        photo: p.user.photo,
        username: p.user.username,
      },
    }));

    // Top 5 comentarios del thread (top-level, no hidden, recientes primero)
    const topComments = await prisma.spotComment.findMany({
      where: {
        threadId: thread.id,
        isHidden: false,
        parentCommentId: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true, photo: true, username: true } },
        votes: userEmail ? { where: { userId: userEmail }, select: { voteType: true } } : undefined,
        _count: { select: { replies: true } },
      },
    });

    const totalComments = await prisma.spotComment.count({
      where: { threadId: thread.id, isHidden: false, parentCommentId: null },
    });

    const totalVotes = proposals.reduce((sum, p) => sum + p.voteCount, 0);

    return successResponse({
      thread: {
        id: thread.id,
        slug: thread.slug,
        question: thread.question,
        description: thread.description,
        status: thread.status,
        startsAt: thread.startsAt,
        endsAt: thread.endsAt,
        winnerProposalId: thread.winnerProposalId,
      },
      proposals: proposalsWithVote,
      topComments: topComments.map((c) => ({
        id: c.id,
        content: c.content,
        likes: c.likes,
        dislikes: c.dislikes,
        createdAt: c.createdAt,
        userVote: userEmail && c.votes?.[0] ? c.votes[0].voteType : null,
        replyCount: c._count.replies,
        user: {
          name: c.user.name,
          photo: c.user.photo,
          username: c.user.username,
        },
      })),
      totalComments,
      totalProposals: proposals.length,
      totalVotes,
    });
  } catch (error) {
    console.error('[GET /api/monthly-thread] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Could not load the thread', 500);
  }
}
