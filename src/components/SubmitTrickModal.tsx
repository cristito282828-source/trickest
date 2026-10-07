"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms';
import MuxVideoUploader, { type MuxUploaderHandle } from '@/components/MuxUploader';

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
  // Datos del upload a Mux (los llenamos cuando el upload termina)
  const [uploadData, setUploadData] = useState<{ uploadId: string } | null>(null);
  const [uploaderError, setUploaderError] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasFile, setHasFile] = useState(false); // true cuando el usuario seleccionó un archivo
  const uploaderRef = useRef<MuxUploaderHandle>(null);
  // Ref espejo de uploadData para evitar stale closure en handleSubmit
  const uploadDataRef = useRef<{ uploadId: string } | null>(null);
  const t = useTranslations('submitTrickModal');

  // Reset state cuando se abre/cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setUploadData(null);
      setUploaderError('');
      setError('');
      setLoading(false);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleUploaded = useCallback(({ uploadId }: { uploadId: string }) => {
    const data = { uploadId };
    setUploadData(data);
    uploadDataRef.current = data;
    setUploaderError('');
  }, []);

  // Marca que el usuario seleccionó archivo (habilita el botón "Enviar")
  const handleFileSelected = useCallback(() => {
    setHasFile(true);
  }, []);

  const handleUploaderError = useCallback((msg: string) => {
    setUploaderError(msg);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!challenge) return;

    // Verificar que hay un archivo seleccionado
    if (!uploaderRef.current?.hasFileSelected()) {
      setError('Selecciona un video primero.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('[modal] handleSubmit - disparando upload');
      // 1) Disparar el upload a Mux (si no está ya subiendo)
      uploaderRef.current?.startUpload();

      // 2) Esperar a que termine el upload. El `onUploaded` callback setea uploadDataRef.
      // Hacemos polling al ref (no al state) para evitar stale closure.
      const startTime = Date.now();
      while (!uploadDataRef.current && Date.now() - startTime < 300000) {
        await new Promise(r => setTimeout(r, 500));
        if (!uploadDataRef.current && Date.now() - startTime > 5000) {
          console.log('[modal] Aún esperando upload... elapsed:', Math.floor((Date.now() - startTime) / 1000), 's');
        }
      }

      if (!uploadDataRef.current) {
        throw new Error('El upload está tardando demasiado. Vuelve a intentar.');
      }
      console.log('[modal] Upload completo, creando submission');

      // 3) Crear la submission en la BD
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: String(challenge.id),
          muxUploadId: uploadDataRef.current.uploadId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // El server responde { success: false, error: { code, message, details } }
        const errorObj = data?.error;
        const message =
          (typeof errorObj?.message === 'string' && errorObj.message) ||
          (typeof data?.message === 'string' && data.message) ||
          (typeof data?.error === 'string' && data.error) ||
          `Error ${response.status}: ${response.statusText || 'Error submitting'}`;
        // Log para debug
        console.error('[submit] Server error:', { status: response.status, code: errorObj?.code, message, details: errorObj?.details });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black bg-opacity-70">
      {/* Modal Container */}
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="relative bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 p-1 rounded-lg shadow-2xl flex-1 flex flex-col min-h-0">
          {/* Subtle glow animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 rounded-lg blur-sm animate-pulse opacity-50 pointer-events-none"></div>
          <div className="relative bg-neutral-900 rounded-lg p-4 md:p-8 flex-1 overflow-y-auto min-h-0">
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
                  🎥 Tu video
                </label>
                <MuxVideoUploader
                  ref={uploaderRef}
                  onUploaded={handleUploaded}
                  onFileSelected={handleFileSelected}
                  onError={handleUploaderError}
                />
                {uploaderError && (
                  <p className="text-red-400 text-sm mt-2 font-bold">{uploaderError}</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-red-500 border-4 border-red-700 rounded-lg p-3">
                  <p className="text-white font-bold text-sm">{error}</p>
                </div>
              )}

              {/* Buttons — sticky al fondo */}
              <div className="sticky bottom-0 -mx-4 md:-mx-8 -mb-4 md:-mb-8 mt-6 bg-neutral-900 pt-4 pb-4 md:pt-6 md:pb-6 px-4 md:px-8 border-t-2 border-neutral-800">
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-4 md:px-6 rounded-lg uppercase tracking-wider transition-all text-sm md:text-base"
                    disabled={loading}
                  >
                    {t('cancel')}
                </button>
                <Button
                  type="submit"
                  disabled={!hasFile || loading || success}
                  variant="warning"
                  size="lg"
                  className="flex-1"
                >
                  {loading ? 'Enviando...' : '🚀 Enviar a Trickest'}
                </Button>
                </div>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}