'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // Handlers memoizados (referencias estables para que RegisterEmailForm no se re-monte).
  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleOpenRegister = useCallback(() => {
    setShowRegister(true);
    setIsOpen(false); // Cerrar el modal del video (después de esto solo se ve el form).
  }, []);
  const handleSuccess = useCallback(() => {
    setShowRegister(false);
    window.location.reload();
  }, []);
  const handleSwitchToLogin = useCallback(() => {
    setShowRegister(false);
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('trickest:open-signin'));
  }, []);

  // Body scroll lock + ESC handler (activo mientras el video O el register estén abiertos).
  useEffect(() => {
    if (!isOpen && !showRegister) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showRegister) setShowRegister(false);
        else setIsOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, showRegister]);

  // Early returns DESPUÉS de todos los hooks.
  if (status === 'authenticated' && !showRegister) return null;
  if (!isOpen && !showRegister) return null;

  return (
    <>
      {/* Modal de video (solo si isOpen) */}
      {isOpen && !showRegister && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>

            <video
              src={VIDEO_URL}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full max-h-[80vh] object-contain bg-black"
            />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <button
                type="button"
                onClick={handleOpenRegister}
                className="inline-block px-8 py-3 bg-brand-pink text-white font-black uppercase tracking-wider text-sm rounded-full shadow-lg shadow-brand-pink/30 hover:scale-105 transition-transform"
              >
                {t('registerNow')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de registro (renderizado dentro de su propio backdrop via ModalPortal) */}
      {showRegister && (
        <RegisterEmailForm
          isOpen={true}
          onClose={() => setShowRegister(false)}
          onSuccess={handleSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </>
  );
}
