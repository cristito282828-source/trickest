import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import MonthlyThreadList from './MonthlyThreadList';

export const dynamic = 'force-dynamic';

/**
 * Server Component que carga el hilo activo y lo pasa al client.
 * Si no hay hilo activo, retorna null (la home sigue funcionando normal).
 */
export default async function MonthlyThreadSection() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? null;
  const now = new Date();

  const thread = await prisma.monthlyThread.findFirst({
    where: {
      status: 'active',
      endsAt: { gte: now },
    },
    orderBy: { endsAt: 'desc' },
    include: {
      winnerProposal: true,
    },
  });

  if (!thread) {
    return null;
  }

  const [proposals, topComments, totalComments] = await Promise.all([
    prisma.threadProposal.findMany({
      where: { threadId: thread.id },
      orderBy: [{ voteCount: 'desc' }, { createdAt: 'asc' }],
      include: {
        user: { select: { name: true, photo: true, username: true } },
        votes: userEmail ? { where: { userId: userEmail }, select: { id: true } } : undefined,
      },
    }),
    prisma.spotComment.findMany({
      where: {
        threadId: thread.id,
        isHidden: false,
        parentCommentId: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true, photo: true, username: true } },
        _count: { select: { replies: true } },
        votes: userEmail ? { where: { userId: userEmail }, select: { voteType: true } } : undefined,
      },
    }),
    prisma.spotComment.count({
      where: { threadId: thread.id, isHidden: false, parentCommentId: null },
    }),
  ]);

  const proposalsForClient = proposals.map((p) => ({
    id: p.id,
    text: p.text,
    voteCount: p.voteCount,
    createdAt: p.createdAt.toISOString(),
    userVoted: userEmail ? (p.votes?.length ?? 0) > 0 : false,
    user: {
      name: p.user.name,
      photo: p.user.photo,
      username: p.user.username,
    },
  }));

  const commentsForClient = topComments.map((c) => ({
    id: c.id,
    content: c.content,
    likes: c.likes,
    dislikes: c.dislikes,
    createdAt: c.createdAt.toISOString(),
    userVote:
      userEmail && c.votes?.[0]?.voteType
        ? (c.votes[0].voteType as 'like' | 'dislike')
        : null,
    replyCount: c._count.replies,
    user: {
      name: c.user.name,
      photo: c.user.photo,
      username: c.user.username,
    },
  }));

  const threadForClient = {
    id: thread.id,
    slug: thread.slug,
    question: thread.question,
    description: thread.description,
    status: thread.status,
    endsAt: thread.endsAt.toISOString(),
    startsAt: thread.startsAt.toISOString(),
    winnerProposalId: thread.winnerProposalId,
  };

  return (
    <MonthlyThreadList
      thread={threadForClient}
      proposals={proposalsForClient}
      topComments={commentsForClient}
      totalComments={totalComments}
      isLoggedIn={!!userEmail}
    />
  );
}