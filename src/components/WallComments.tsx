'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ChevronDown, ChevronUp, CornerDownRight, MessageCircle, Send, Trash2 } from 'lucide-react';

interface CommentUser {
  name: string | null;
  photo: string | null;
  username: string | null;
}

interface WallComment {
  id: number;
  content: string;
  userId: string;
  parentCommentId: number | null;
  createdAt: string;
  user: CommentUser;
  _count?: { replies: number };
}

interface WallCommentsProps {
  activityId: number | undefined;
  initialCount: number;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  hideTrigger?: boolean;
}

export default function WallComments({
  activityId,
  initialCount,
  isOpen: controlledIsOpen,
  onOpenChange,
  hideTrigger = false,
}: WallCommentsProps) {
  const { data: session } = useSession();
  const t = useTranslations('communityWall');
  const locale = useLocale();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const [comments, setComments] = useState<WallComment[]>([]);
  const commentsLengthRef = useRef(0);
  const [replies, setReplies] = useState<Record<number, WallComment[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});
  const [hasMoreReplies, setHasMoreReplies] = useState<Record<number, boolean>>({});
  const [commentCount, setCommentCount] = useState(initialCount);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingRepliesId, setLoadingRepliesId] = useState<number | null>(null);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<number | null>(null);
  const [error, setError] = useState('');

  const updateIsOpen = (open: boolean) => {
    if (controlledIsOpen === undefined) setInternalIsOpen(open);
    onOpenChange?.(open);
  };

  const loadComments = useCallback(async (append = false) => {
    if (activityId === undefined) return;
    setLoading(true);
    setError('');
    try {
      const offset = append ? commentsLengthRef.current : 0;
      const response = await fetch(`/api/wall/${activityId}/comments?offset=${offset}`);
      const result: unknown = await response.json();
      if (!response.ok || !isApiResponse(result)) {
        throw new Error(getErrorMessage(result) || t('commentsLoadError'));
      }
      const data = getData(result);
      if (!Array.isArray(data.comments) || typeof data.total !== 'number' || typeof data.hasMore !== 'boolean') {
        throw new Error(t('commentsLoadError'));
      }
      const loadedComments = data.comments as WallComment[];
      commentsLengthRef.current = append
        ? commentsLengthRef.current + loadedComments.length
        : loadedComments.length;
      setComments((current) => append ? [...current, ...loadedComments] : loadedComments);
      setCommentCount(data.total);
      setHasMoreComments(data.hasMore);
    } catch (loadError) {
      console.error('Error loading wall comments:', loadError);
      setError(loadError instanceof Error ? loadError.message : t('commentsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [activityId, t]);

  useEffect(() => {
    if (isOpen) void loadComments();
  }, [isOpen, loadComments]);

  const toggleComments = () => {
    updateIsOpen(!isOpen);
  };

  const loadReplies = async (commentId: number, append = false) => {
    if (activityId === undefined) return;
    setLoadingRepliesId(commentId);
    setError('');
    try {
      const offset = append ? replies[commentId]?.length ?? 0 : 0;
      const response = await fetch(
        `/api/wall/${activityId}/comments?parentCommentId=${commentId}&offset=${offset}`
      );
      const result: unknown = await response.json();
      if (!response.ok || !isApiResponse(result)) {
        throw new Error(getErrorMessage(result) || t('commentsLoadError'));
      }
      const data = getData(result);
      if (!Array.isArray(data.comments) || typeof data.hasMore !== 'boolean') {
        throw new Error(t('commentsLoadError'));
      }
      setReplies((current) => ({
        ...current,
        [commentId]: append
          ? [...(current[commentId] || []), ...data.comments as WallComment[]]
          : data.comments as WallComment[],
      }));
      setHasMoreReplies((current) => ({ ...current, [commentId]: data.hasMore as boolean }));
      setExpandedReplies((current) => ({ ...current, [commentId]: true }));
    } catch (loadError) {
      console.error('Error loading wall comment replies:', loadError);
      setError(loadError instanceof Error ? loadError.message : t('commentsLoadError'));
    } finally {
      setLoadingRepliesId(null);
    }
  };

  const submitComment = async (content: string, parentCommentId?: number) => {
    if (activityId === undefined || posting) return;
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    setPosting(true);
    setError('');
    try {
      const response = await fetch(`/api/wall/${activityId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmedContent,
          ...(parentCommentId === undefined ? {} : { parentCommentId }),
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok || !isApiResponse(result)) {
        throw new Error(getErrorMessage(result) || t('commentPostError'));
      }

      if (parentCommentId === undefined) {
        setDraft('');
      } else {
        setReplyDraft('');
        setReplyTarget(null);
        await loadReplies(parentCommentId);
      }
      await loadComments();
    } catch (postError) {
      console.error('Error posting wall comment:', postError);
      setError(postError instanceof Error ? postError.message : t('commentPostError'));
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (comment: WallComment) => {
    if (activityId === undefined || deletingId !== null) return;
    if (!window.confirm(t('confirmDeleteComment'))) return;

    setDeletingId(comment.id);
    setError('');
    try {
      const response = await fetch(`/api/wall/${activityId}/comments/${comment.id}`, {
        method: 'DELETE',
      });
      const result: unknown = await response.json();
      if (!response.ok || !isApiResponse(result)) {
        throw new Error(getErrorMessage(result) || t('commentDeleteError'));
      }

      if (commentCount <= 1) {
        setCommentCount(0);
        setComments([]);
        updateIsOpen(false);
      } else {
        await loadComments();
        if (comment.parentCommentId !== null) {
          await loadReplies(comment.parentCommentId);
        }
      }
    } catch (deleteError) {
      console.error('Error deleting wall comment:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : t('commentDeleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (comment: WallComment) =>
    session?.user?.email === comment.userId || session?.user?.role === 'admin';

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

  const renderComment = (comment: WallComment, isReply = false) => (
    <div key={comment.id} className={`flex gap-2 ${isReply ? 'pl-7' : ''}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-xs font-black text-neutral-600">
        {comment.user.photo ? (
          <img src={comment.user.photo} alt="" className="h-full w-full object-cover" />
        ) : (
          (comment.user.name || '?').slice(0, 1).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1 rounded-2xl bg-neutral-100 px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {comment.user.username ? (
              <Link
                href={`/profile/${comment.user.username}`}
                className="text-xs font-extrabold text-neutral-800 hover:text-cyan-700"
              >
                {comment.user.name || comment.user.username}
              </Link>
            ) : (
              <p className="text-xs font-extrabold text-neutral-800">{comment.user.name || t('commenter')}</p>
            )}
            <time dateTime={comment.createdAt} className="ml-2 text-[10px] text-neutral-500">
              {formatDate(comment.createdAt)}
            </time>
          </div>
          {canDelete(comment) && (
            <button
              type="button"
              onClick={() => void deleteComment(comment)}
              disabled={deletingId !== null}
              aria-label={t('deleteComment')}
              title={t('deleteComment')}
              className="shrink-0 rounded p-1 text-neutral-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-700">{comment.content}</p>
        {!isReply && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (expandedReplies[comment.id]) {
                  setExpandedReplies((current) => ({ ...current, [comment.id]: false }));
                } else if (replies[comment.id]) {
                  setExpandedReplies((current) => ({ ...current, [comment.id]: true }));
                } else {
                  void loadReplies(comment.id);
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-900"
            >
              {expandedReplies[comment.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {t('replyCount', { count: comment._count?.replies ?? replies[comment.id]?.length ?? 0 })}
            </button>
            {session && (
              <button
                type="button"
                onClick={() => {
                  setReplyTarget(replyTarget === comment.id ? null : comment.id);
                  setReplyDraft('');
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-cyan-800"
              >
                <CornerDownRight size={13} />
                {t('reply')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={hideTrigger ? '' : 'mt-3 border-t border-neutral-100 pt-3'}>
      {!hideTrigger && (
        <button
          type="button"
          onClick={toggleComments}
          aria-expanded={isOpen}
          disabled={activityId === undefined}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 hover:text-cyan-800 disabled:opacity-50"
        >
          <MessageCircle size={17} />
          {isOpen ? t('hideComments') : t('commentsCount', { count: commentCount })}
        </button>
      )}

      {isOpen && (
        <div className="mt-3 space-y-3">
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
          {loading && comments.length === 0 ? (
            <p className="py-2 text-center text-sm text-neutral-500">{t('loadingComments')}</p>
          ) : comments.length ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  {renderComment(comment)}
                  {expandedReplies[comment.id] && (
                    <div className="space-y-2">
                      {(replies[comment.id] || []).map((reply) => renderComment(reply, true))}
                      {hasMoreReplies[comment.id] && (
                        <button
                          type="button"
                          onClick={() => void loadReplies(comment.id, true)}
                          disabled={loadingRepliesId === comment.id}
                          className="ml-7 text-xs font-bold text-cyan-700 hover:text-cyan-900 disabled:opacity-50"
                        >
                          {loadingRepliesId === comment.id ? t('loadingComments') : t('loadMoreComments')}
                        </button>
                      )}
                    </div>
                  )}
                  {replyTarget === comment.id && (
                    <form
                      className="ml-7 flex items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitComment(replyDraft, comment.id);
                      }}
                    >
                      <input
                        value={replyDraft}
                        onChange={(event) => setReplyDraft(event.target.value)}
                        maxLength={500}
                        placeholder={t('replyPlaceholder')}
                        aria-label={t('replyPlaceholder')}
                        className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        aria-label={t('reply')}
                        disabled={posting || !replyDraft.trim()}
                        className="rounded-full bg-cyan-600 p-2 text-white hover:bg-cyan-700 disabled:opacity-50"
                      >
                        <Send size={15} />
                      </button>
                    </form>
                  )}
                </div>
              ))}
              {hasMoreComments && (
                <button
                  type="button"
                  onClick={() => void loadComments(true)}
                  disabled={loading}
                  className="w-full rounded-lg py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-50 disabled:opacity-50"
                >
                  {loading ? t('loadingComments') : t('loadMoreComments')}
                </button>
              )}
            </div>
          ) : (
            <p className="py-2 text-center text-sm text-neutral-500">{t('noComments')}</p>
          )}

          {session ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void submitComment(draft);
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={500}
                placeholder={t('commentPlaceholder')}
                aria-label={t('commentPlaceholder')}
                className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-cyan-500 focus:bg-white"
              />
              <button
                type="submit"
                aria-label={t('postComment')}
                disabled={posting || !draft.trim()}
                className="rounded-full bg-cyan-600 p-2 text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                <Send size={15} />
              </button>
            </form>
          ) : (
            <p className="text-center text-xs text-neutral-500">{t('signInToComment')}</p>
          )}
        </div>
      )}
    </div>
  );
}

function isApiResponse(value: unknown): value is { success?: boolean; data?: unknown; error?: unknown } {
  return Boolean(value && typeof value === 'object' && 'success' in value);
}

function getData(response: { data?: unknown }) {
  return response.data && typeof response.data === 'object'
    ? response.data as { comments?: unknown; total?: unknown; hasMore?: unknown }
    : {};
}

function getErrorMessage(response: unknown) {
  if (!response || typeof response !== 'object' || !('error' in response)) return '';
  const error = response.error;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return '';
}
