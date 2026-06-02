"use client";

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms';

interface Submission {
  id: number;
  userId: string;
  challengeId: number;
  videoUrl: string;
  status: string;
  submittedAt: string;
  evaluatedAt?: string;
  score?: number;
  feedback?: string;
  user: {
    name: string;
    email: string;
  };
  challenge: {
    name: string;
    level: number;
    difficulty: string;
    points: number;
  };
}

type TabType = 'pending' | 'evaluated';

export default function JudgeEvaluatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('judgePage');
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [notification, setNotification] = useState('');

  // Check if user is judge or admin
  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = session?.user?.role;
      if (userRole !== 'judge' && userRole !== 'admin') {
        router.push('/dashboard/skaters/profile');
      }
    }
  }, [status, session, router]);

  // Load submissions based on active tab
  useEffect(() => {
    if (status === 'authenticated') {
      if (activeTab === 'pending') {
        fetchPendingSubmissions();
      } else {
        fetchEvaluatedSubmissions();
      }
    }
  }, [status, activeTab]);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching pending submissions...');
      const response = await fetch('/api/submissions/pending');
      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.message || errorData.error || 'Error loading submissions');
      }

      const data = await response.json();
      console.log('✅ Data received:', data);
      console.log('📊 Submissions count:', data.submissions?.length || 0);
      setSubmissions(data.submissions || []);
    } catch (error: any) {
      console.error('❌ Error fetching submissions:', error);
      console.error('Error message:', error.message);
      setNotification(`❌ ${t('errorEvaluating')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluatedSubmissions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching evaluated submissions...');
      const response = await fetch('/api/submissions/evaluated');
      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.message || errorData.error || 'Error loading evaluated submissions');
      }

      const data = await response.json();
      console.log('✅ Data received:', data);
      console.log('📊 Evaluated submissions count:', data.submissions?.length || 0);
      setSubmissions(data.submissions || []);
    } catch (error: any) {
      console.error('❌ Error fetching evaluated submissions:', error);
      console.error('Error message:', error.message);
      setNotification(`❌ ${t('errorEvaluating')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (submissionId: number, approved: boolean) => {
    try {
      setEvaluating(submissionId);
      const response = await fetch('/api/submissions/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          status: approved ? 'approved' : 'rejected',
          score: approved ? score : 0,
          feedback,
          evaluatedBy: session?.user?.email,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (typeof data?.message === 'string' && data.message) ||
          (typeof data?.error === 'string' && data.error) ||
          `Error ${response.status}: ${response.statusText || 'Error evaluating'}`;
        throw new Error(message);
      }

      setNotification(`✅ ${approved ? t('submissionApproved') : t('submissionRejected')}`);
      setScore(0);
      setFeedback('');
      // Reload current list
      if (activeTab === 'pending') {
        fetchPendingSubmissions();
      } else {
        fetchEvaluatedSubmissions();
      }

      setTimeout(() => setNotification(''), 3000);
    } catch (error: any) {
      console.error('Error:', error);
      const message =
        (typeof error?.message === 'string' && error.message) ||
        t('errorEvaluating') ||
        'Error evaluating submission';
      setNotification(`❌ ${message}`);
    } finally {
      setEvaluating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent-purple-900 via-accent-blue-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-cyan-400 mx-auto"></div>
          <p className="mt-4 text-accent-cyan-400 font-bold text-xl">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-600 p-1 rounded-lg shadow-2xl">
          <div className="bg-neutral-900 rounded-lg p-6">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow-400 to-accent-orange-400 uppercase tracking-wider text-center md:text-left">
              {`⚖️ ${t('title')}`}
            </h1>
            <p className="text-accent-yellow-300 mt-2 text-sm md:text-base text-center md:text-left">
              {session?.user?.email || t('evaluate')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-6 rounded-lg font-black uppercase tracking-wider transition-all ${
              activeTab === 'pending'
                ? 'bg-accent-yellow-500 hover:bg-accent-yellow-600 text-white border-4 border-white shadow-2xl shadow-accent-yellow-500/50'
                : 'bg-neutral-800 text-neutral-400 border-4 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {`⏳ ${t('pendingTab')}`}
          </button>
          <button
            onClick={() => setActiveTab('evaluated')}
            className={`flex-1 py-3 px-6 rounded-lg font-black uppercase tracking-wider transition-all ${
              activeTab === 'evaluated'
                ? 'bg-accent-purple-600 hover:bg-accent-purple-700 text-white border-4 border-white shadow-2xl shadow-accent-purple-500/50'
                : 'bg-neutral-800 text-neutral-400 border-4 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {`✅ ${t('evaluatedTab')}`}
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`max-w-7xl mx-auto mb-6 animate-pulse ${
          notification.includes("✅") ? "bg-green-500" : "bg-red-500"
        } border-4 border-white rounded-lg p-4 shadow-2xl`}>
          <p className="text-white font-bold text-center text-sm md:text-base">{notification}</p>
        </div>
      )}

      {/* Submissions List */}
      <div className="max-w-7xl mx-auto">
        {submissions.length === 0 ? (
          <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 border-4 border-neutral-700 rounded-lg p-8 text-center">
            <p className="text-neutral-400 text-xl font-bold">
              {activeTab === 'pending'
                ? `✅ ${t('noPending')}`
                : `📭 ${t('noEvaluated')}`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 p-1 rounded-lg shadow-2xl"
              >
                <div className="bg-neutral-900 rounded-lg p-6">
                  {/* Skater and challenge info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-accent-cyan-400 font-bold text-sm mb-1">{t('skater')}</p>
                      <p className="text-white text-lg font-black">{submission.user.name}</p>
                      <p className="text-neutral-400 text-sm">{submission.user.email}</p>
                    </div>
                    <div>
                      <p className="text-accent-purple-400 font-bold text-sm mb-1">{t('challenge')}</p>
                      <p className="text-white text-lg font-black">
                        {t('level')} {submission.challenge.level}: {submission.challenge.name}
                      </p>
                      <p className="text-neutral-400 text-sm">
                        {submission.challenge.difficulty} • {submission.challenge.points} pts
                      </p>
                    </div>
                  </div>

                  {/* Video */}
                  <div className="mb-4">
                    <p className="text-accent-yellow-400 font-bold text-sm mb-2">{t('video')}</p>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden border-4 border-neutral-700">
                      <iframe
                        width="100%"
                        height="100%"
                        src={submission.videoUrl.replace('watch?v=', 'embed/')}
                        title="Submission video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>

                  {/* Evaluation form or Result */}
                  {activeTab === 'pending' ? (
                    // Pending tab - Evaluation form
                    evaluating === submission.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-accent-cyan-400 font-bold mb-2 uppercase text-sm">
                            {t('scoreLabel')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
                            className="w-full bg-neutral-800 border-4 border-neutral-600 rounded-lg py-3 px-4 text-white focus:border-accent-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-accent-cyan-400 font-bold mb-2 uppercase text-sm">
                            {t('comments')}
                          </label>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={3}
                            className="w-full bg-neutral-800 border-4 border-neutral-600 rounded-lg py-3 px-4 text-white focus:border-accent-cyan-500 focus:outline-none"
                            placeholder={t('commentsPlaceholder')}
                          />
                        </div>
                        <div className="flex gap-4">
                          <Button
                            onClick={() => handleEvaluate(submission.id, true)}
                            variant="success"
                            size="lg"
                            fullWidth
                          >
                            {`✅ ${t('approve')}`}
                          </Button>
                          <Button
                            onClick={() => handleEvaluate(submission.id, false)}
                            variant="danger"
                            size="lg"
                            fullWidth
                          >
                            {`❌ ${t('reject')}`}
                          </Button>
                        </div>
                        <button
                          onClick={() => setEvaluating(null)}
                          className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg uppercase text-sm"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEvaluating(submission.id)}
                        className="w-full bg-accent-yellow-500 hover:bg-accent-yellow-600 text-white font-black py-4 px-6 rounded-lg border-4 border-white uppercase tracking-wider text-lg shadow-2xl transform hover:scale-105 transition-all"
                      >
                        {`📝 ${t('evaluate')}`}
                      </button>
                    )
                  ) : (
                    // Evaluated tab - Show result
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-neutral-400 text-sm uppercase font-bold mb-1">{t('status')}</p>
                          <div className={`inline-block px-4 py-2 rounded-lg border-4 font-black uppercase ${
                            submission.status === 'approved'
                              ? 'bg-green-500 border-green-300 text-white'
                              : 'bg-red-500 border-red-300 text-white'
                          }`}>
                            {submission.status === 'approved' ? `✅ ${t('approved')}` : `❌ ${t('rejected')}`}
                          </div>
                        </div>
                        <div>
                          <p className="text-neutral-400 text-sm uppercase font-bold mb-1">{t('score')}</p>
                          <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow-400 to-accent-orange-400">
                            {submission.score || 0}
                          </p>
                        </div>
                      </div>
                      {submission.feedback && (
                        <div>
                          <p className="text-neutral-400 text-sm uppercase font-bold mb-2">{t('comments')}</p>
                          <div className="bg-neutral-800 border-4 border-neutral-700 rounded-lg p-4">
                            <p className="text-white">{submission.feedback}</p>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-neutral-400 text-sm uppercase font-bold mb-1">{t('evaluatedOn')}</p>
                        <p className="text-white font-bold">
                          {submission.evaluatedAt ? new Date(submission.evaluatedAt).toLocaleString('en-US') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
