"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import ChallengeCard from '@/components/ChallengeCard';
import SubmitTrickModal from '@/components/SubmitTrickModal';

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

export default function TricksPage() {
  const { data: session } = useSession();
  const t = useTranslations('tricksPage');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/challenges');
      if (!response.ok) throw new Error('Error loading challenges');

      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Error loading challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleSubmitClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setModalOpen(true);
  };

  const handleSubmitSuccess = () => {
    // Refresh challenges to update status
    fetchChallenges();
  };

  // Calculate statistics
  const totalPoints = challenges.reduce((acc, c) => acc + c.points, 0);
  const completedChallenges = challenges.filter(
    c => c.userSubmission?.status === 'approved'
  ).length;
  const earnedPoints = challenges
    .filter(c => c.userSubmission?.status === 'approved')
    .reduce((acc, c) => acc + (c.userSubmission?.score || 0), 0);

  // Separate bonus from the rest
  const regularChallenges = challenges.filter(c => !c.isBonus);
  const bonusChallenge = challenges.find(c => c.isBonus);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent-purple-900 via-accent-blue-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-cyan-400 mx-auto"></div>
          <p className="mt-4 text-accent-cyan-400 font-bold text-xl">{t('loadingChallenges')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-blue-600 p-1 rounded-lg shadow-2xl">
          <div className="bg-neutral-900 rounded-lg p-6">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-blue-400 uppercase tracking-wider text-center md:text-left">
              {`🎯 ${t('title')}`}
            </h1>
            <p className="text-accent-cyan-300 mt-2 text-sm md:text-base text-center md:text-left">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-accent-purple-500 to-accent-pink-500 p-1 rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-4 text-center">
              <p className="text-neutral-400 text-xs uppercase">{t('availablePoints')}</p>
              <p className="text-white text-2xl font-black">{totalPoints}</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-accent-teal-500 p-1 rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-4 text-center">
              <p className="text-neutral-400 text-xs uppercase">{t('completed')}</p>
              <p className="text-white text-2xl font-black">
                {completedChallenges} / {challenges.length}
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 p-1 rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-4 text-center">
              <p className="text-neutral-400 text-xs uppercase">{t('pointsEarned')}</p>
              <p className="text-white text-2xl font-black">{earnedPoints}</p>
            </div>
          </div>
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

      {/* Regular Challenges Grid */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-6">
          {`📋 ${t('levels')}`}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onSubmitClick={() => handleSubmitClick(challenge)}
            />
          ))}
        </div>
      </div>

      {/* Bonus Challenge */}
      {bonusChallenge && (
        <div className="max-w-7xl mx-auto mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-6">
            {`🌟 ${t('bonusLevel')}`}
          </h2>
          <div className="max-w-2xl mx-auto">
            <ChallengeCard
              challenge={bonusChallenge}
              onSubmitClick={() => handleSubmitClick(bonusChallenge)}
            />
          </div>
        </div>
      )}

      {/* Submit Modal */}
      <SubmitTrickModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        challenge={selectedChallenge}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  );
}
