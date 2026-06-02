"use client";

import { useState } from 'react';
import { getEmbedUrl } from '@/lib/youtube';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms';

interface UserSubmission {
  id: number;
  status: string;
  score: number | null;
  videoUrl: string;
  submittedAt: Date;
  feedback: string | null;
}

interface Challenge {
  id: number;
  level: number;
  name: string;
  description: string;
  demoVideoUrl: string;
  isBonus: boolean;
  difficulty: string;
  points: number;
  userSubmission: UserSubmission | null;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onSubmitClick: () => void;
}

export default function ChallengeCard({ challenge, onSubmitClick }: ChallengeCardProps) {
  const [showDescription, setShowDescription] = useState(false);
  const t = useTranslations('challengeCard');

  // Determine gradient color based on difficulty
  const getBorderGradient = () => {
    if (challenge.isBonus) {
      return 'from-accent-pink-500 via-accent-purple-500 to-accent-cyan-500 animate-gradient';
    }
    switch (challenge.difficulty) {
      case 'easy': return 'from-accent-cyan-500 to-accent-blue-500';
      case 'medium': return 'from-accent-purple-500 to-accent-pink-500';
      case 'hard': return 'from-accent-orange-500 to-red-500';
      case 'expert': return 'from-accent-yellow-500 to-accent-orange-500';
      default: return 'from-neutral-500 to-neutral-700';
    }
  };

  // Determine difficulty badge
  const getDifficultyBadge = () => {
    const colors = {
      easy: 'bg-accent-cyan-500',
      medium: 'bg-accent-purple-500',
      hard: 'bg-accent-orange-500',
      expert: 'bg-accent-yellow-500',
    };
    const color = colors[challenge.difficulty as keyof typeof colors] || 'bg-neutral-500';

    return (
      <span className={`${color} text-white px-3 py-1 rounded-full text-xs font-bold uppercase`}>
        {challenge.difficulty}
      </span>
    );
  };

  // Determine status and button
  const renderActionButton = () => {
    const submission = challenge.userSubmission;

    if (!submission) {
      // Has not submitted
      return (
        <button
          onClick={onSubmitClick}
          className="w-full bg-accent-yellow-500 hover:bg-accent-yellow-600 text-white font-black py-3 px-6 rounded-lg border-4 border-white uppercase tracking-wider shadow-2xl transform hover:scale-105 transition-all"
        >
          {t('submitYourVideo')}
        </button>
      );
    }

    if (submission.status === 'pending') {
      // Pending evaluation
      return (
        <div className="w-full bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 p-1 rounded-lg animate-pulse">
          <div className="bg-neutral-900 rounded-lg py-3 px-6 text-center">
            <p className="text-accent-yellow-300 font-black uppercase tracking-wider">
              {t('pendingEvaluation')}
            </p>
          </div>
        </div>
      );
    }

    if (submission.status === 'approved') {
      // Approved
      return (
        <div className="w-full bg-gradient-to-r from-green-500 to-accent-teal-500 p-1 rounded-lg">
          <div className="bg-neutral-900 rounded-lg py-3 px-6 text-center">
            <p className="text-green-300 font-black uppercase tracking-wider">
              {t('approvedScore', { score: submission.score || 0 })}
            </p>
          </div>
        </div>
      );
    }

    if (submission.status === 'rejected') {
      // Rejected - can try again
      return (
        <div className="space-y-2">
          <div className="w-full bg-gradient-to-r from-red-500 to-accent-pink-500 p-1 rounded-lg">
            <div className="bg-neutral-900 rounded-lg py-2 px-4 text-center">
              <p className="text-red-300 font-bold uppercase text-sm">
                {t('rejected')}
              </p>
            </div>
          </div>
          <Button
            onClick={onSubmitClick}
            variant="primary"
            size="md"
            fullWidth
            arcadeBorder
          >
            {t('tryAgain')}
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`bg-gradient-to-r ${getBorderGradient()} p-1 rounded-lg shadow-2xl`}>
      <div className="bg-neutral-900 rounded-lg overflow-hidden">
        {/* Level Badge */}
        <div className="relative">
          <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-80 px-3 py-1 rounded-full">
            <p className="text-white font-black text-sm uppercase">
              {challenge.isBonus ? t('bonus') : t('level', { level: challenge.level })}
            </p>
          </div>

          {/* Status Badge */}
          {challenge.userSubmission && (
            <div className="absolute top-2 right-2 z-10">
              {challenge.userSubmission.status === 'pending' && (
                <span className="bg-accent-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold uppercase animate-pulse">
                  {t('pending')}
                </span>
              )}
              {challenge.userSubmission.status === 'approved' && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                  {t('approved')}
                </span>
              )}
              {challenge.userSubmission.status === 'rejected' && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                  {t('rejected')}
                </span>
              )}
            </div>
          )}

          {/* Demo Video */}
          <div className="aspect-video bg-black">
            <iframe
              width="100%"
              height="100%"
              src={getEmbedUrl(challenge.demoVideoUrl)}
              title={`${challenge.name} demo`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Challenge Name */}
          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-3">
            {challenge.name}
          </h3>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {getDifficultyBadge()}
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
              {challenge.points} pts
            </span>
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className={`text-neutral-300 text-sm ${!showDescription && 'line-clamp-2'}`}>
              {challenge.description}
            </p>
            {challenge.description.length > 100 && (
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="text-accent-cyan-400 text-xs font-bold mt-1 hover:text-accent-cyan-300"
              >
                {showDescription ? `▲ ${t('showLess')}` : `▼ ${t('showMore')}`}
              </button>
            )}
          </div>

          {/* Action Button */}
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
}
