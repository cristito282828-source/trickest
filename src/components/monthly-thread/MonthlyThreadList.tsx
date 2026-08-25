'use client';

import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/routing';
import MonthlyThreadCountdown from './MonthlyThreadCountdown';
import MonthlyThreadProposal, { type ProposalClient } from './MonthlyThreadProposal';
import MonthlyThreadForm from './MonthlyThreadForm';
import { useState, useTransition } from 'react';
import { MdAddCircle, MdForum, MdLogin } from 'react-icons/md';

export interface ThreadClient {
  id: number;
  slug: string;
  question: string;
  description: string | null;
  status: string;
  endsAt: string;
  startsAt: string;
  winnerProposalId: number | null;
}

export interface CommentClient {
  id: number;
  content: string;
  likes: number;
  dislikes: number;
  createdAt: string;
  userVote: 'like' | 'dislike' | null;
  replyCount: number;
  user: { name: string | null; photo: string | null; username: string | null };
}

interface MonthlyThreadListProps {
  thread: ThreadClient;
  proposals: ProposalClient[];
  topComments: CommentClient[];
  totalComments: number;
  isLoggedIn: boolean;
}

export default function MonthlyThreadList({
  thread,
  proposals: initialProposals,
  topComments,
  totalComments,
  isLoggedIn,
}: MonthlyThreadListProps) {
  const t = useTranslations('monthlyThread');
  const router = useRouter();
  const { data: session } = useSession();
  const [proposals, setProposals] = useState(initialProposals);
  const [, startTransition] = useTransition();
  const closed = thread.status === 'closed';

  const userRole = session?.user?.role;
  const isAdmin = userRole === 'admin';

  function handleProposed() {
    // Refrescar server data (re-fetch del server component) — esto actualiza la lista
    startTransition(() => router.refresh());
  }

  return (
    <div className="py-20 bg-gradient-to-br from-neutral-900 via-purple-900 to-neutral-900">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-neutral-900/60 border border-accent-pink-500/40 px-4 py-1.5 rounded-full mb-4">
            <span className="text-accent-pink-300 text-xs md:text-sm font-black uppercase tracking-[0.2em]">
              🗳️ {t('badge')}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-brand-pink uppercase tracking-wider mb-4">
            {thread.question}
          </h2>
          {thread.description && (
            <p className="text-cyan-300 text-base md:text-lg max-w-3xl mx-auto mb-4">
              {thread.description}
            </p>
          )}
          <MonthlyThreadCountdown endsAt={thread.endsAt} closed={closed} />
        </div>

        {/* Card principal */}
        <div className="bg-neutral-900 border-4 border-accent-pink-500 rounded-2xl p-6 md:p-10 shadow-2xl">
          {/* Form para proponer */}
          {!closed && isLoggedIn && (
            <div className="mb-6 pb-6 border-b border-neutral-800">
              <h3 className="text-sm font-black text-accent-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MdAddCircle />
                {t('yourMove')}
              </h3>
              <MonthlyThreadForm threadId={thread.id} onProposed={handleProposed} />
            </div>
          )}

          {!closed && !isLoggedIn && (
            <div className="mb-6 pb-6 border-b border-neutral-800 bg-neutral-800/50 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-400 flex items-center gap-2">
              <MdLogin className="text-accent-cyan-400" />
              {t('signInToPropose')}
            </div>
          )}

          {/* Lista de propuestas */}
          <div className="mb-6">
            <h3 className="text-sm font-black text-accent-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              {t('proposalsCount', { count: proposals.length })}
            </h3>
            {proposals.length === 0 ? (
              <p className="text-neutral-500 text-center py-8 italic">{t('noProposalsYet')}</p>
            ) : (
              <div className="space-y-2">
                {proposals.map((p, idx) => (
                  <MonthlyThreadProposal
                    key={p.id}
                    proposal={p}
                    rank={idx + 1}
                    isWinner={!!thread.winnerProposalId && thread.winnerProposalId === p.id}
                    closed={closed}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sección de comentarios */}
          <div className="pt-4 border-t border-neutral-800">
            <h3 className="text-sm font-black text-accent-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MdForum />
              {t('commentsCount', { count: totalComments })}
            </h3>
            {topComments.length === 0 ? (
              <p className="text-neutral-500 text-sm italic">{t('noCommentsYet')}</p>
            ) : (
              <div className="space-y-2 mb-3">
                {topComments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-neutral-800/40 border border-neutral-700 rounded-lg p-3 text-sm"
                  >
                    <p className="text-neutral-200 mb-1">{c.content}</p>
                    <p className="text-neutral-500 text-xs">
                      {c.user.name || c.user.username || 'skater'} · {c.likes} 👍 · {c.replyCount}{' '}
                      💬
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-neutral-500 text-xs italic">
              {t('commentsHint')}
            </p>
          </div>
        </div>

        {/* Total stats */}
        <div className="mt-4 text-center text-xs text-neutral-500 uppercase tracking-wider">
          {t('statsLine', {
            proposals: proposals.length,
            votes: proposals.reduce((sum, p) => sum + p.voteCount, 0),
            comments: totalComments,
          })}
        </div>

        {/* Admin hint (solo si admin) */}
        {isAdmin && (
          <div className="mt-4 text-center text-xs text-yellow-400 uppercase tracking-wider">
            {t('adminHint')}
          </div>
        )}
      </div>
    </div>
  );
}