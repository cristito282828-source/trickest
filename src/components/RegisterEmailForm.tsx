'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import ModalPortal from './ModalPortal';
import { Button } from '@/components/atoms';

interface RegisterEmailFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterEmailForm({ isOpen, onClose, onSuccess, onSwitchToLogin }: RegisterEmailFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('registerForm');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (password !== confirmPassword) {
      setError(t('passwordsNoMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    setIsLoading(true);

    try {
      // Create account
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('errorCreating'));
        setIsLoading(false);
        return;
      }

      // Auto-login after successful registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('accountCreatedSignInError'));
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(t('errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md my-auto bg-gradient-to-br from-neutral-900 via-purple-900 to-neutral-900 border-4 border-accent-cyan-400 rounded-xl shadow-2xl shadow-accent-cyan-500/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-4 border-b-4 border-accent-cyan-300">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase tracking-wider text-white drop-shadow-lg">
              {t('title')}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-accent-cyan-200 font-black text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-3 text-red-200 text-sm font-bold">
              {error}
            </div>
          )}

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-accent-cyan-400 font-black uppercase text-sm mb-2 tracking-wider">
              {t('name')}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-600 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-500 focus:shadow-lg focus:shadow-accent-cyan-500/50 transition-all"
              placeholder={t('namePlaceholder')}
              disabled={isLoading}
            />
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="register-email" className="block text-accent-cyan-400 font-black uppercase text-sm mb-2 tracking-wider">
              {t('email')}
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-600 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-500 focus:shadow-lg focus:shadow-accent-cyan-500/50 transition-all"
              placeholder="tu@email.com"
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="register-password" className="block text-accent-cyan-400 font-black uppercase text-sm mb-2 tracking-wider">
              {t('password')}
            </label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-600 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-500 focus:shadow-lg focus:shadow-accent-cyan-500/50 transition-all"
              placeholder="••••••••"
              disabled={isLoading}
            />
            <p className="text-xs text-neutral-400 mt-1 font-bold">{t('minCharacters')}</p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirm-password" className="block text-accent-cyan-400 font-black uppercase text-sm mb-2 tracking-wider">
              {t('confirmPassword')}
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-neutral-800 border-2 border-neutral-600 rounded-lg text-white font-bold focus:outline-none focus:border-accent-cyan-500 focus:shadow-lg focus:shadow-accent-cyan-500/50 transition-all"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            variant="primary"
            size="lg"
            fullWidth
          >
            {isLoading ? t('creating') : t('createAccount')}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-neutral-900 text-neutral-400 font-bold uppercase">{t('or')}</span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            onClick={() => signIn('google')}
            disabled={isLoading}
            variant="purple"
            size="lg"
            fullWidth
          >
            {t('signUpWithGoogle')}
          </Button>

          {/* Link to Login */}
          {onSwitchToLogin && (
            <div className="text-center pt-4 border-t-2 border-neutral-700">
              <p className="text-neutral-400 text-sm mb-3 font-bold">
                {t('alreadyHaveAccount')}
              </p>
              <Button
                type="button"
                onClick={onSwitchToLogin}
                disabled={isLoading}
                variant="secondary"
                size="md"
                fullWidth
                arcadeBorder={false}
              >
                {t('signIn')}
              </Button>
            </div>
          )}
        </form>

        {/* Arcade Border Effect */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-accent-cyan-400"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-accent-cyan-400"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-accent-cyan-400"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-accent-cyan-400"></div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
