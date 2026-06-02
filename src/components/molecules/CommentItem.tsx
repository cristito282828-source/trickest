'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ThumbsUp, ThumbsDown, Trash2, Edit2, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import CommentThread from './CommentThread';
import ReplyForm from './ReplyForm';

interface User {
  name: string | null;
  photo: string | null;
  username: string | null;
}

interface CommentItemProps {
  id: number;
  content: string;
  likes: number;
  dislikes: number;
  isPinned: boolean;
  createdAt: string;
  user: User;
  userId: string;
  spotId: number;
  userVote?: 'like' | 'dislike' | null; // Current user's vote
  replyCount?: number; // Number of replies
  isReply?: boolean; // Whether this is a reply to another comment
  highlightReplyId?: number | null; // Reply to highlight in thread
  onDelete?: () => void;
  onEdit?: () => void;
  onVoteChange?: () => void; // Callback to update comments
}

export default function CommentItem({
  id,
  content,
  likes,
  dislikes,
  isPinned,
  createdAt,
  user,
  userId,
  spotId,
  userVote,
  replyCount = 0,
  isReply = false,
  highlightReplyId,
  onDelete,
  onEdit,
  onVoteChange,
}: CommentItemProps) {
  const { data: session } = useSession();
  const t = useTranslations('comments');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [currentDislikes, setCurrentDislikes] = useState(dislikes);
  const [currentUserVote, setCurrentUserVote] = useState<'like' | 'dislike' | null>(userVote || null);
  const [isVoting, setIsVoting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const isOwner = session?.user?.email === userId;
  const isAdmin = session?.user?.role === 'admin';

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

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!session?.user?.email || isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch(`/api/spots/${spotId}/comments/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : data.error?.message || data.data?.message || t('errorVoting');
        alert(errorMessage);
        return;
      }

      // Update local state
      if (currentUserVote === voteType) {
        // If already voted the same, do nothing (endpoint returns idempotent)
        return;
      }

      if (currentUserVote) {
        // Changed from like to dislike or vice versa
        if (currentUserVote === 'like') {
          setCurrentLikes((prev) => prev - 1);
        } else {
          setCurrentDislikes((prev) => prev - 1);
        }
      }

      // Add the new vote
      if (voteType === 'like') {
        setCurrentLikes((prev) => prev + 1);
      } else {
        setCurrentDislikes((prev) => prev + 1);
      }

      setCurrentUserVote(voteType);
      onVoteChange?.(); // Refresh comment list
    } catch (error) {
      console.error('Error voting:', error);
      alert(t('errorVoting'));
    } finally {
      setIsVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch(`/api/spots/${spotId}/comments/${id}/vote`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : data.error?.message || data.data?.message || t('errorRemovingVote');
        alert(errorMessage);
        return;
      }

      // Update local state
      if (currentUserVote === 'like') {
        setCurrentLikes((prev) => prev - 1);
      } else if (currentUserVote === 'dislike') {
        setCurrentDislikes((prev) => prev - 1);
      }

      setCurrentUserVote(null);
      onVoteChange?.();
    } catch (error) {
      console.error('Error removing vote:', error);
      alert(t('errorRemovingVote'));
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete'))) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/spots/${spotId}/comments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        // Error can be an object or a string
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : data.error?.message || data.data?.message || t('errorDeletingComment');
        alert(errorMessage);
        return;
      }

      onDelete?.();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(t('errorDeletingComment'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplyCreated = () => {
    // Hide form
    setShowReplyForm(false);
    // Reload main comments to update reply counter
    onVoteChange?.();
  };

  return (
    <div
      id={`comment-${id}`}
      className={`bg-neutral-800 rounded-lg p-3 border-2 ${isPinned ? 'border-accent-purple-500' : 'border-neutral-700'} ${isOwner ? 'ring-1 ring-accent-purple-500/30' : ''}`}
    >
      {/* Header: Author + Actions */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.name || 'User'}
              className="w-8 h-8 rounded-full border-2 border-accent-cyan-400 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan-400 to-accent-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}

          <div>
            <Link
              href={user.username ? `/profile/${user.username}` : '#'}
              className="font-bold text-sm text-accent-cyan-400 hover:text-accent-cyan-300"
            >
              {user.name || 'User'}
            </Link>
            <p className="text-[10px] text-neutral-500">{formatDate(createdAt)}</p>
          </div>
        </div>

        {/* Actions menu for owner/admin */}
        {(isOwner || isAdmin) && (
          <div className="flex items-center gap-1">
            {isPinned && (
              <span className="text-[10px] bg-accent-purple-600 text-white px-2 py-0.5 rounded font-bold">
                {t('pinned')}
              </span>
            )}
            {isOwner && onEdit && (
              <button
                onClick={onEdit}
                disabled={isDeleting}
                className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-accent-cyan-400 transition-colors"
                title={t('editComment')}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-red-400 transition-colors"
              title={t('deleteComment')}
            >
              {isDeleting ? (
                <div className="w-3 h-3 animate-spin border-2 border-red-400 border-t-transparent rounded-full" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-neutral-200 mb-2 whitespace-pre-wrap break-words">
        {content}
      </p>

      {/* Like/Dislike buttons */}
      <div className="flex items-center gap-3 text-xs">
        {/* Like button */}
        <button
          onClick={() => currentUserVote === 'like' ? handleRemoveVote() : handleVote('like')}
          disabled={isVoting || !session}
          className={`
            flex items-center gap-1 px-2 py-1 rounded transition-all
            ${currentUserVote === 'like'
              ? 'bg-green-600 text-white cursor-pointer'
              : 'bg-neutral-700 text-neutral-300 hover:bg-green-600 hover:text-white'
            }
            ${!session ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${isVoting ? 'opacity-50' : ''}
          `}
          title={session ? (currentUserVote === 'like' ? t('removeLike') : t('like')) : t('signInToVote')}
        >
          <ThumbsUp className="w-3 h-3" />
          <span className="font-bold">{currentLikes}</span>
        </button>

        {/* Dislike button */}
        <button
          onClick={() => currentUserVote === 'dislike' ? handleRemoveVote() : handleVote('dislike')}
          disabled={isVoting || !session}
          className={`
            flex items-center gap-1 px-2 py-1 rounded transition-all
            ${currentUserVote === 'dislike'
              ? 'bg-red-600 text-white cursor-pointer'
              : 'bg-neutral-700 text-neutral-300 hover:bg-red-600 hover:text-white'
            }
            ${!session ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${isVoting ? 'opacity-50' : ''}
          `}
          title={session ? (currentUserVote === 'dislike' ? t('removeDislike') : t('dislike')) : t('signInToVote')}
        >
          <ThumbsDown className="w-3 h-3" />
          <span className="font-bold">{currentDislikes}</span>
        </button>

        {/* Total votes */}
        <span className="text-neutral-500">
          {currentLikes + currentDislikes} {currentLikes + currentDislikes === 1 ? t('vote') : t('votes')}
        </span>

        {/* Reply button - only on main comments */}
        {!isReply && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            disabled={!session}
            className={`
              flex items-center gap-1 px-2 py-1 rounded transition-all
              bg-neutral-700 text-neutral-300 hover:bg-accent-cyan-600 hover:text-white
              ${!session ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={session ? t('replyToComment') : t('signInToReply')}
          >
            <MessageCircle className="w-3 h-3" />
            {replyCount > 0 && <span className="font-bold">{replyCount}</span>}
          </button>
        )}
      </div>

      {/* Reply Form - only for main comments */}
      {!isReply && showReplyForm && (
        <ReplyForm
          spotId={spotId}
          parentCommentId={id}
          onReplyCreated={handleReplyCreated}
          onCancel={() => setShowReplyForm(false)}
        />
      )}

      {/* Replies thread - only for main comments */}
      {!isReply && replyCount > 0 && (
        <CommentThread
          spotId={spotId}
          commentId={id}
          replyCount={replyCount}
          highlightReplyId={highlightReplyId}
        />
      )}
    </div>
  );
}
