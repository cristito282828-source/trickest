'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import RegisterEmailForm from './RegisterEmailForm';

const VIDEO_URL = '/2026-06-27%2000_16_48.MP4';

export default function PromoVideoModal() {
  const { status } = useSession();
  const t = useTranslations('promoModal');
  const [isOpen, setIsOpen] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  // Body scroll lock + ESC handler
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showRegister) setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, showRegister]);

  // Early returns DESPUÉS de todos los hooks.
  if (status === 'authenticated') return null;
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => {
          // Si el modal de registro está abierto, no cerrar el video
          if (!showRegister) setIsOpen(false);
        }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de cierre */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Video */}
          <video
            src={VIDEO_URL}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full max-h-[80vh] object-contain bg-black"
          />

          {/* CTA Registrarse */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="inline-block px-8 py-3 bg-brand-pink text-white font-black uppercase tracking-wider text-sm rounded-full shadow-lg shadow-brand-pink/30 hover:scale-105 transition-transform"
            >
              {t('registerNow')}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de registro (renderizado encima del modal de video) */}
      <RegisterEmailForm
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={() => {
          setShowRegister(false);
          setIsOpen(false);
          window.location.reload();
        }}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setIsOpen(false);
          // Disparar el SigninButton del header para que abra el login modal
          // Lo hacemos con un custom event que el SigninButton va a escuchar.
          window.dispatchEvent(new CustomEvent('trickest:open-signin'));
        }}
      />
    </>
  );
}
