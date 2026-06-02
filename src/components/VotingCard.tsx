'use client';

import { motion } from 'framer-motion';
import {
  Clock,
  ExternalLink,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface VotingCardProps {
  submission: {
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
  };
  onVote: (
    submissionId: number,
    voteType: 'upvote' | 'downvote'
  ) => Promise<void>;
  userVote?: 'upvote' | 'downvote' | null;
}

export default function VotingCard({
  submission,
  onVote,
  userVote,
}: VotingCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [localVote, setLocalVote] = useState(userVote);
  const t = useTranslations('votingCard');

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return;

    setIsVoting(true);
    try {
      await onVote(submission.id, voteType);
      setLocalVote(voteType);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  const videoId = getYouTubeVideoId(submission.videoUrl);
  const totalVotes = submission.upvotes + submission.downvotes;
  const positivePercentage =
    totalVotes > 0 ? Math.round((submission.upvotes / totalVotes) * 100) : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/20 text-green-400';
      case 'medium':
        return 'bg-accent-yellow-500/20 text-accent-yellow-400';
      case 'hard':
        return 'bg-accent-orange-500/20 text-accent-orange-400';
      case 'expert':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-neutral-500/20 text-neutral-400';
    }
  };

  const needsVotes = Math.max(0, 10 - totalVotes);
  const isCloseToApproval = totalVotes >= 10 && positivePercentage >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-card border border-neutral-800 rounded-lg overflow-hidden hover:border-accent-cyan-500/50 transition-all"
    >
      {/* Video Preview */}
      <div className="relative aspect-video bg-black">
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Submission video"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-400">{t('videoNotAvailable')}</p>
          </div>
        )}

        {/* Status Badge */}
        {isCloseToApproval && (
          <div className="absolute top-2 right-2 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {t('closeToApproval')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Challenge Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">
                {submission.challenge.name}
              </h3>
              <p className="text-sm text-neutral-400 line-clamp-2">
                {submission.challenge.description}
              </p>
            </div>
            <span className="text-2xl font-bold text-accent-cyan-400">
              {submission.challenge.points}pts
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-accent-cyan-500/20 text-accent-cyan-400 rounded text-xs font-medium">
              {t('level', { level: submission.challenge.level })}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                submission.challenge.difficulty
              )}`}
            >
              {submission.challenge.difficulty}
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
          {submission.user.photo ? (
            <img
              src={submission.user.photo}
              alt={submission.user.name || t('user')}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan-500 to-accent-blue-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {(submission.user.name || submission.user.email)
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {submission.user.name || t('user')}
            </p>
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <Clock className="w-3 h-3" />
              {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
          <a
            href={submission.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-cyan-400 hover:text-accent-cyan-300 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* Voting Stats */}
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${positivePercentage}%` }}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-accent-cyan-400"
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-500/10 rounded p-2">
              <p className="text-2xl font-bold text-green-400">
                {submission.upvotes}
              </p>
              <p className="text-xs text-neutral-400">{t('upvotes')}</p>
            </div>
            <div className="bg-red-500/10 rounded p-2">
              <p className="text-2xl font-bold text-red-400">
                {submission.downvotes}
              </p>
              <p className="text-xs text-neutral-400">{t('downvotes')}</p>
            </div>
            <div className="bg-accent-cyan-500/10 rounded p-2">
              <p className="text-2xl font-bold text-accent-cyan-400">
                {positivePercentage}%
              </p>
              <p className="text-xs text-neutral-400">{t('approval')}</p>
            </div>
          </div>

          {/* Needs Votes Warning */}
          {needsVotes > 0 && (
            <div className="bg-accent-yellow-500/10 border border-accent-yellow-500/30 rounded p-2 text-center">
              <p className="text-sm text-accent-yellow-400">
                {needsVotes === 1
                  ? t('needsVotes', { count: needsVotes })
                  : t('needsVotesPlural', { count: needsVotes })}
              </p>
            </div>
          )}
        </div>

        {/* Voting Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVote('upvote')}
            disabled={isVoting || localVote === 'upvote'}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              localVote === 'upvote'
                ? 'bg-green-500 text-white'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsUp
              className={`w-5 h-5 ${
                localVote === 'upvote' ? 'fill-white' : ''
              }`}
            />
            {t('approve')}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVote('downvote')}
            disabled={isVoting || localVote === 'downvote'}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              localVote === 'downvote'
                ? 'bg-red-500 text-white'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsDown
              className={`w-5 h-5 ${
                localVote === 'downvote' ? 'fill-white' : ''
              }`}
            />
            {t('reject')}
          </motion.button>
        </div>

        {/* Already Voted Message */}
        {localVote && (
          <p className="text-center text-sm text-neutral-400">
            {t('alreadyVoted')}
          </p>
        )}
      </div>
    </motion.div>
  );
}
