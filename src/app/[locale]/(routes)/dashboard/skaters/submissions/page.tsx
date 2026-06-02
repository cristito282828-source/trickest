"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import SubmissionHistoryCard from '@/components/SubmissionHistoryCard';
import { Button } from '@/components/atoms';

interface Submission {
  id: number;
  videoUrl: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  evaluatedAt: string | null;
  challenge: {
    level: number;
    name: string;
    difficulty: string;
    points: number;
    isBonus: boolean;
  };
  judge: {
    name: string | null;
  } | null;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalScore: number;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function SubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('submissionsPage');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubmissions();
    }
  }, [status]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/submissions/user');
      if (!response.ok) throw new Error('Error loading submissions');

      const data = await response.json();
      setSubmissions(data.submissions || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error:', error);
      setError('Error loading your submissions');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar submissions según el filtro activo
  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true;
    return submission.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent-purple-900 via-accent-blue-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-cyan-400 mx-auto"></div>
          <p className="mt-4 text-accent-cyan-400 font-bold text-xl">{t('loadingHistory')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-accent-purple-500 to-accent-pink-600 p-1 rounded-lg shadow-2xl">
          <div className="bg-neutral-900 rounded-lg p-6">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-purple-400 to-accent-pink-400 uppercase tracking-wider text-center md:text-left">
              {`📹 ${t('title')}`}
            </h1>
            <p className="text-accent-purple-300 mt-2 text-sm md:text-base text-center md:text-left">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-r from-accent-blue-500 to-accent-cyan-500 p-1 rounded-lg">
              <div className="bg-neutral-900 rounded-lg p-4 text-center">
                <p className="text-neutral-400 text-xs uppercase">{t('total')}</p>
                <p className="text-white text-2xl font-black">{stats.total}</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 p-1 rounded-lg">
              <div className="bg-neutral-900 rounded-lg p-4 text-center">
                <p className="text-neutral-400 text-xs uppercase">{t('pending')}</p>
                <p className="text-white text-2xl font-black">{stats.pending}</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-accent-teal-500 p-1 rounded-lg">
              <div className="bg-neutral-900 rounded-lg p-4 text-center">
                <p className="text-neutral-400 text-xs uppercase">{t('approved')}</p>
                <p className="text-white text-2xl font-black">{stats.approved}</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-accent-pink-500 p-1 rounded-lg">
              <div className="bg-neutral-900 rounded-lg p-4 text-center">
                <p className="text-neutral-400 text-xs uppercase">{t('rejected')}</p>
                <p className="text-white text-2xl font-black">{stats.rejected}</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-accent-purple-500 to-accent-pink-500 p-1 rounded-lg">
              <div className="bg-neutral-900 rounded-lg p-4 text-center">
                <p className="text-neutral-400 text-xs uppercase">{t('scoreTotal')}</p>
                <p className="text-white text-2xl font-black">{stats.totalScore}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-accent-cyan-500 to-accent-blue-500 text-white border-2 border-white'
                : 'bg-neutral-800 text-neutral-400 border-2 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {`${t('all')} (${submissions.length})`}
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider transition-all ${
              filter === 'pending'
                ? 'bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 text-white border-2 border-white'
                : 'bg-neutral-800 text-neutral-400 border-2 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {`⏳ ${t('pending')} (${stats?.pending || 0})`}
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider transition-all ${
              filter === 'approved'
                ? 'bg-gradient-to-r from-green-500 to-accent-teal-500 text-white border-2 border-white'
                : 'bg-neutral-800 text-neutral-400 border-2 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {`✅ ${t('approved')} (${stats?.approved || 0})`}
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider transition-all ${
              filter === 'rejected'
                ? 'bg-gradient-to-r from-red-500 to-accent-pink-500 text-white border-2 border-white'
                : 'bg-neutral-800 text-neutral-400 border-2 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {`❌ ${t('rejected')} (${stats?.rejected || 0})`}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-500 border-4 border-red-700 rounded-lg p-4">
            <p className="text-white font-bold text-center">{error}</p>
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div className="max-w-7xl mx-auto">
        {filteredSubmissions.length === 0 ? (
          <div className="bg-gradient-to-r from-neutral-700 to-neutral-800 border-4 border-neutral-600 rounded-lg p-8 text-center">
            <p className="text-neutral-300 text-xl font-bold mb-2">
              {filter === 'all'
                ? t('noSubmissions')
                : t('noSubmissionsFiltered', { filter: t(filter) })}
            </p>
            <p className="text-neutral-400 text-sm mb-4">
              {filter === 'all'
                ? t('startSubmitting')
                : t('changeFilter')}
            </p>
            {filter === 'all' && (
              <Button
                onClick={() => router.push('/dashboard/skaters/tricks')}
                variant="primary"
              >
                {t('viewChallenges')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredSubmissions.map((submission) => (
              <SubmissionHistoryCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
