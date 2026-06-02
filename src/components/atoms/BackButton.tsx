'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Home } from 'lucide-react';

interface BackButtonProps {
  fallbackHref?: string;
  showHomeIcon?: boolean;
  variant?: 'default' | 'minimal';
}

export default function BackButton({
  fallbackHref = '/',
  showHomeIcon = true,
  variant = 'default'
}: BackButtonProps) {
  const router = useRouter();
  const t = useTranslations('common');

  const handleBack = () => {
    // Intentar ir atrás en el historial
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // Si no hay historial, ir al fallback
      router.push(fallbackHref);
    }
  };

  const handleHome = () => {
    router.push(fallbackHref);
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleBack}
        aria-label={t('back') || 'Volver'}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 border-2 border-accent-cyan-500/50 hover:border-accent-cyan-400 transition-all text-accent-cyan-400 hover:scale-105"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Back button */}
      <button
        onClick={handleBack}
        aria-label={t('back') || 'Volver'}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 border-2 border-accent-cyan-500/50 hover:border-accent-cyan-400 transition-all text-accent-cyan-400 hover:scale-105"
      >
        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        <span className="hidden sm:inline text-xs md:text-sm font-black uppercase tracking-wider">
          {t('back') || 'Volver'}
        </span>
      </button>

      {/* Home button */}
      {showHomeIcon && (
        <button
          onClick={handleHome}
          aria-label="Ir a inicio"
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 border-2 border-accent-purple-500/50 hover:border-accent-purple-400 transition-all text-accent-purple-400 hover:scale-105"
        >
          <Home className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}
    </div>
  );
}
