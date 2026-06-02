'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, TrendingUp, ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

interface User {
  name: string | null;
  photo: string | null;
  username: string | null;
}

interface Comment {
  id: number;
  content: string;
  likes: number;
  dislikes: number;
  isPinned: boolean;
  createdAt: string;
  user: User;
}

interface TopCommentPreviewProps {
  spotId: number;
  spotName: string;
  onViewAllComments: () => void;
}

export default function TopCommentPreview({
  spotId,
  spotName,
  onViewAllComments,
}: TopCommentPreviewProps) {
  const { data: session } = useSession();
  const t = useTranslations('comments');
  const [topComment, setTopComment] = useState<Comment | null>(null);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopComment = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/spots/${spotId}/top-comment`);
        const data = await response.json();

        if (data.success && data.data.hasComments) {
          setTopComment(data.data.comment);
          setTotalComments(data.data.totalComments);
        }
      } catch (error) {
        console.error('Error fetching top comment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopComment();
  }, [spotId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('minAgo', { count: diffMins });
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('daysAgo', { count: diffDays });
    return date.toLocaleDateString('en-US');
  };

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-neutral-200">
        <div className="flex items-center justify-center py-2">
          <div className="w-4 h-4 animate-spin border-2 border-accent-cyan-400 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // No comments
  if (!topComment) {
    return (
      <div className="mt-3 pt-3 border-t border-neutral-200">
        <button
          onClick={onViewAllComments}
          className="w-full py-2 px-3 bg-accent-cyan-600 hover:bg-accent-cyan-700 border-2 border-accent-cyan-400 rounded-lg text-white font-bold transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          {t('beFirstToCommentBtn')}
        </button>
      </div>
    );
  }

  // Has comments - show top comment
  return (
    <div className="mt-3 pt-3 border-t border-neutral-200">
      {/* Preview header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 text-sm">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="font-bold text-green-600">
            {t('topComment')}
          </span>
        </div>
        <span className="text-xs text-neutral-500">
          {totalComments === 1 ? t('commentCount', { count: totalComments }) : t('commentsCount', { count: totalComments })}
        </span>
      </div>

      {/* Top comment preview */}
      <div className="bg-neutral-50 border border-neutral-300 rounded-lg p-3">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          {topComment.user.photo ? (
            <img
              src={topComment.user.photo}
              alt={topComment.user.name || 'User'}
              className="w-6 h-6 rounded-full border border-neutral-300 object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-cyan-400 to-accent-purple-600 flex items-center justify-center text-white font-bold text-xs">
              {topComment.user.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-neutral-900 truncate">
              {topComment.user.name || 'User'}
            </p>
            <p className="text-[10px] text-neutral-500">
              {formatDate(topComment.createdAt)}
            </p>
          </div>
        </div>

        {/* Content (truncated) */}
        <p className="text-xs text-neutral-700 line-clamp-2 mb-2">
          {topComment.content.length > 100
            ? topComment.content.substring(0, 100) + '...'
            : topComment.content}
        </p>

        {/* Likes badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-green-500 font-bold">❤️ {topComment.likes}</span>
            {topComment.dislikes > 0 && (
              <span className="text-red-400 font-bold">👎 {topComment.dislikes}</span>
            )}
          </div>

          {/* "View all" button */}
          <button
            onClick={onViewAllComments}
            className="text-xs font-bold text-accent-cyan-600 hover:text-accent-cyan-700 flex items-center gap-1"
          >
            {t('viewAllLabel')}
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Full button */}
      <button
        onClick={onViewAllComments}
        className="w-full mt-2 py-2 px-3 bg-neutral-100 hover:bg-accent-cyan-50 border-2 border-neutral-300 hover:border-accent-cyan-400 rounded-lg font-bold text-neutral-700 hover:text-accent-cyan-700 transition-all text-sm flex items-center justify-center gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        {t('viewAllCommentsCount', { count: totalComments })}
      </button>

      {!session && (
        <p className="text-[10px] text-neutral-500 text-center mt-1">
          🔒 {t('signInToCommentMsg')}
        </p>
      )}
    </div>
  );
}
