"use client";

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { MdArrowBack, MdPlayArrow, MdVideoLibrary, MdStars, MdEmojiEvents, MdLock } from 'react-icons/md';
import SubmitTrickModal from '@/components/SubmitTrickModal';
import VideoModal from '@/components/VideoModal';

interface Challenge {
  id: number;
  level: number;
  name: string;
  description: string;
  demoVideoUrl: string;
  isBonus: boolean;
  difficulty: string;
  points: number;
  userSubmission?: {
    id: number;
    status: string;
    score: number | null;
    videoUrl: string;
  } | null;
}

interface PageProps {
  params: { slug: string; locale: string };
}

export default function TrickDetailPage({ params }: PageProps) {
  const { slug } = params;
  const slugDecoded = decodeURIComponent(slug);
  const { data: session, status } = useSession();
  const t = useTranslations('tricksPage');

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/challenges');
        if (!response.ok) throw new Error('Error loading challenge');

        const data = await response.json();
        const found = (data.challenges || []).find(
          (c: Challenge) => c.name.toLowerCase() === slugDecoded.toLowerCase()
        );

        if (!found) {
          setError('Challenge not found');
        } else {
          setChallenge(found);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error loading challenge');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [slugDecoded]);

  const handleSubmitSuccess = () => {
    setSubmitModalOpen(false);
  };

  const handleOpenVideoModal = () => {
    if (challenge?.demoVideoUrl) {
      setVideoUrl(challenge.demoVideoUrl);
      setVideoTitle(challenge.name);
      setVideoModalOpen(true);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-cyan-400 mx-auto"></div>
          <p className="mt-4 text-accent-cyan-400 font-bold text-xl">{t('loadingChallenges')}</p>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-500 border-4 border-red-700 rounded-lg p-6 text-center">
            <p className="text-white font-bold text-xl mb-4">{error || 'Challenge not found'}</p>
            <Link
              href="/dashboard/skaters/tricks"
              className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-black py-2 px-6 rounded-lg border-2 border-white uppercase tracking-wider text-sm"
            >
              ← {t('backToList')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-500',
      medium: 'bg-yellow-500',
      hard: 'bg-red-500',
      expert: 'bg-purple-500',
    };
    return colors[difficulty] || colors.easy;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/dashboard/skaters/tricks"
            className="inline-flex items-center gap-2 text-accent-cyan-400 hover:text-accent-cyan-300 font-bold uppercase tracking-wider text-sm transition-colors"
          >
            <MdArrowBack size={20} />
            {t('backToList')}
          </Link>
        </div>

        {/* Challenge Card */}
        <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-1 rounded-lg shadow-2xl mb-6">
          <div className="bg-neutral-900 rounded-lg p-6 md:p-8">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-black text-accent-cyan-400 uppercase tracking-wider text-center mb-4">
              {challenge.isBonus && '⭐ '}
              {challenge.name}
            </h1>

            {/* Difficulty Badge */}
            <div className="flex justify-center mb-4">
              <span
                className={`${getDifficultyColor(challenge.difficulty)} text-white px-4 py-2 rounded-full font-black uppercase tracking-wider text-sm shadow-lg`}
              >
                {challenge.difficulty} • {challenge.points} pts
              </span>
            </div>

            {/* Description */}
            <p className="text-neutral-300 text-base md:text-lg text-center mb-6">
              {challenge.description}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col md:flex-row gap-3 justify-center">
              {(() => {
                const submission = (challenge as any).userSubmission;
                if (submission) {
                  const status = submission.status as string;
                  let btnLabel = t('evaluating') || 'EN CALIFICACIÓN';
                  let btnClass = 'bg-yellow-500 cursor-not-allowed';
                  let btnIcon = <MdStars size={24} />;
                  if (status === 'approved') {
                    btnLabel = t('approved') || 'APROBADO';
                    btnClass = 'bg-green-500 cursor-not-allowed';
                    btnIcon = <MdEmojiEvents size={24} />;
                  } else if (status === 'rejected') {
                    btnLabel = t('rejected') || 'RECHAZADO';
                    btnClass = 'bg-red-500 cursor-not-allowed';
                    btnIcon = <MdLock size={24} />;
                  }
                  return (
                    <div
                      className={`${btnClass} text-white font-black text-lg py-3 px-8 rounded-xl border-4 border-white uppercase tracking-wider shadow-2xl inline-flex items-center justify-center gap-2`}
                    >
                      {btnIcon}
                      {btnLabel}
                      {submission.score != null && ` • ${submission.score} pts`}
                    </div>
                  );
                }
                if (session?.user) {
                  return (
                    <button
                      type="button"
                      onClick={() => setSubmitModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-black text-lg py-3 px-8 rounded-xl border-4 border-white uppercase tracking-wider shadow-2xl transform hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <MdPlayArrow size={24} />
                      {t('startChallenge')}
                    </button>
                  );
                }
                return (
                  <Link
                    href="/api/auth/signin"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-black text-lg py-3 px-8 rounded-xl border-4 border-white uppercase tracking-wider shadow-2xl transform hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
                  >
                    <MdPlayArrow size={24} />
                    {t('startChallenge')}
                  </Link>
                );
              })()}

              {challenge.demoVideoUrl && (
                <button
                  type="button"
                  onClick={handleOpenVideoModal}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-black py-3 px-6 rounded-lg border-4 border-white uppercase tracking-wider text-sm shadow-lg transform hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
                >
                  <MdVideoLibrary size={20} />
                  {t('watchDemo')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      <SubmitTrickModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        challenge={challenge}
        onSubmitSuccess={handleSubmitSuccess}
      />

      {/* Video Modal */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={videoUrl}
        title={videoTitle}
      />
    </div>
  );
}
