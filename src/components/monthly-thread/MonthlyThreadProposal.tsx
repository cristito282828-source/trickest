'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { MdThumbUp, MdEmojiEvents } from 'react-icons/md';

export interface ProposalClient {
  id: number;
  text: string;
  voteCount: number;
  createdAt: string;
  userVoted: boolean;
  user: { name: string | null; photo: string | null; username: string | null };
}

interface MonthlyThreadProposalProps {
  proposal: ProposalClient;
  rank: number; // 1, 2, 3, etc.
  isWinner: boolean;
  closed: boolean;
}

const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function MonthlyThreadProposal({
  proposal,
  rank,
  isWinner,
  closed,
}: MonthlyThreadProposalProps) {
  const t = useTranslations('monthlyThread');
  const { data: session } = useSession();
  const [voted, setVoted] = useState(proposal.userVoted);
  const [voteCount, setVoteCount] = useState(proposal.voteCount);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!session?.user;

  async function handleVote() {
    if (!isLoggedIn) return;
    if (isVoting) return;

    // Optimistic update
    const prevVoted = voted;
    const prevCount = voteCount;
    setError(null);
    setIsVoting(true);
    setVoted(!voted);
    setVoteCount(voted ? voteCount - 1 : voteCount + 1);

    try {
      const res = await fetch(`/api/monthly-thread/${proposal.id}/vote`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      // Sincronizar con respuesta del servidor (puede incluir más votes de otros usuarios)
      setVoteCount(data.data?.voteCount ?? (voted ? voteCount - 1 : voteCount + 1));
      setVoted(data.data?.voted ?? !voted);
    } catch (err: any) {
      // Rollback
      setVoted(prevVoted);
      setVoteCount(prevCount);
      setError(err?.message || t('errorVoting'));
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsVoting(false);
    }
  }

  const rankBadge = RANK_EMOJI[rank];
  const isTop3 = rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`flex items-center gap-3 bg-neutral-900 border-2 rounded-xl p-3 transition-all ${
        isWinner
          ? 'border-yellow-400 shadow-lg shadow-yellow-400/20'
          : isTop3
            ? 'border-accent-cyan-400/60'
            : 'border-neutral-800'
      }`}
    >
      {/* Rank emoji */}
      <div className="flex-shrink-0 w-8 text-center text-2xl">
        {rankBadge || <span className="text-neutral-500 text-sm font-bold">#{rank}</span>}
      </div>

      {/* Vote button + count */}
      <button
        type="button"
        onClick={handleVote}
        disabled={!isLoggedIn || closed || isVoting}
        aria-label={t('vote')}
        className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-lg border-2 transition-all ${
          !isLoggedIn
            ? 'border-neutral-700 text-neutral-600 cursor-not-allowed'
            : voted
              ? 'bg-accent-cyan-500 border-white text-neutral-900 scale-105'
              : closed
                ? 'border-neutral-700 text-neutral-500 cursor-not-allowed'
                : 'border-accent-cyan-400/50 text-accent-cyan-400 hover:border-accent-cyan-400 hover:bg-accent-cyan-400/10 cursor-pointer'
        }`}
      >
        <MdThumbUp className={voted ? 'text-base' : 'text-lg'} />
        <span className="text-xs font-black tabular-nums">{voteCount}</span>
      </button>

      {/* Text + author */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm md:text-base truncate">{proposal.text}</p>
        <p className="text-neutral-500 text-xs truncate">
          {proposal.user.name || proposal.user.username || 'skater'}
        </p>
        {error && (
          <p className="text-red-400 text-xs mt-1" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Winner badge */}
      {isWinner && (
        <div className="flex-shrink-0 flex items-center gap-1 text-yellow-400 text-xs font-black uppercase">
          <MdEmojiEvents className="text-lg" />
          {t('winner')}
        </div>
      )}
    </motion.div>
  );
}