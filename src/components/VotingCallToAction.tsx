'use client';

import { fadeIn } from '@/utils/motion-transitions';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, Zap } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface VotingStats {
  pending: number;
  communityApproved: number;
  needingVotes: number;
}

export function VotingCallToAction() {
  const [stats, setStats] = useState<VotingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('votingCTA');

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/submissions/auto-approve');
        if (response.ok) {
          const data = await response.json();
          setStats({
            pending: data.stats?.pending || 0,
            communityApproved: data.stats?.communityApproved || 0,
            needingVotes: data.stats?.needingVotes || 0,
          });
        }
      } catch (error) {
        console.error('Error loading voting statistics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          variants={fadeIn('up')}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent-purple-500/20 to-accent-blue-500/20 border border-accent-purple-500/30">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
              </div>
              <span className="text-sm font-medium text-neutral-300">
                {t('systemActive')} • {t('liveVoting')}
              </span>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-accent-purple-400 via-accent-pink-400 to-accent-blue-400 bg-clip-text text-transparent">
            {t('title')}
          </h2>

          <p className="text-xl text-center text-neutral-400 mb-12 max-w-2xl mx-auto">
            {t('description')}
          </p>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-neutral-800/50 border border-neutral-700/50 animate-pulse"
                >
                  <div className="h-10 w-10 bg-neutral-700 rounded-xl mb-4" />
                  <div className="h-8 bg-neutral-700 rounded mb-2" />
                  <div className="h-4 bg-neutral-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Pending Submissions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="group p-6 rounded-2xl bg-gradient-to-br from-accent-purple-500/10 to-accent-purple-600/5 border border-accent-purple-500/20 hover:border-accent-purple-500/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-accent-purple-500/20 text-accent-purple-400 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {stats?.pending || 0}
                </div>
                <div className="text-sm text-neutral-400">
                  {t('pendingSubmissions')}
                </div>
              </motion.div>

              {/* Community Approved */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="group p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 hover:border-green-500/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-green-500/20 text-green-400 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {stats?.communityApproved || 0}
                </div>
                <div className="text-sm text-neutral-400">
                  {t('communityApproved')}
                </div>
              </motion.div>

              {/* Needing Votes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="group p-6 rounded-2xl bg-gradient-to-br from-accent-blue-500/10 to-accent-blue-600/5 border border-accent-blue-500/20 hover:border-accent-blue-500/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-accent-blue-500/20 text-accent-blue-400 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {stats?.needingVotes || 0}
                </div>
                <div className="text-sm text-neutral-400">{t('needYourVote')}</div>
              </motion.div>
            </div>
          )}

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link href="/dashboard/vote">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-accent-purple-500 via-accent-pink-500 to-accent-blue-500 text-white font-semibold text-lg shadow-lg shadow-accent-purple-500/25 hover:shadow-accent-purple-500/40 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  {loading
                    ? t('loading')
                    : stats?.pending
                    ? t('viewSubmissions', { count: stats.pending })
                    : t('goVote')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
