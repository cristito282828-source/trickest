'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getEmbedUrl } from '@/lib/youtube';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

export default function VideoModal({ isOpen, onClose, videoUrl, title }: VideoModalProps) {
  const t = useTranslations('videoModal');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-sm z-[9999] p-4">
      <div className="w-full max-w-5xl bg-gradient-to-b from-neutral-900 to-black border-4 border-accent-cyan-500 rounded-lg shadow-2xl shadow-accent-cyan-500/50 relative">
        {/* Modal header */}
        <div className="bg-gradient-to-r from-accent-cyan-600 to-accent-blue-600 p-4 rounded-t-lg border-b-4 border-accent-cyan-300">
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider text-center">
            📺 {title || t('defaultTitle')}
          </h2>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-red-600 hover:bg-red-700 text-white font-bold w-10 h-10 rounded-full border-4 border-white shadow-lg transform hover:scale-110 transition-all"
          aria-label={t('close')}
        >
          ✖
        </button>

        {/* Modal content */}
        <div className="p-6">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg border-4 border-neutral-700"
              src={getEmbedUrl(videoUrl, { autoplay: true, mute: false })}
              title={title || t('defaultTitle')}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-accent-cyan-300 text-sm uppercase tracking-wide">
              {t('pressEscToClose')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
