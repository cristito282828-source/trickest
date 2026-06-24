'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ReelCommentFormProps {
  submissionId: number;
  parentCommentId?: number;
  onCommentCreated: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function ReelCommentForm({
  submissionId,
  parentCommentId,
  onCommentCreated,
  onCancel,
  placeholder: placeholderProp,
}: ReelCommentFormProps) {
  const { data: session } = useSession();
  const t = useTranslations('comments');
  const placeholder = placeholderProp || (parentCommentId ? t('replyPlaceholder') : t('placeholder'));
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const maxLength = 500;
  const remainingChars = maxLength - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.email) {
      setError(t('signInToComment'));
      setTimeout(() => setError(null), 3000);
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setError(t('commentEmpty'));
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (trimmed.length > maxLength) {
      setError(t('commentExceedsLimit', { max: maxLength }));
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/reels/${submissionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          ...(parentCommentId && { parentCommentId }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || data.data?.message || t('errorCreatingComment');
        setError(errorMessage);
        setTimeout(() => setError(null), 3000);
        return;
      }

      setSuccess(t('commentPosted'));
      setContent('');
      setTimeout(() => setSuccess(null), 2000);
      onCommentCreated();
      if (onCancel) onCancel();
    } catch (err) {
      console.error('Error creating reel comment:', err);
      setError(t('errorCreatingComment'));
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-300 px-3 py-2 rounded text-sm font-bold">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-500 text-green-300 px-3 py-2 rounded text-sm font-bold">
          ✅ {success}
        </div>
      )}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          disabled={!session?.user || isSubmitting}
          maxLength={maxLength}
          rows={parentCommentId ? 2 : 3}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white text-sm placeholder-neutral-500 focus:border-cyan-400 focus:outline-none resize-none"
        />
        <div className="absolute bottom-1 right-2 text-[10px] text-neutral-500">
          {remainingChars}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            {t('cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={!session?.user || isSubmitting || !content.trim()}
          className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
        >
          <Send size={12} />
          {isSubmitting ? t('posting') : parentCommentId ? t('reply') : t('comment')}
        </button>
      </div>
    </form>
  );
}
