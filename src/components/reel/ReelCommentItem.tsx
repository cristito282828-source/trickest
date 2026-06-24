'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ThumbsUp, ThumbsDown, Trash2, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import ReelCommentThread from './ReelCommentThread';
import ReelCommentForm from './ReelCommentForm';

interface User {
  name: string | null;
  photo: string | null;
  username: string | null;
}

interface ReelCommentItemProps {
  id: number;
  content: string;
  likes: number;
  dislikes: number;
  isPinned: boolean;
  createdAt: string;
  user: User;
  userId: string;
  submissionId: number;
  userVote?: 'like' | 'dislike' | null;
  replyCount?: number;
  isReply?: boolean;
  onDelete?: (id: number) => void;
}

export default function ReelCommentItem({
  id,
  content,
  likes: initialLikes,
  dislikes: initialDislikes,
  isPinned,
  createdAt,
  user,
  userId,
  submissionId,
  userVote: initialUserVote = null,
  replyCount: initialReplyCount = 0,
  isReply = false,
  onDelete,
}: ReelCommentItemProps) {
  const { data: session } = useSession();
  const t = useTranslations('comments');
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const [replyCount, setReplyCount] = useState(initialReplyCount);

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!session?.user) {
      return;
    }
    if (isVoting) return;
    setIsVoting(true);

    // Optimistic update
    const prevVote = userVote;
    const newVote = prevVote === voteType ? null : voteType;
    setUserVote(newVote);
    if (prevVote === 'like') setLikes((l) => l - 1);
    else if (prevVote === 'dislike') setDislikes((d) => d - 1);
    if (newVote === 'like') setLikes((l) => l + 1);
    else if (newVote === 'dislike') setDislikes((d) => d + 1);

    try {
      if (prevVote === voteType) {
        // Quitar voto
        await fetch(`/api/reels/${submissionId}/comments/${id}/vote`, { method: 'DELETE' });
      } else {
        await fetch(`/api/reels/${submissionId}/comments/${id}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voteType }),
        });
      }
    } catch (err) {
      console.error('Error voting:', err);
      // Revert
      setUserVote(prevVote);
      if (prevVote === 'like') setLikes((l) => l + 1);
      else if (prevVote === 'dislike') setDislikes((d) => d + 1);
      if (newVote === 'like') setLikes((l) => l - 1);
      else if (newVote === 'dislike') setDislikes((d) => d - 1);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    if (!confirm(t('confirmDelete'))) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reels/${submissionId}/comments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDelete?.(id);
      }
    } catch (err) {
      console.error('Error deleting:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const timeAgo = (() => {
    const ms = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return t('justNow');
    if (mins < 60) return t('minAgo', { min: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('hoursAgo', { hours });
    const days = Math.floor(hours / 24);
    return t('daysAgo', { days });
  })();

  const isOwner = session?.user?.email === userId;

  return (
    <div className={`flex gap-2 ${isReply ? 'pl-6 border-l-2 border-neutral-700' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {user.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photo} alt={user.name || 'User'} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs">
          {user.username ? (
            <Link href={`/profile/${user.username}`} className="text-cyan-400 font-bold hover:underline">
              {user.name || 'Skater'}
            </Link>
          ) : (
            <span className="text-cyan-400 font-bold">{user.name || 'Skater'}</span>
          )}
          {isPinned && <span className="text-yellow-400">📌</span>}
          <span className="text-neutral-500">{timeAgo}</span>
        </div>

        {/* Content */}
        <p className="text-white text-sm mt-1 whitespace-pre-wrap break-words">{content}</p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2 text-xs">
          <button
            type="button"
            disabled={!session?.user || isVoting}
            onClick={() => handleVote('like')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              userVote === 'like'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-neutral-400 hover:text-cyan-400'
            }`}
            title={session?.user ? t('removeLike') : t('signInToVote')}
          >
            <ThumbsUp size={12} className={userVote === 'like' ? 'fill-current' : ''} />
            <span>{likes}</span>
          </button>
          <button
            type="button"
            disabled={!session?.user || isVoting}
            onClick={() => handleVote('dislike')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              userVote === 'dislike'
                ? 'bg-red-500/20 text-red-400'
                : 'text-neutral-400 hover:text-red-400'
            }`}
            title={session?.user ? t('removeDislike') : t('signInToVote')}
          >
            <ThumbsDown size={12} className={userVote === 'dislike' ? 'fill-current' : ''} />
            <span>{dislikes}</span>
          </button>
          {!isReply && (
            <button
              type="button"
              onClick={() => setShowReplyForm((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded text-neutral-400 hover:text-cyan-400 transition-colors"
            >
              <MessageCircle size={12} />
              <span>{t('reply')}</span>
            </button>
          )}
          {isOwner && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 px-2 py-1 rounded text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-2">
            <ReelCommentForm
              submissionId={submissionId}
              parentCommentId={id}
              onCommentCreated={() => {
                setShowReplyForm(false);
                setReplyCount((c) => c + 1);
                setShowThread(true);
              }}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Thread toggle (solo para comments principales) */}
        {!isReply && replyCount > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowThread((v) => !v)}
              className="text-cyan-400 hover:text-cyan-300 text-xs font-bold"
            >
              {showThread ? t('hideReplies') : t('viewReplies', { count: replyCount })}
            </button>
            {showThread && (
              <ReelCommentThread
                parentCommentId={id}
                submissionId={submissionId}
                onReplyAdded={() => setReplyCount((c) => c + 1)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
