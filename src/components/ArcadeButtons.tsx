'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface ArcadeButtonsProps {
  onPressStart: () => void;
}

export default function ArcadeButtons({ onPressStart }: ArcadeButtonsProps) {
  const t = useTranslations('arcadeButtons');
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
      {/* Indicador de tecla Space - Esquina inferior izquierda */}
      <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-[100] bg-neutral-800/95 backdrop-blur-sm px-4 py-3 rounded-lg border-4 border-accent-cyan-500 shadow-2xl shadow-accent-cyan-500/50">
        <p className="text-accent-cyan-300 text-xs md:text-sm uppercase tracking-wide animate-pulse font-bold">
          {`⌨️ ${t('pressKey')} `}
          <span className="bg-accent-cyan-500 text-white px-2 py-1 rounded font-black">
            SPACE
          </span>
        </p>
      </div>

      {/* Botón Flotante Principal - Esquina inferior derecha */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] bg-neutral-800/95 backdrop-blur-sm px-4 py-3 rounded-lg border-4 border-accent-cyan-500 shadow-2xl shadow-accent-cyan-500/50">
        <button onClick={onPressStart} className="group">
          <p className="text-accent-cyan-300 text-xs md:text-sm uppercase tracking-wide animate-pulse font-bold group-hover:text-accent-cyan-100 transition-colors">
            ▶️{' '}
            <span className="bg-accent-cyan-500 text-white px-2 py-1 rounded font-black group-hover:bg-accent-cyan-400">
              {t('pressStart')}
            </span>
          </p>
        </button>
      </div>
    </>
  );
}
