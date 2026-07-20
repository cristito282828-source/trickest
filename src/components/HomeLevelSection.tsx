'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { MdLock, MdRocketLaunch, MdEmojiEvents } from 'react-icons/md';

export default function HomeLevelSection() {
  const t = useTranslations('homeLevelSection');
  const { data: session } = useSession();
  const [registeredCount, setRegisteredCount] = useState<number | null>(null);

  // Traemos el conteo de usuarios registrados para mostrar la barra de progreso.
  useEffect(() => {
    let cancelled = false;
    const loadCount = async () => {
      try {
        const res = await fetch('/api/users/count');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data?.count === 'number') {
          setRegisteredCount(data.count);
        }
      } catch (err) {
        // Silencioso: si falla, mostramos la barra igual con 0 (no rompe la home).
        console.warn('Could not fetch user count for challenge teaser:', err);
      }
    };
    loadCount();
    return () => {
      cancelled = true;
    };
  }, []);

  const target = 500;
  const current = registeredCount ?? 0;
  const percent = Math.min(100, Math.round((current / target) * 100));

  return (
    <div className="py-20 bg-gradient-to-br from-neutral-900 via-purple-900 to-neutral-900">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-neutral-900/60 border border-accent-cyan-400/40 px-4 py-1.5 rounded-full mb-4">
            <span className="text-accent-cyan-400 text-xs md:text-sm font-black uppercase tracking-[0.2em]">
              🔒 {t('locked')}
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-brand-pink uppercase tracking-wider mb-4">
            {t('teaserTitle')}
          </h2>
          <p className="text-cyan-300 text-base md:text-xl max-w-3xl mx-auto">
            {t('teaserSubtitle')}
          </p>
        </div>

        {/* Card de expectativa */}
        <div className="relative bg-neutral-900 border-4 border-accent-cyan-400 rounded-2xl p-8 md:p-12 shadow-2xl text-center overflow-hidden">
          {/* Icono decorativo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-pink/20 blur-2xl rounded-full" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border-4 border-brand-pink flex items-center justify-center">
                <MdLock className="text-brand-pink" size={48} />
              </div>
            </div>
          </div>

          {/* Contador de registros */}
          <div className="mb-8">
            <div className="flex items-baseline justify-center gap-2 mb-3">
              <span className="text-5xl md:text-7xl font-black text-white tabular-nums">
                {current.toLocaleString('es-CO')}
              </span>
              <span className="text-2xl md:text-3xl font-bold text-neutral-500">
                / {target.toLocaleString('es-CO')}
              </span>
            </div>
            <p className="text-cyan-300 text-sm md:text-base font-black uppercase tracking-wider">
              {t('registeredSkaters', { count: current, target })}
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative h-4 bg-neutral-800 rounded-full border-2 border-neutral-700 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-pink via-accent-cyan-400 to-accent-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] md:text-xs font-black text-white uppercase tracking-wider">
                {percent}%
              </div>
            </div>
          </div>

          {/* Mensaje de expectativa */}
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <MdRocketLaunch size={24} />
              <MdEmojiEvents size={24} />
            </div>
            <p className="text-white text-lg md:text-2xl font-black uppercase tracking-wider">
              {t('milestoneTitle')}
            </p>
            <p className="text-neutral-300 text-sm md:text-base">
              {t('milestoneDescription')}
            </p>
          </div>

          {/* CTA removed */}
        </div>
      </div>
    </div>
  );
}
