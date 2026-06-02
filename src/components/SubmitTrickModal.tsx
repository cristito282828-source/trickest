"use client";

import { useState, useEffect } from 'react';
import { validateYouTubeUrl } from '@/lib/youtube';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms';

interface Challenge {
  id: number;
  level: number;
  name: string;
  difficulty: string;
  points: number;
}

interface SubmitTrickModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
  onSubmitSuccess: () => void;
}

export default function SubmitTrickModal({
  isOpen,
  onClose,
  challenge,
  onSubmitSuccess,
}: SubmitTrickModalProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const t = useTranslations('submitTrickModal');

  // Reset state cuando se abre/cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setVideoUrl('');
      setIsValidUrl(null);
      setError('');
      setLoading(false);
      setSuccess(false);
    }
  }, [isOpen]);

  // Validar URL en tiempo real
  useEffect(() => {
    if (videoUrl.trim()) {
      const isValid = validateYouTubeUrl(videoUrl);
      setIsValidUrl(isValid);
      if (!isValid) {
        setError(t('errorInvalidYouTube'));
      } else {
        setError('');
      }
    } else {
      setIsValidUrl(null);
      setError('');
    }
  }, [videoUrl, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidUrl || !challenge) {
      setError(t('errorInvalidUrl'));
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: String(challenge.id),
          videoUrl: videoUrl.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (typeof data?.message === 'string' && data.message) ||
          (typeof data?.error === 'string' && data.error) ||
          `Error ${response.status}: ${response.statusText || 'Error submitting'}`;
        throw new Error(message);
      }

      // Success
      setSuccess(true);
      onSubmitSuccess();
      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (error: any) {
      console.error('Error:', error);
      const message =
        (typeof error?.message === 'string' && error.message) ||
        (typeof error === 'string' && error) ||
        t('errorSubmitting');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !challenge) return null;

  // Determinar color del badge según dificultad
  const getDifficultyBadgeColor = () => {
    switch (challenge.difficulty) {
      case 'easy': return 'bg-accent-cyan-500';
      case 'medium': return 'bg-accent-purple-500';
      case 'hard': return 'bg-accent-orange-500';
      case 'expert': return 'bg-accent-yellow-500';
      default: return 'bg-neutral-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
      {/* Modal Container */}
      <div className="w-full max-w-2xl">
        <div className="relative bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 p-1 rounded-lg shadow-2xl">
          {/* Subtle glow animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 rounded-lg blur-sm animate-pulse opacity-50"></div>
          <div className="relative bg-neutral-900 rounded-lg p-6 md:p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow-400 to-accent-orange-400 uppercase tracking-wider">
                  {t('title')}
                </h2>
                <p className="text-neutral-400 text-sm mt-1">{t('level', { level: challenge.level })}: {challenge.name}</p>
              </div>
              <button
                onClick={onClose}
                disabled={success}
                className="text-neutral-400 hover:text-white text-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>

            {/* Challenge Info */}
            <div className="mb-6 flex flex-wrap gap-2">
              <span className={`${getDifficultyBadgeColor()} text-white px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                {challenge.difficulty}
              </span>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                {challenge.points} pts
              </span>
            </div>

            {/* Form */}
            {success ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl md:text-3xl font-black text-green-400 uppercase tracking-wider mb-3">
                  {t('successTitle') || '¡Gracias!'}
                </h3>
                <p className="text-neutral-300 text-base md:text-lg mb-2">
                  {t('successMessage') || 'Tu truco fue enviado correctamente.'}
                </p>
                <p className="text-neutral-400 text-sm">
                  {t('successHint') || 'Espera la evaluación de un juez.'}
                </p>
              </div>
            ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-accent-cyan-400 font-bold mb-2 uppercase text-sm">
                  {t('youtubeUrl')}
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={t('urlPlaceholder')}
                  className={`w-full bg-neutral-800 border-4 rounded-lg py-3 px-4 text-white focus:outline-none ${
                    isValidUrl === true
                      ? 'border-green-500'
                      : isValidUrl === false
                      ? 'border-red-500'
                      : 'border-neutral-600 focus:border-accent-cyan-500'
                  }`}
                  disabled={loading}
                />
                {isValidUrl === true && (
                  <p className="text-green-400 text-sm mt-2 font-bold">{t('validUrl')}</p>
                )}
                {isValidUrl === false && (
                  <p className="text-red-400 text-sm mt-2 font-bold">{t('invalidUrl')}</p>
                )}
                <p className="text-neutral-500 text-xs mt-2">
                  {t('urlExample')}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-red-500 border-4 border-red-700 rounded-lg p-3">
                  <p className="text-white font-bold text-sm">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-6 rounded-lg uppercase tracking-wider transition-all"
                  disabled={loading}
                >
                  {t('cancel')}
                </button>
                <Button
                  type="submit"
                  disabled={!isValidUrl || loading || success}
                  variant="warning"
                  size="lg"
                  className="flex-1"
                >
                  {loading ? t('submitting') : t('submitVideo')}
                </Button>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
