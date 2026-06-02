'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ArcadeButtonsProps {
  onPressStart: () => void;
}

export default function ArcadeButtons({ onPressStart }: ArcadeButtonsProps) {
  const t = useTranslations('arcadeButtons');

  // Detectar tecla SPACE
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        onPressStart();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onPressStart]);

  return (
    <>
      {/* Indicador de tecla SPACE - Esquina inferior izquierda, solo desktop */}
      <div
        className="hidden md:flex fixed bottom-4 left-4 md:bottom-6 md:left-6 z-[100] bg-neutral-900/90 backdrop-blur-sm px-4 py-3 rounded-lg border-2 border-accent-cyan-500 shadow-lg shadow-accent-cyan-500/30 items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-sm">⌨️</span>
        <span className="text-accent-cyan-300 text-xs md:text-sm uppercase tracking-wide font-bold">
          {t('pressKey')}
        </span>
        <span className="bg-accent-cyan-500 text-neutral-900 px-2 py-0.5 rounded font-black text-xs tracking-widest arcade-blink">
          SPACE
        </span>
      </div>

      {/* Botón Flotante Principal */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 md:bottom-6 z-[100]">
        <button
          onClick={onPressStart}
          className="group bg-neutral-900/95 backdrop-blur-sm px-3 py-2.5 md:px-5 md:py-3 rounded-lg border-2 border-accent-cyan-500 shadow-lg shadow-accent-cyan-500/40 hover:shadow-accent-cyan-500/70 hover:border-accent-cyan-300 transition-all"
        >
          {/* Mobile: chip compacto "▶ START" */}
          <span className="md:hidden text-accent-cyan-300 text-xs uppercase tracking-widest font-black flex items-center gap-1.5 group-hover:text-accent-cyan-100">
            <span className="text-accent-cyan-400">▶</span>
            <span>{t('pressStart')}</span>
          </span>

          {/* Desktop: ▶ [PRESS START] con blink */}
          <span className="hidden md:flex text-accent-cyan-300 text-xs md:text-sm uppercase tracking-wide font-bold items-center gap-2 group-hover:text-accent-cyan-100 transition-colors">
            <span className="text-accent-cyan-400">▶</span>
            <span className="bg-accent-cyan-500 text-neutral-900 px-2 py-0.5 rounded font-black text-xs tracking-widest group-hover:bg-accent-cyan-400 arcade-blink">
              {t('pressStart')}
            </span>
          </span>
        </button>
      </div>

      {/* Animación blink tipo marquesina arcade */}
      <style jsx global>{`
        @keyframes arcade-blink {
          0%, 55% { opacity: 1; }
          56%, 100% { opacity: 0.3; }
        }
        .arcade-blink {
          animation: arcade-blink 1.2s steps(2, end) infinite;
        }
      `}</style>
    </>
  );
}
