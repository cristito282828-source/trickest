'use client';

/**
 * Tabulador de Challenges para la home.
 *
 * Solo muestra retos que existen en la base de datos y no inventa nombres.
 */
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { MdCheckCircle, MdPlayArrow } from 'react-icons/md';
import { getEmbedUrl } from '@/lib/youtube';

const DIFFICULTY_COLOR = {
  easy: 'bg-accent-cyan-500',
  medium: 'bg-accent-purple-500',
  hard: 'bg-accent-orange-500',
  expert: 'bg-accent-yellow-500',
} as const;

interface DbChallenge {
  id: number;
  level: number;
  name: string;
  description: string;
  demoVideoUrl: string;
  isBonus: boolean;
  difficulty: string;
  points: number;
}

interface UserSubmission {
  id: number;
  status: string;
  score: number | null;
  challengeId: number;
}

type TabStatus = 'completed' | 'active' | 'locked';

interface HomeChallengeTab {
  key: string;
  level: number;
  isBonus: boolean;
  challenge: DbChallenge | null;
  sub: UserSubmission | undefined;
  status: TabStatus | 'upcoming';
}

export default function HomeChallenges() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations('homeLevelSection');
  const [dbChallenges, setDbChallenges] = useState<DbChallenge[]>([]);
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState('level-1');

  // Fetch challenges + submissions del usuario
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const r = await fetch('/api/challenges');
        if (r.ok && !cancelled) {
          const data = await r.json();
          setDbChallenges(data.challenges || []);
        }
      } catch {}
      if (session) {
        try {
          const r = await fetch('/api/submissions/user');
          if (r.ok && !cancelled) {
            const data = await r.json();
            setSubmissions(data.submissions || []);
          }
        } catch {}
      }
      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [session]);

  // Show five levels and one bonus, using database data only for created challenges.
  const tabs = useMemo(() => {
    const challengesByLevel = new Map(
      dbChallenges.filter(challenge => !challenge.isBonus && challenge.level >= 1 && challenge.level <= 5)
        .map(challenge => [challenge.level, challenge])
    );
    const bonusChallenge = dbChallenges.find(challenge => challenge.isBonus) ?? null;
    const subMap = new Map(submissions.map(s => [s.challengeId, s]));
    let previousUnlocked = true;

    const levels: HomeChallengeTab[] = Array.from({ length: 5 }, (_, index) => {
      const level = index + 1;
      const challenge = challengesByLevel.get(level) ?? null;
      const sub = challenge ? subMap.get(challenge.id) : undefined;
      const isApproved = sub?.status === 'approved';
      const status = challenge
        ? isApproved
          ? 'completed'
          : previousUnlocked
          ? 'active'
          : 'locked'
        : 'upcoming';

      previousUnlocked = Boolean(challenge && isApproved);

      return { key: `level-${level}`, level, isBonus: false, challenge, sub, status };
    });

    const bonusSubmission = bonusChallenge ? subMap.get(bonusChallenge.id) : undefined;
    const bonusApproved = bonusSubmission?.status === 'approved';
    const bonusTab: HomeChallengeTab = {
      key: 'bonus',
      level: 0,
      isBonus: true,
      challenge: bonusChallenge,
      sub: bonusSubmission,
      status: bonusChallenge
        ? bonusApproved
          ? 'completed'
          : previousUnlocked
          ? 'active'
          : 'locked'
        : 'upcoming',
    };

    return [...levels.slice(0, 2), bonusTab, ...levels.slice(2)];
  }, [dbChallenges, submissions]);

  const selected = tabs.find(tab => tab.key === selectedKey) ?? tabs[0];
  const selectedChallenge = selected.challenge;

  const handlePlay = (challengeId: number) => {
    if (!session) {
      window.dispatchEvent(new CustomEvent('trickest:open-signin'));
      return;
    }
    router.push(`/dashboard/skaters/tricks?focus=${challengeId}`);
  };

  if (loading) {
    return (
      <section className="py-16 md:py-20 bg-neutral-900">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-accent-cyan-400 mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 bg-neutral-900">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider mb-3">
            🛹 {t('title')}
          </h2>
          <p className="text-neutral-300 text-sm md:text-base max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* ── TABS: 5 niveles y 1 bonus ── */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border-4 border-cyan-400/40 bg-slate-800 p-4 shadow-xl shadow-black/30 md:p-6">
          <div className="relative z-10 grid grid-cols-6 items-start gap-2 pb-2 md:gap-4">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden h-16 w-full md:block"
              viewBox="0 0 1000 64"
              preserveAspectRatio="none"
            >
              <line
                x1="83"
                y1="32"
                x2="917"
                y2="32"
                stroke="#22d3ee"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.14"
              />
              <line
                x1="83"
                y1="32"
                x2="917"
                y2="32"
                stroke="#22d3ee"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="333"
                y1="32"
                x2="500"
                y2="32"
                stroke="#a855f7"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.9"
              />
              {[83, 250, 417, 583, 750, 917].map((x, index) => (
                <circle
                  key={x}
                  cx={x}
                  cy="32"
                  r="4"
                  fill={index === 2 ? '#c084fc' : '#67e8f9'}
                  stroke="#1e293b"
                  strokeWidth="2"
                />
              ))}
            </svg>
            {tabs.map((tab) => {
              const isSelected = tab.key === selectedKey;
              const label = tab.isBonus ? '⭐' : tab.level;
              const isBonus = tab.isBonus;
              const appearanceClass = tab.status === 'completed'
                ? 'bg-accent-yellow-500 border-accent-yellow-300 text-black shadow-md'
                : isBonus
                ? tab.status === 'locked'
                  ? 'bg-accent-purple-950 border-accent-purple-800 text-accent-purple-300'
                  : tab.status === 'upcoming'
                  ? 'bg-accent-purple-950/70 border-accent-purple-900 text-accent-purple-400'
                  : 'bg-accent-purple-600 border-accent-purple-400 text-white shadow-md shadow-accent-purple-500/30'
                : tab.status === 'active'
                ? 'bg-accent-cyan-500 border-accent-cyan-300 text-white shadow-lg shadow-accent-cyan-500/40'
                : tab.status === 'locked'
                ? 'bg-neutral-700 border-neutral-600 text-neutral-300'
                : 'bg-neutral-800 border-neutral-700 text-neutral-500';

              return (
                <div key={tab.key} className="relative z-10 flex min-w-0 flex-col items-center gap-2">
                  <button
                    onClick={() => setSelectedKey(tab.key)}
                    className={`
                      relative mx-auto aspect-square w-full max-w-16
                      rounded-full border-4
                      font-black text-base md:text-lg
                      transition-all duration-200
                      ${appearanceClass}
                      ${isSelected ? 'ring-4 ring-white/80 scale-105' : 'hover:scale-105'}
                    `}
                    aria-label={tab.isBonus ? t('bonusChallenge') : t('level', { level: tab.level })}
                    aria-pressed={isSelected}
                  >
                    {tab.status === 'completed' ? (
                      <MdCheckCircle className="absolute inset-0 m-auto" size={32} />
                    ) : (
                      <span className={`absolute inset-0 flex items-center justify-center ${isBonus ? 'font-black italic' : ''}`}>
                        {label}
                      </span>
                    )}
                  </button>
                  <span className={`w-full text-center text-[8px] md:text-[10px] font-black uppercase leading-tight tracking-wide ${isBonus ? 'italic text-accent-purple-300' : tab.status === 'upcoming' ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    {tab.isBonus ? 'BONUS' : t('level', { level: tab.level })}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="relative z-10 mt-3 text-center text-xs text-neutral-300">
            {tabs.filter(tab => tab.challenge).length} / 6 {t('title').toLowerCase()} ·{' '}
            <span className="text-accent-yellow-400">{tabs.filter(tab => tab.status === 'completed').length}</span> {t('approved').toLowerCase()}
          </p>
        </div>

        {/* ── DETAIL del tab seleccionado ── */}
        {selected && selectedChallenge && (
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 border-4 border-neutral-700 rounded-2xl p-6 md:p-8 shadow-2xl">
            <ChallengeDetail
              challenge={selectedChallenge}
              status={selected.status === 'upcoming' ? 'locked' : selected.status}
              isAuthed={Boolean(session)}
              onPlay={() => handlePlay(selectedChallenge.id)}
              hasSubmission={Boolean(selected.sub)}
            />
          </div>
        )}

        {selected && !selected.challenge && (
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 border-4 border-neutral-700 rounded-2xl p-6 md:p-8 shadow-2xl text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl font-black ${selected.isBonus ? 'bg-accent-purple-950 border-accent-purple-700 text-accent-purple-300 italic' : 'bg-neutral-800 border-neutral-600 text-neutral-400'}`}>
                {selected.isBonus ? '⭐' : selected.level}
              </div>
            </div>
            <p className="text-neutral-400 font-bold uppercase tracking-wider mb-2">
              {selected.isBonus ? t('bonusChallenge') : t('level', { level: selected.level })}
            </p>
            <h3 className="text-2xl md:text-4xl font-black text-accent-yellow-400 uppercase tracking-wider">
              {t('locked')}
            </h3>
          </div>
        )}

        {/* CTA ver más */}
        {session && (
          <div className="text-center mt-8">
            <Link
              href="/dashboard/skaters/tricks"
              className="inline-block px-8 py-3 bg-accent-cyan-500 hover:bg-accent-cyan-600 text-black font-bold uppercase tracking-wider rounded-lg transition-all border-4 border-white/20 shadow-lg shadow-accent-cyan-500/50"
            >
              {t('viewAllChallenges')} →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
//  Componentes internos
// ──────────────────────────────────────────────────────────────

function ChallengeDetail({
  challenge,
  status,
  isAuthed,
  onPlay,
  hasSubmission,
}: {
  challenge: DbChallenge;
  status: TabStatus;
  isAuthed: boolean;
  onPlay: () => void;
  hasSubmission: boolean;
}) {
  const diffColor = DIFFICULTY_COLOR[challenge.difficulty as keyof typeof DIFFICULTY_COLOR] || 'bg-neutral-500';

  return (
    <>
      {/* Header con badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${diffColor} text-white`}>
          {challenge.difficulty}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-green-500 text-white">
          {challenge.points} pts
        </span>
        {status === 'completed' && (
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-accent-yellow-500 text-black flex items-center gap-1">
            <MdCheckCircle size={14} /> Completado
          </span>
        )}
        {hasSubmission && status !== 'completed' && (
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-accent-orange-500 text-white">
            En revisión
          </span>
        )}
        <span className="ml-auto text-neutral-400 text-xs font-bold uppercase">
          Nivel {challenge.level}
        </span>
      </div>

      {/* Título + descripción */}
      <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-wider mb-3">
        {challenge.name}
      </h3>
      <p className="text-neutral-300 text-base md:text-lg mb-6">
        {challenge.description}
      </p>

      {/* Video demo (YouTube embed) */}
      {challenge.demoVideoUrl && (
        <div className="aspect-video bg-black rounded-xl overflow-hidden border-2 border-neutral-700 mb-6">
          <iframe
            src={getEmbedUrl(challenge.demoVideoUrl)}
            className="w-full h-full"
            title={`Demo: ${challenge.name}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onPlay}
        disabled={!isAuthed}
        className="
          w-full md:w-auto inline-flex items-center justify-center gap-2
          px-8 py-4 bg-accent-cyan-500 hover:bg-accent-cyan-600
          disabled:bg-neutral-700 disabled:text-neutral-400
          text-black font-black text-base uppercase tracking-wider
          rounded-lg transition-all border-4 border-white/20 shadow-lg
          shadow-accent-cyan-500/50 hover:scale-105
        "
      >
        <MdPlayArrow size={24} />
        {isAuthed ? (hasSubmission ? 'VER MI SUBMISSION' : 'SUBIR MI TRUCO') : 'INICIA SESIÓN PARA JUGAR'}
      </button>
    </>
  );
}
