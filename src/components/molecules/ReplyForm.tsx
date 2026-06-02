'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Send, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ReplyFormProps {
  spotId: number;
  parentCommentId: number;
  onReplyCreated: () => void;
  onCancel: () => void;
}

export default function ReplyForm({
  spotId,
  parentCommentId,
  onReplyCreated,
  onCancel,
}: ReplyFormProps) {
  const { data: session } = useSession();
  const t = useTranslations('comments');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxLength = 500;
  const remainingChars = maxLength - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.email) {
      setError(t('signInToReplyMsg'));
      setTimeout(() => setError(null), 3000);
      return;
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setError(t('replyEmpty'));
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (trimmedContent.length > maxLength) {
      setError(t('replyExceedsLimit', { max: maxLength }));
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/spots/${spotId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmedContent,
          parentCommentId: parentCommentId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : data.error?.message || data.data?.message || t('errorCreatingReply');
        setError(errorMessage);
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Success - clear form and notify
      setContent('');
      onReplyCreated();

    } catch (err) {
      console.error('Error creating reply:', err);
      setError(t('errorCreatingReply'));
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-neutral-900/50 border border-accent-cyan-500/30 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-accent-cyan-400">
          💬 {t('replying')}
        </span>
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Error message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 px-2 py-1 rounded text-xs font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('replyPlaceholder')}
            disabled={isSubmitting}
            maxLength={maxLength}
            rows={2}
            className={`
              w-full px-3 py-2 bg-neutral-800 border-2 rounded-lg text-white text-sm
              focus:outline-none focus:border-accent-cyan-400 resize-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500' : 'border-neutral-600'}
              transition-colors
            `}
          />

          {/* Character counter */}
          <div className={`absolute bottom-2 right-2 text-xs font-bold ${
            remainingChars < 20 ? 'text-red-400' : 'text-neutral-500'
          }`}>
            {remainingChars}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 border border-neutral-500 rounded text-xs font-bold text-neutral-300 transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || !session}
            className={`
              flex-1 font-bold py-1.5 px-3 rounded-lg border-2 transition-all flex items-center justify-center gap-1 text-xs
              ${isSubmitting || !content.trim() || !session
                ? 'bg-neutral-700 border-neutral-600 text-neutral-500 cursor-not-allowed'
                : 'bg-accent-cyan-600 hover:bg-accent-cyan-700 border-accent-cyan-400 text-white cursor-pointer'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <div className="w-3 h-3 animate-spin border-2 border-white border-t-transparent rounded-full" />
                {t('sending')}
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                {t('reply')}
              </>
            )}
          </button>
        </div>

        {!session && (
          <p className="text-[10px] text-neutral-500 text-center">
            🔒 {t('needAccountToReply')}
          </p>
        )}
      </form>
    </div>
  );
}
