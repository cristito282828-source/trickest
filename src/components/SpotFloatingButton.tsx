'use client';

import { MapPin, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface SpotFloatingButtonProps {
  onClick: () => void;
}

export default function SpotFloatingButton({ onClick }: SpotFloatingButtonProps) {
  const t = useTranslations('spotFloatingButton');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if geolocation is available
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setHasPermission(result.state === 'granted');
      });
    } else if ('geolocation' in navigator) {
      setHasPermission(true);
    } else {
      setHasPermission(false);
    }
  }, []);

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-accent-cyan-600 to-accent-purple-600 hover:from-accent-cyan-500 hover:to-accent-purple-500 text-white px-6 py-4 rounded-full shadow-2xl shadow-accent-cyan-500/50 border-4 border-white transition-all transform hover:scale-110 active:scale-95 group flex items-center gap-3"
      title={t('tooltip')}
    >
      <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      <MapPin className="w-6 h-6 group-hover:animate-bounce" />

      {/* Text label - visible on desktop */}
      <span className="hidden md:inline font-black uppercase text-sm tracking-wider">
        {t('buttonText')}
      </span>

      {/* Pulse animation ring */}
      <span className="absolute inset-0 rounded-full bg-accent-cyan-400 animate-ping opacity-20"></span>
    </button>
  );
}
