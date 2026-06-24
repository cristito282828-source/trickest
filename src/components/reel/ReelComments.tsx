'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Clock, TrendingUp, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ReelCommentForm from './ReelCommentForm';
import ReelCommentItem from './ReelCommentItem';

interface User {
  name: string | null;
  photo: string | null;
  username: string | null;
}

interface ReelComment {
  id: number;
  content: string;
  likes: number;
  dislikes: number;
  isPinned: boolean;
  createdAt: string;
  user: User;
  userId: string;
  userVote?: 'like' | 'dislike' | null;
  replyCount?: number;
}

interface ReelCommentsProps {
  submissionId: number;
  highlightCommentId?: number | null;
}

export default function ReelComments({
  submissionId,
  highlightCommentId,
}: ReelCommentsProps) {
  const { data: session } = useSession();
  const t = useTranslations('comments');
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchComments = useCallback(
    async (currentOffset: number, append = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/reels/${submissionId}/comments?sort=${sort}&limit=10&offset=${currentOffset}`
        );
        if (!response.ok) {
          const data = await response.json();
          const msg =
            typeof data.error === 'string'
              ? data.error
              : data.error?.message || data.data?.message || t('errorCreatingComment');
          throw new Error(msg);
        }
        const data = await response.json();
        const list = data.data?.comments ?? data.comments ?? [];
        const totalCount = data.data?.total ?? data.total ?? 0;
        const hasMoreFlag = data.data?.hasMore ?? data.hasMore ?? false;
        setComments((prev) => (append ? [...prev, ...list] : list));
        setTotal(totalCount);
        setHasMore(hasMoreFlag);
        setOffset(currentOffset + list.length);
      } catch (err: any) {
        console.error('Error fetching comments:', err);
        setError(err.message || t('errorCreatingComment'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [submissionId, sort, t]
  );

  useEffect(() => {
    if (submissionId) fetchComments(0, false);
  }, [submissionId, sort, fetchComments]);

  // Highlight effect
  useEffect(() => {
    if (!highlightCommentId) return;
    const target = document.querySelector(
      `[data-comment-id="${highlightCommentId}"]`
    );
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('ring-2', 'ring-green-400');
      setTimeout(() => target.classList.remove('ring-2', 'ring-green-400'), 2000);
    }
  }, [highlightCommentId, comments.length]);

  const handleCommentCreated = () => {
    fetchComments(0, false);
  };

  const handleLoadMore = () => {
    fetchComments(offset, true);
  };

  const handleDelete = (deletedId: number) => {
    setComments((prev) => prev.filter((c) => c.id !== deletedId));
    setTotal((t) => Math.max(0, t - 1));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wider">
          <MessageSquare className="w-4 h-4" />
          {total === 1
            ? t('commentCount', { count: total })
            : t('commentsCount', { count: total })}
        </h3>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setSort('recent')}
            className={`px-2 py-1 rounded ${
              sort === 'recent'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-neutral-400 hover:text-cyan-400'
            }`}
          >
            <Clock className="w-3 h-3 inline" /> {t('recent')}
          </button>
          <button
            type="button"
            onClick={() => setSort('popular')}
            className={`px-2 py-1 rounded ${
              sort === 'popular'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-neutral-400 hover:text-cyan-400'
            }`}
          >
            <TrendingUp className="w-3 h-3 inline" /> {t('popular')}
          </button>
        </div>
      </div>

      {/* Form */}
      {session?.user ? (
        <ReelCommentForm
          submissionId={submissionId}
          onCommentCreated={handleCommentCreated}
        />
      ) : (
        <div className="text-xs text-neutral-500 bg-neutral-800/50 border border-neutral-700 rounded p-2">
          {t('signInToCommentMsg')}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-300 px-3 py-2 rounded text-sm">
          ❌ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 animate-spin border-2 border-cyan-400 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Comments list */}
      {!loading && comments.length === 0 && (
        <div className="text-center py-4 text-neutral-500 text-sm">
          {t('noCommentsYet')}
        </div>
      )}

      {!loading && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} data-comment-id={c.id} className="rounded-lg transition-shadow">
              <ReelCommentItem
                id={c.id}
                content={c.content}
                likes={c.likes}
                dislikes={c.dislikes}
                isPinned={c.isPinned}
                createdAt={c.createdAt}
                user={c.user}
                userId={c.userId}
                submissionId={submissionId}
                userVote={c.userVote}
                replyCount={c.replyCount}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-cyan-400 hover:text-cyan-300 text-xs font-bold inline-flex items-center gap-1"
          >
            <ChevronDown className="w-3 h-3" />
            {loadingMore ? t('loadingMore') : t('loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
