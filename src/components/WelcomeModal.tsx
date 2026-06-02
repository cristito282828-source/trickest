'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms';

interface WelcomeModalProps {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, userName, onClose }: WelcomeModalProps) {
  const [countdown, setCountdown] = useState(5);
  const t = useTranslations('welcomeModal');

  useEffect(() => {
    if (!isOpen) return;

    // Auto-close después de 5 segundos
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-neutral-900 via-green-900 to-neutral-900 border-4 border-green-400 rounded-xl shadow-2xl shadow-green-500/50 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-accent-cyan-500 p-6 border-b-4 border-green-300">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-white drop-shadow-lg animate-pulse">
              {t('title')}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-6 text-center">
          {/* User Name */}
          <div className="bg-gradient-to-r from-accent-cyan-500/20 to-green-500/20 border-2 border-accent-cyan-400 rounded-lg p-6">
            <p className="text-accent-cyan-300 text-sm uppercase tracking-wider mb-2 font-bold">
              {t('player')}
            </p>
            <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider drop-shadow-lg">
              {userName}
            </h3>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <div className="bg-neutral-800/50 border-2 border-green-500 rounded-lg p-4">
              <p className="text-green-300 text-lg md:text-xl font-black uppercase">
                {t('getReady')}
              </p>
              <p className="text-neutral-300 text-sm md:text-base mt-2 font-bold">
                {t('getReadyDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-neutral-800/50 border-2 border-accent-cyan-500 rounded-lg p-3">
                <p className="text-accent-cyan-300 font-black">1. {t('step1Title')}</p>
                <p className="text-neutral-400 text-xs mt-1">{t('step1Desc')}</p>
              </div>
              <div className="bg-neutral-800/50 border-2 border-accent-purple-500 rounded-lg p-3">
                <p className="text-accent-purple-300 font-black">2. {t('step2Title')}</p>
                <p className="text-neutral-400 text-xs mt-1">{t('step2Desc')}</p>
              </div>
              <div className="bg-neutral-800/50 border-2 border-accent-pink-500 rounded-lg p-3">
                <p className="text-accent-pink-300 font-black">3. {t('step3Title')}</p>
                <p className="text-neutral-400 text-xs mt-1">{t('step3Desc')}</p>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="pt-4">
            <div className="inline-block bg-green-500/20 border-2 border-green-400 rounded-full px-6 py-3">
              <p className="text-green-300 text-sm uppercase tracking-wider font-black">
                {t('continuingIn', { seconds: countdown })}
              </p>
            </div>
          </div>

          {/* Skip Button */}
          <Button
            onClick={onClose}
            variant="primary"
            size="md"
            arcadeBorder={false}
          >
            {t('skip')}
          </Button>
        </div>

        {/* Arcade Border Effect */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-accent-cyan-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
}
