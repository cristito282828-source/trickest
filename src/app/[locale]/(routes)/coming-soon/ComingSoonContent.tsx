'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';

const LAUNCH_DATE = new Date('2026-06-21T00:00:00');

function useCountdown(targetDate: Date) {
  const calculate = useCallback(() => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [targetDate]);

  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(calculate());
    const id = setInterval(() => setTime(calculate()), 1000);
    return () => clearInterval(id);
  }, [calculate]);

  return { ...time, mounted };
}

function CountdownBox({ value, label, color }: { value: number; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'border-accent-cyan-500/60 shadow-accent-cyan-500/20 text-accent-cyan-400',
    pink: 'border-accent-pink-500/60 shadow-accent-pink-500/20 text-accent-pink-400',
    yellow: 'border-accent-yellow-500/60 shadow-accent-yellow-500/20 text-accent-yellow-400',
    purple: 'border-accent-purple-500/60 shadow-accent-purple-500/20 text-accent-purple-400',
  };

  return (
    <div className={`relative bg-neutral-900/80 backdrop-blur-sm border-2 ${colorMap[color]} shadow-lg rounded-xl p-3 sm:p-5 text-center min-w-[70px] sm:min-w-[90px]`}>
      <div className={`font-black text-3xl sm:text-5xl md:text-6xl tabular-nums tracking-tight ${colorMap[color]?.split(' ').pop()}`}>
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mt-1">
        {label}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, borderColor }: {
  icon: string;
  title: string;
  description: string;
  borderColor: string;
}) {
  return (
    <div className={`group bg-neutral-900/60 backdrop-blur-sm border-2 border-neutral-800 ${borderColor} rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-neutral-900/80`}>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-white font-black text-sm uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function ComingSoonContent() {
  const t = useTranslations('comingSoon');
  const { days, hours, minutes, seconds, mounted } = useCountdown(LAUNCH_DATE);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'exists' | 'error'>('idle');
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    fetch('/api/interested')
      .then(res => res.json())
      .then(data => { if (data.total) setWaitlistCount(data.total); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/interested', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (data.alreadyExists) {
        setStatus('exists');
      } else if (res.ok) {
        setStatus('success');
        setEmail('');
        setWaitlistCount(prev => prev + 1);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const features = [
    {
      icon: '\u{1F3AE}',
      title: t('feature1Title'),
      description: t('feature1Desc'),
      borderColor: 'hover:border-accent-cyan-500/50',
    },
    {
      icon: '\u{1F4CD}',
      title: t('feature2Title'),
      description: t('feature2Desc'),
      borderColor: 'hover:border-accent-pink-500/50',
    },
    {
      icon: '\u{1F3C6}',
      title: t('feature3Title'),
      description: t('feature3Desc'),
      borderColor: 'hover:border-accent-yellow-500/50',
    },
  ];

  return (
    <>
      <style>{`
        .arcade-grid {
          background-image:
            linear-gradient(rgba(6, 182, 212, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .scanlines::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.015) 2px,
            rgba(0, 0, 0, 0.015) 4px
          );
          pointer-events: none;
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
        .animate-float { animation: float-slow 4s ease-in-out infinite; }
        .neon-text {
          text-shadow:
            0 0 10px rgba(6, 182, 212, 0.4),
            0 0 40px rgba(6, 182, 212, 0.2),
            0 0 80px rgba(6, 182, 212, 0.1);
        }
      `}</style>

      <main className="min-h-screen bg-neutral-950 relative overflow-hidden scanlines">
        {/* Grid background */}
        <div className="absolute inset-0 arcade-grid" />

        {/* Radial glow behind hero */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 sm:py-20">

          {/* Hero */}
          <section className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-6 animate-float">
              <span className="text-5xl sm:text-6xl">&#x1F6F9;</span>
            </div>

            <h1 className="font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white uppercase tracking-tight mb-2 neon-text">
              {t('heroTitle')}
            </h1>
            <h2 className="font-black text-2xl sm:text-3xl md:text-4xl text-accent-cyan-400 uppercase tracking-[0.15em] mb-6 animate-glow-pulse">
              {t('heroSubtitle')}
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              {t('heroTagline')}
            </p>
          </section>

          {/* Launch date badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-neutral-900/80 border border-accent-yellow-500/30 rounded-full px-5 py-2">
              <span className="text-accent-yellow-400 font-bold text-xs uppercase tracking-wider">
                {t('goSkateDay')}
              </span>
              <span className="w-1 h-1 rounded-full bg-accent-yellow-500" />
              <span className="text-white font-black text-xs uppercase tracking-wider">
                {t('launchDate')}
              </span>
            </div>
          </div>

          {/* Countdown */}
          <section className="mb-12 sm:mb-16">
            <p className="text-center text-neutral-500 text-xs font-bold uppercase tracking-[0.25em] mb-6">
              {t('countdownTitle')}
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {mounted ? (
                <>
                  <CountdownBox value={days} label={t('days')} color="cyan" />
                  <span className="text-neutral-600 font-black text-2xl sm:text-3xl -mt-4">:</span>
                  <CountdownBox value={hours} label={t('hours')} color="pink" />
                  <span className="text-neutral-600 font-black text-2xl sm:text-3xl -mt-4">:</span>
                  <CountdownBox value={minutes} label={t('minutes')} color="yellow" />
                  <span className="text-neutral-600 font-black text-2xl sm:text-3xl -mt-4">:</span>
                  <CountdownBox value={seconds} label={t('seconds')} color="purple" />
                </>
              ) : (
                <>
                  <CountdownBox value={0} label={t('days')} color="cyan" />
                  <span className="text-neutral-600 font-black text-2xl sm:text-3xl -mt-4">:</span>
                  <CountdownBox value={0} label={t('hours')} color="pink" />
                  <span className="text-neutral-600 font-black text-2xl sm:text-3xl -mt-4">:</span>
                  <CountdownBox value={0} label={t('minutes')} color="yellow" />
                  <span className="text-neutral-600 font-black text-2xl sm:text-3xl -mt-4">:</span>
                  <CountdownBox value={0} label={t('seconds')} color="purple" />
                </>
              )}
            </div>
          </section>

          {/* Email form */}
          <section className="mb-16 sm:mb-20">
            <div className="max-w-lg mx-auto">
              {status === 'success' ? (
                <div className="text-center bg-neutral-900/80 border-2 border-success-500/50 rounded-xl p-8">
                  <div className="text-4xl mb-3">&#x1F91F;</div>
                  <h3 className="text-success-400 font-black text-xl uppercase tracking-wider mb-2">
                    {t('successTitle')}
                  </h3>
                  <p className="text-neutral-400 text-sm">{t('successMessage')}</p>
                </div>
              ) : status === 'exists' ? (
                <div className="text-center bg-neutral-900/80 border-2 border-accent-cyan-500/50 rounded-xl p-8">
                  <div className="text-4xl mb-3">&#x1F44A;</div>
                  <p className="text-accent-cyan-400 font-bold text-sm">{t('alreadyRegistered')}</p>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                      placeholder={t('emailPlaceholder')}
                      className={`flex-1 bg-neutral-900/80 border-2 ${
                        status === 'error' ? 'border-danger-500' : 'border-neutral-700 focus:border-accent-cyan-500'
                      } rounded-lg px-5 py-4 text-white placeholder-neutral-600 font-bold tracking-wide outline-none transition-colors`}
                      disabled={status === 'loading'}
                    />
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="bg-accent-cyan-500 hover:bg-accent-cyan-600 text-white font-black py-4 px-8 rounded-lg border-4 border-white uppercase tracking-wider shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-wait disabled:hover:scale-100 whitespace-nowrap"
                    >
                      {status === 'loading' ? t('joining') : t('joinWaitlist')}
                    </button>
                  </form>
                  {status === 'error' && (
                    <p className="text-danger-400 text-xs font-bold mt-2 text-center">{t('errorInvalidEmail')}</p>
                  )}
                </>
              )}

              {/* Founding member incentive */}
              {status !== 'success' && status !== 'exists' && (
                <p className="text-center text-neutral-500 text-xs font-bold uppercase tracking-wider mt-4">
                  &#x2B50; {t('foundingMember')} &#x2B50;
                </p>
              )}

              {/* Waitlist count */}
              {waitlistCount > 0 && (
                <p className="text-center text-neutral-600 text-xs mt-3">
                  {t('socialProof', { count: String(waitlistCount) })}
                </p>
              )}
            </div>
          </section>

          {/* Features */}
          <section className="mb-16 sm:mb-20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {features.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center border-t border-neutral-800/50 pt-8 pb-4">
            <p className="text-neutral-600 text-xs uppercase tracking-wider">
              {t('madeWith')} &#x2764;&#xFE0F; {t('forSkaters')}
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
