'use client';

import VotingCard from '@/components/VotingCard';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, TrendingUp, Users, Vote } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Submission {
  id: number;
  videoUrl: string;
  submittedAt: string;
  upvotes: number;
  downvotes: number;
  voteCount: number;
  user: {
    name: string | null;
    email: string;
    photo: string | null;
  };
  challenge: {
    name: string;
    level: number;
    difficulty: string;
    points: number;
    description: string;
  };
  stats?: {
    totalVotes: number;
    positivePercentage: number;
    needsVotes: number;
    isCloseToApproval: boolean;
  };
}

export default function VotePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('votePage');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const fetchSubmissions = async (offset = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/submissions/to-vote?limit=10&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error('Error loading submissions');
      }

      const data = await response.json();

      if (offset === 0) {
        setSubmissions(data.submissions);
      } else {
        setSubmissions((prev) => [...prev, ...data.submissions]);
      }

      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubmissions();
    }
  }, [status]);

  const handleVote = async (
    submissionId: number,
    voteType: 'upvote' | 'downvote'
  ) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error voting');
      }

      // Remove the submission from the list after voting
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
      }));

      // If few submissions remain, load more
      if (submissions.length <= 3 && pagination.hasMore) {
        fetchSubmissions(pagination.offset + pagination.limit);
      }
    } catch (err) {
      console.error('Error voting:', err);
      alert(err instanceof Error ? err.message : 'Error voting');
    }
  };

  const loadMore = () => {
    if (!isLoading && pagination.hasMore) {
      fetchSubmissions(pagination.offset + pagination.limit);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent-cyan-400 mx-auto mb-4" />
          <p className="text-neutral-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-accent-cyan-500/20 rounded-lg">
              <Vote className="w-8 h-8 text-accent-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-cyan-400 to-accent-blue-500 bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <p className="text-neutral-400">
                {t('subtitle')}
              </p>
            </div>
          </div>

          {/* Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-surface-card border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-blue-500/20 rounded">
                  <TrendingUp className="w-5 h-5 text-accent-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {pagination.total}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {t('pendingSubmissions')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-card border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {
                      submissions.filter((s) => s.upvotes + s.downvotes >= 10)
                        .length
                    }
                  </p>
                  <p className="text-sm text-neutral-400">{t('readyForDecision')}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-card border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-purple-500/20 rounded">
                  <Vote className="w-5 h-5 text-accent-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {submissions.length}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {t('availableToVote')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-accent-cyan-500/10 border border-accent-cyan-500/30 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-accent-cyan-300">
                <p className="font-semibold mb-1">{t('howItWorks')}</p>
                <ul className="space-y-1 text-accent-cyan-400/80">
                  <li>
                    • 👍 {t('rule1')}
                  </li>
                  <li>• 👎 {t('rule2')}</li>
                  <li>
                    • {t('rule3')}
                  </li>
                  <li>• {t('rule4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Submissions Grid */}
        {isLoading && submissions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-accent-cyan-400 mx-auto mb-4" />
              <p className="text-neutral-400">{t('loadingSubmissions')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-semibold mb-2">Error</p>
            <p className="text-neutral-400">{error}</p>
            <button
              onClick={() => fetchSubmissions(0)}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-surface-card border border-neutral-800 rounded-lg p-12 text-center">
            <Vote className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-400 mb-2">
              {t('allCaughtUp')}
            </h3>
            <p className="text-neutral-500">
              {t('noSubmissionsAvailable')}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {submissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <VotingCard submission={submission} onVote={handleVote} />
                </motion.div>
              ))}
            </div>

            {/* Load More Button */}
            {pagination.hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-6 py-3 bg-accent-cyan-500/20 hover:bg-accent-cyan-500/30 text-accent-cyan-400 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('loading')}
                    </>
                  ) : (
                    <>
                      {t('loadMore')}
                      <TrendingUp className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
