'use client';

import { useState, useEffect } from 'react';
import CommentForm from '@/components/molecules/CommentForm';
import CommentItem from '@/components/molecules/CommentItem';
import { MessageSquare, TrendingUp, Clock } from 'lucide-react';
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
  userId: string;
  userVote?: 'like' | 'dislike' | null;
  replyCount?: number; // Number of replies
}

interface SpotCommentsProps {
  spotId: number;
  maxHeight?: string;
  highlightCommentId?: number | null;
}

export default function SpotComments({ spotId, maxHeight = '400px', highlightCommentId }: SpotCommentsProps) {
  const t = useTranslations('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const limit = 10;

  const fetchComments = async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOffset(0);
      }

      const currentOffset = append ? offset : 0;
      const response = await fetch(
        `/api/spots/${spotId}/comments?sort=${sort}&limit=${limit}&offset=${currentOffset}`
      );

      if (!response.ok) {
        const data = await response.json();
        // Error can be an object or a string
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : data.error?.message || data.data?.message || t('loadingComments');
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Validate that response has the expected structure
      const commentsList = data.data?.comments || data.comments || [];
      const totalCount = data.data?.total || data.total || 0;
      const hasMoreValue = data.data?.hasMore ?? data.hasMore ?? false;

      if (append) {
        setComments((prev) => [...prev, ...commentsList]);
      } else {
        setComments(commentsList);
      }

      setTotal(totalCount);
      setHasMore(hasMoreValue);
      setOffset(currentOffset + commentsList.length);
      setError(null);

    } catch (err: any) {
      console.error('Error loading comments:', err);
      setError(err.message || t('loadingComments'));
      // Ensure comments is always an array
      setComments([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchComments(false);
  }, [spotId, sort]);

  // Scroll to specific comment when loading finishes
  useEffect(() => {
    if (!highlightCommentId || loading) return;

    console.log('🔍 SpotComments: Looking for comment', highlightCommentId);

    const scrollToComment = () => {
      const targetElement = document.getElementById(`comment-${highlightCommentId}`);
      console.log('📍 Element found:', targetElement);

      if (targetElement) {
        console.log('✅ Scrolling to comment');
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.classList.add('ring-4', 'ring-green-400', 'ring-opacity-75');
        setTimeout(() => {
          targetElement.classList.remove('ring-4', 'ring-green-400', 'ring-opacity-75');
        }, 2000);
        return true;
      }
      return false;
    };

    // Try scroll immediately
    if (scrollToComment()) {
      console.log('✅ Immediate scroll successful');
      return;
    }

    // If not found, expand threads and retry
    setTimeout(() => {
      console.log('⏳ Expanding threads to find reply...');

      // Find "View X replies" buttons
      const allButtons = Array.from(document.querySelectorAll('button'));
      const threadButtons = allButtons.filter(btn =>
        btn.textContent?.includes('View ') && btn.textContent?.includes(' repl')
      );

      console.log('📂 Threads found:', threadButtons.length);

      // Expand all threads
      threadButtons.forEach((btn, i) => {
        console.log(`📂 Expanding thread ${i + 1}...`);
        (btn as HTMLButtonElement).click();
      });

      // Try scroll multiple times after expanding
      let attempts = 0;
      const maxAttempts = 10; // Increase to 10 attempts

      const tryScroll = () => {
        attempts++;
        console.log(`🔎 Attempt ${attempts}/${maxAttempts}`);

        if (scrollToComment()) {
          console.log('✅ Scroll successful');
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(tryScroll, 800); // Increase to 800ms between attempts
        } else {
          console.log('❌ Comment not found after expanding all threads');
          const allComments = document.querySelectorAll('[id^="comment-"]');
          console.log('📋 Available comments:', Array.from(allComments).map(c => c.id));
          console.log('❌ Comment', highlightCommentId, 'does not exist in any thread');
        }
      };

      setTimeout(tryScroll, 1000); // Wait 1 second before first attempt
    }, 1000);
  }, [highlightCommentId, loading]);

  const handleCommentCreated = () => {
    // Reset to first page and refetch
    setOffset(0);
    fetchComments(false);
  };

  const handleLoadMore = () => {
    fetchComments(true);
  };

  return (
    <div className="space-y-3">
      {/* Header with count and sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent-cyan-400" />
          <span className="font-bold text-accent-cyan-400">
            {total === 1 ? t('commentCount', { count: total }) : t('commentsCount', { count: total })}
          </span>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1 border border-neutral-700">
          <button
            onClick={() => setSort('recent')}
            className={`
              px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all
              ${sort === 'recent'
                ? 'bg-accent-purple-600 text-white'
                : 'text-neutral-400 hover:text-white'
              }
            `}
          >
            <Clock className="w-3 h-3" />
            {t('recent')}
          </button>
          <button
            onClick={() => setSort('popular')}
            className={`
              px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all
              ${sort === 'popular'
                ? 'bg-accent-purple-600 text-white'
                : 'text-neutral-400 hover:text-white'
              }
            `}
          >
            <TrendingUp className="w-3 h-3" />
            {t('popular')}
          </button>
        </div>
      </div>

      {/* Comment form */}
      <CommentForm spotId={spotId} onCommentCreated={handleCommentCreated} />

      {/* Error message */}
      {error && (
        <div className="bg-red-900/30 border-2 border-red-500 text-red-300 px-4 py-3 rounded-lg font-bold text-sm text-center">
          ❌ {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-neutral-800 border-2 border-neutral-700 rounded-lg p-6 text-center">
          <div className="w-8 h-8 animate-spin border-4 border-accent-cyan-400 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-accent-cyan-400 font-bold text-sm">{t('loadingComments')}</p>
        </div>
      )}

      {/* Comments list */}
      {!loading && Array.isArray(comments) && comments.length > 0 && (
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight }}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              id={comment.id}
              content={comment.content}
              likes={comment.likes}
              dislikes={comment.dislikes}
              isPinned={comment.isPinned}
              createdAt={comment.createdAt}
              user={comment.user}
              userId={comment.userId}
              spotId={spotId}
              userVote={comment.userVote}
              replyCount={comment.replyCount}
              highlightReplyId={highlightCommentId}
              onDelete={handleCommentCreated}
              onVoteChange={handleCommentCreated}
            />
          ))}

          {/* Load more button */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-600 hover:border-accent-cyan-400 rounded-lg font-bold text-accent-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? t('loadingMore') : t('loadMore', { remaining: total - comments.length })}
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && comments.length === 0 && (
        <div className="bg-neutral-800 border-2 border-neutral-700 rounded-lg p-6 text-center">
          <MessageSquare className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
          <p className="text-neutral-400 font-bold mb-1">
            {t('noCommentsYet')}
          </p>
          <p className="text-neutral-500 text-sm">
            {t('beFirstToShare')}
          </p>
        </div>
      )}
    </div>
  );
}
