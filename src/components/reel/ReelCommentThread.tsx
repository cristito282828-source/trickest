'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ReelCommentItem from './ReelCommentItem';

interface User {
  name: string | null;
  photo: string | null;
  username: string | null;
}

interface Reply {
  id: number;
  content: string;
  likes: number;
  dislikes: number;
  isPinned: boolean;
  createdAt: string;
  user: User;
  userId: string;
  userVote?: 'like' | 'dislike' | null;
}

interface ReelCommentThreadProps {
  parentCommentId: number;
  submissionId: number;
  onReplyAdded?: () => void;
}

export default function ReelCommentThread({
  parentCommentId,
  submissionId,
  onReplyAdded,
}: ReelCommentThreadProps) {
  const t = useTranslations('comments');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isExpanded) {
      fetchReplies();
    }
  }, [isExpanded]);

  const fetchReplies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/reels/${submissionId}/comments/${parentCommentId}/replies?limit=10&offset=0`
      );
      if (!response.ok) {
        const data = await response.json();
        const msg =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || data.data?.message || t('errorLoadingReplies');
        throw new Error(msg);
      }
      const data = await response.json();
      const list = data.data?.replies ?? data.replies ?? [];
      const totalCount = data.data?.total ?? data.total ?? 0;
      setReplies(list);
      setTotal(totalCount);
    } catch (err: any) {
      console.error('Error loading replies:', err);
      setError(err.message || t('errorLoadingReplies'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  };

  const handleReplyDeleted = (deletedId: number) => {
    setReplies((prev) => prev.filter((r) => r.id !== deletedId));
    setTotal((t) => Math.max(0, t - 1));
  };

  if (total === 0 && !isExpanded) {
    return null;
  }

  return (
    <div className="ml-8 mt-2 border-l-2 border-neutral-700 pl-4">
      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
      >
        <MessageSquare className="w-3 h-3" />
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {isExpanded
          ? total === 1
            ? t('hideReply', { count: total })
            : t('hideReplies', { count: total })
          : total === 1
            ? t('viewReply', { count: total })
            : t('viewReplies', { count: total })}
        {loading && (
          <div className="w-3 h-3 animate-spin border-2 border-cyan-400 border-t-transparent rounded-full" />
        )}
      </button>

      {error && <div className="mt-2 text-xs text-red-400">❌ {error}</div>}

      {isExpanded && !loading && replies.length > 0 && (
        <div className="mt-3 space-y-2">
          {replies.map((reply) => (
            <ReelCommentItem
              key={reply.id}
              id={reply.id}
              content={reply.content}
              likes={reply.likes}
              dislikes={reply.dislikes}
              isPinned={reply.isPinned}
              createdAt={reply.createdAt}
              user={reply.user}
              userId={reply.userId}
              submissionId={submissionId}
              userVote={reply.userVote}
              onDelete={handleReplyDeleted}
              isReply={true}
            />
          ))}
        </div>
      )}

      {isExpanded && !loading && replies.length === 0 && total === 0 && (
        <div className="mt-2 text-xs text-neutral-500">{t('noRepliesYet')}</div>
      )}
    </div>
  );
}
