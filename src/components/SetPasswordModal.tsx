'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms';

interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Fallback translations in case the namespace is not loaded
const fallbackTranslations: Record<string, string> = {
  title: 'SEGURIDAD ADICIONAL',
  subtitle: 'Por seguridad, crea una contraseña para tu cuenta',
  password: 'Contraseña',
  passwordPlaceholder: '8+ caracteres: A, a, 1, @$!%*?&',
  confirmPassword: 'Confirmar Contraseña',
  confirmPlaceholder: 'Repite tu contraseña',
  securityNote: 'Esta contraseña se usará junto con tu cuenta de Google para mayor seguridad',
  setPassword: 'CREAR CONTRASEÑA',
  saving: 'GUARDANDO...',
  skipForNow: 'OMITIR POR AHORA',
  pressEscToClose: 'Presiona ESC para cerrar',
  passwordMinLength: 'La contraseña debe tener al menos 8 caracteres',
  passwordsNoMatch: 'Las contraseñas no coinciden',
  errorSetting: 'Error al establecer contraseña'
};

export default function SetPasswordModal({ isOpen, onClose, onSuccess }: SetPasswordModalProps) {
  const { data: session } = useSession();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

const t = useTranslations('setPasswordModal');

  const getT = (key: string): string => {
    try {
      const value = t(key);
      return typeof value === 'string' ? value : fallbackTranslations[key] || key;
    } catch {
      return fallbackTranslations[key] || key;
    }
  };

  // Close with ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('La contraseña debe tener al menos una mayúscula');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('La contraseña debe tener al menos una minúscula');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('La contraseña debe tener al menos un número');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('La contraseña debe tener al menos un carácter especial (@$!%*?&)');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: session?.user?.email,
        password,
      };

      console.log('📤 Enviando set-password:', payload);

      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📥 Respuesta set-password:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || data.message || getT('errorSetting'));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Error en set-password:', err);
      setError(err.message || getT('errorSetting'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/90 backdrop-blur-sm z-[9999] p-4 pt-8 md:pt-16">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-2xl bg-gradient-to-b from-neutral-900 to-black border-4 border-accent-yellow-500 rounded-lg shadow-2xl shadow-accent-yellow-500/50 relative max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-yellow-500 to-accent-yellow-600 p-4 md:p-6 rounded-t-lg border-b-4 border-accent-yellow-400">
          <h2 className="text-lg md:text-xl font-black text-neutral-900 uppercase tracking-wider text-center pr-8">
            {getT('title')}
          </h2>
          <p className="text-neutral-800 text-xs md:text-sm mt-2 text-center">
            {getT('subtitle')}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-red-600 hover:bg-red-700 text-white font-bold w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-white shadow-lg transform hover:scale-110 transition-all text-sm"
          type="button"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 md:p-8 lg:p-10">
          {error && (
            <div className="mb-4 p-3 bg-red-500 border-4 border-white rounded-lg text-white font-bold text-center text-xs md:text-sm animate-pulse">
              <pre style={{ whiteSpace: 'pre-wrap' }}>{typeof error === 'object' ? JSON.stringify(error, null, 2) : error}</pre>
            </div>
          )}

          <div className="space-y-3 md:space-y-4">
            {/* Password */}
            <div>
              <label className="block text-accent-yellow-400 font-bold mb-2 uppercase tracking-wide text-sm md:text-base lg:text-lg">
                {getT('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-800 border-4 border-neutral-600 rounded-lg py-3 md:py-4 px-4 md:px-5 text-white placeholder-neutral-400 text-2xl md:text-3xl tracking-widest focus:border-accent-yellow-500 focus:outline-none transition-all"
                placeholder="8+ chars: A, a, 1, @$!%*?&"
                required
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-accent-yellow-400 font-bold mb-2 uppercase tracking-wide text-sm md:text-base lg:text-lg">
                {getT('confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-neutral-800 border-4 border-neutral-600 rounded-lg py-3 md:py-4 px-4 md:px-5 text-white placeholder-neutral-400 text-2xl md:text-3xl tracking-widest focus:border-accent-yellow-500 focus:outline-none transition-all"
                placeholder={getT('confirmPlaceholder')}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Security info */}
          <div className="mt-4 md:mt-6 p-3 md:p-4 lg:p-5 bg-accent-blue-900/50 border-2 border-accent-blue-500 rounded-lg">
            <p className="text-accent-blue-200 text-sm md:text-base text-center leading-tight">
              {getT('securityNote')}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 md:gap-4 mt-6 md:mt-8">
            <Button
              type="submit"
              disabled={loading}
              variant="warning"
              size="lg"
              fullWidth
              className="md:text-lg lg:text-xl md:py-4"
            >
              {loading ? getT('saving') : getT('setPassword')}
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 md:py-4 px-8 md:px-12 rounded-lg border-4 border-neutral-500 uppercase tracking-wide text-sm md:text-base shadow-lg transform hover:scale-105 transition-all"
            >
              {getT('skipForNow')}
            </button>
          </div>

          {/* Help */}
          <div className="mt-4 md:mt-6 text-center">
            <p className="text-neutral-400 text-xs md:text-sm uppercase tracking-wide">
              {getT('pressEscToClose')}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
