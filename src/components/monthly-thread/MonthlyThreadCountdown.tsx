'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface MonthlyThreadCountdownProps {
  endsAt: string;
  closed: boolean;
}

/**
 * Countdown client-side hacia el cierre del hilo. Se actualiza cada minuto.
 */
export default function MonthlyThreadCountdown({ endsAt, closed }: MonthlyThreadCountdownProps) {
  const t = useTranslations('monthlyThread');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (closed) {
    return (
      <span className="inline-block bg-neutral-900 border border-neutral-700 px-3 py-1 rounded-full text-neutral-400 text-xs font-bold uppercase tracking-wider">
        🔒 {t('closed')}
      </span>
    );
  }

  const endsAtMs = new Date(endsAt).getTime();
  const remainingMs = endsAtMs - now;

  if (remainingMs <= 0) {
    return (
      <span className="inline-block bg-neutral-900 border border-neutral-700 px-3 py-1 rounded-full text-neutral-400 text-xs font-bold uppercase tracking-wider">
        ⏰ {t('threadClosed')}
      </span>
    );
  }

  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return (
    <span className="inline-block bg-neutral-900 border border-accent-cyan-400/40 px-3 py-1 rounded-full text-accent-cyan-400 text-xs font-bold uppercase tracking-wider">
      ⏰ {t('endsIn', { time: parts.join(' ') })}
    </span>
  );
}