'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdSend, MdCheckCircle } from 'react-icons/md';

interface MonthlyThreadFormProps {
  threadId: number;
  onProposed?: () => void; // callback cuando se propone OK
}

const MAX_LENGTH = 60;

export default function MonthlyThreadForm({ threadId, onProposed }: MonthlyThreadFormProps) {
  const t = useTranslations('monthlyThread');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_LENGTH - text.length;
  const canSubmit = text.trim().length >= 2 && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/monthly-thread/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, text: text.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || `HTTP ${res.status}`);
      }
      // Success
      setSuccess(true);
      setText('');
      onProposed?.();
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err?.message || t('errorProposing'));
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          placeholder={t('proposePlaceholder')}
          maxLength={MAX_LENGTH}
          disabled={isSubmitting}
          className="flex-1 bg-neutral-900 border-2 border-neutral-700 focus:border-accent-cyan-400 rounded-lg px-3 py-2 text-white text-sm placeholder:text-neutral-600 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider border-2 flex items-center gap-1 transition-all ${
            success
              ? 'bg-accent-cyan-500 border-white text-neutral-900'
              : canSubmit
                ? 'bg-accent-pink-500 hover:bg-accent-pink-600 border-white text-white hover:scale-105'
                : 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {success ? (
            <>
              <MdCheckCircle />
              {t('addedToList')}
            </>
          ) : (
            <>
              <MdSend />
              {t('proposeCta')}
            </>
          )}
        </button>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className={`tabular-nums ${remaining < 10 ? 'text-accent-yellow-400' : 'text-neutral-500'}`}>
          {text.length}/{MAX_LENGTH}
        </span>
        {error && (
          <span className="text-red-400" role="alert">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}