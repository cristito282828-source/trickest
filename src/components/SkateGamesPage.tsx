'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { MdArrowForward, MdGavel, MdLocationOn, MdRefresh, MdSportsScore } from 'react-icons/md';

interface GameListItem {
  id: number;
  status: string;
  createdAt: string;
  challengerLetters: string;
  opponentLetters: string;
  challenger: PublicUser;
  opponent: PublicUser;
  judge: PublicUser;
  winner: { username: string | null; name: string | null } | null;
  spot: { id: number; name: string; city: string | null } | null;
  viewerRole: 'challenger' | 'opponent' | 'judge';
}

interface PublicUser {
  username: string | null;
  name: string | null;
  photo: string | null;
}

interface Candidate extends PublicUser {
  role: string;
  distanceMeters: number;
}

export default function SkateGamesPage() {
  const t = useTranslations('skateGamesPage');
  const [games, setGames] = useState<GameListItem[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<Candidate | null>(null);
  const [selectedJudge, setSelectedJudge] = useState<Candidate | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<Candidate[]>([]);
  const [loadingNearbyUsers, setLoadingNearbyUsers] = useState(true);
  const [nearbyUsersError, setNearbyUsersError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadGames = useCallback(async () => {
    try {
      const response = await fetch('/api/skate-games');
      const result: unknown = await response.json();
      if (!response.ok || !isResponse(result)) throw new Error(getError(result) || t('loadError'));
      const games = getData(result).games;
      if (!Array.isArray(games)) throw new Error(t('loadError'));
      setGames(games as GameListItem[]);
    } catch (loadError) {
      console.error('Error loading skate games:', loadError);
      setError(loadError instanceof Error ? loadError.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const loadNearbyUsers = useCallback(async () => {
    setLoadingNearbyUsers(true);
    setNearbyUsersError('');
    try {
      const response = await fetch('/api/skate-games/users', { cache: 'no-store' });
      const result: unknown = await response.json();
      if (!response.ok || !isResponse(result)) {
        throw new Error(response.status === 400 ? t('locationRequired') : t('nearbyUsersError'));
      }
      const users = getData(result).users;
      if (!Array.isArray(users)) throw new Error(t('nearbyUsersError'));
      setNearbyUsers(users as Candidate[]);
    } catch (loadError) {
      console.error('Error loading nearby skaters:', loadError);
      setNearbyUsersError(loadError instanceof Error ? loadError.message : t('nearbyUsersError'));
      setNearbyUsers([]);
    } finally {
      setLoadingNearbyUsers(false);
    }
  }, [t]);

  useEffect(() => {
    void loadNearbyUsers();
  }, [loadNearbyUsers]);

  useEffect(() => {
    const refreshNearbyUsers = () => void loadNearbyUsers();
    window.addEventListener('skater-location-updated', refreshNearbyUsers);
    const interval = nearbyUsersError
      ? null
      : window.setInterval(refreshNearbyUsers, 30_000);
    return () => {
      window.removeEventListener('skater-location-updated', refreshNearbyUsers);
      if (interval !== null) window.clearInterval(interval);
    };
  }, [loadNearbyUsers, nearbyUsersError]);

  const createGame = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOpponent || !selectedJudge || saving) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/skate-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponentUsername: selectedOpponent.username,
          judgeUsername: selectedJudge.username,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok || !isResponse(result)) throw new Error(getError(result) || t('createError'));
      setSuccess(t('challengeSent'));
      setSelectedOpponent(null);
      setSelectedJudge(null);
      await loadGames();
      await loadNearbyUsers();
    } catch (createError) {
      console.error('Error creating skate game:', createError);
      setError(createError instanceof Error ? createError.message : t('createError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="bg-neutral-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="relative mb-8 overflow-hidden rounded-2xl border border-cyan-800/80 bg-neutral-900 p-6 shadow-xl md:p-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rotate-12 border-[24px] border-cyan-950/70" aria-hidden="true" />
          <div className="relative">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-md border border-cyan-700/70 bg-cyan-950/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                <MdSportsScore className="text-base" /> {t('sessionEyebrow')}
              </span>
              <span className="border-l-2 border-cyan-500 pl-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                {t('sessionCall')}
              </span>
            </div>
            <h1 className="max-w-2xl text-3xl font-black uppercase leading-none tracking-tight md:text-5xl">{t('title')}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-300 md:text-base">{t('subtitle')}</p>
          </div>
        </header>

        {(error || success) && (
          <p role={error ? 'alert' : 'status'} className={`mb-5 rounded-xl border p-3 text-sm font-semibold ${
            error ? 'border-red-700 bg-red-950 text-red-200' : 'border-green-700 bg-green-950 text-green-200'
          }`}>
            {error || success}
          </p>
        )}

        <section className="relative mb-8 overflow-visible rounded-2xl border border-neutral-800 bg-neutral-900 p-5 md:p-7">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-neutral-800 pb-5">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">{t('sessionCall')}</p>
              <h2 className="text-2xl font-black uppercase tracking-tight md:text-3xl">{t('nearbyTitle')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">{t('createDescription')}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadNearbyUsers()}
              disabled={loadingNearbyUsers}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-black uppercase text-neutral-300 transition-colors hover:border-cyan-600 hover:text-cyan-200 disabled:opacity-50"
            >
              <MdRefresh className={loadingNearbyUsers ? 'animate-spin' : ''} />
              {t('refreshNearby')}
            </button>
          </div>
          <div className="mb-5 flex gap-3 rounded-xl border border-cyan-900/70 bg-cyan-950/30 p-4 text-sm leading-6 text-cyan-100">
            <MdLocationOn className="mt-0.5 shrink-0 text-xl text-cyan-300" />
            <p>{t('nearbyUsersNote')}</p>
          </div>
          {nearbyUsersError ? (
            <div role="alert" className="rounded-xl border border-amber-800 bg-amber-950/40 p-5 text-sm text-amber-100">
              <p>{nearbyUsersError}</p>
            </div>
          ) : loadingNearbyUsers ? (
            <p className="py-8 text-center text-neutral-400">{t('loadingNearby')}</p>
          ) : nearbyUsers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-700 p-6 text-center text-sm text-neutral-400">
              {t('noNearbyUsers')}
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-black uppercase tracking-wide text-neutral-200">{t('nearbySkaters')}</h3>
                <span className="font-mono text-xs text-neutral-500">{nearbyUsers.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {nearbyUsers.map((candidate) => (
                  <NearbySkaterCard
                    key={candidate.username}
                    candidate={candidate}
                    action={selectedOpponent?.username === candidate.username ? t('selectedOpponent') : t('challenge')}
                    selected={selectedOpponent?.username === candidate.username}
                    onSelect={() => {
                      setSelectedOpponent(candidate);
                      setSelectedJudge(null);
                      setError('');
                    }}
                    disabled={saving}
                  />
                ))}
              </div>
              {selectedOpponent && (
                <div className="mt-6 rounded-xl border border-cyan-800/70 bg-cyan-950/20 p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-cyan-300">{t('opponentSelected')}</p>
                      <p className="mt-1 font-bold text-white">{userName(selectedOpponent)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOpponent(null);
                        setSelectedJudge(null);
                      }}
                      className="text-xs font-black uppercase text-cyan-300 hover:text-cyan-100"
                    >
                      {t('change')}
                    </button>
                  </div>
                  <div className="mt-5 border-t border-cyan-900/70 pt-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-neutral-200">
                      <MdGavel className="text-lg text-purple-300" /> {t('chooseJudge')}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {nearbyUsers
                        .filter((user) => user.username !== selectedOpponent.username)
                        .map((candidate) => (
                          <button
                            key={candidate.username}
                            type="button"
                            onClick={() => setSelectedJudge(candidate)}
                            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                              selectedJudge?.username === candidate.username
                                ? 'border-purple-500 bg-purple-950/50'
                                : 'border-neutral-800 bg-neutral-950/60 hover:border-purple-700'
                            }`}
                          >
                            <UserAvatar user={candidate} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-white">{userName(candidate)}</span>
                              <span className="block text-xs text-neutral-400">~{approximateDistance(candidate.distanceMeters)} m</span>
                            </span>
                            {selectedJudge?.username === candidate.username && (
                              <span className="text-xs font-black uppercase text-purple-200">{t('selectedJudge')}</span>
                            )}
                          </button>
                        ))}
                    </div>
                    {nearbyUsers.length < 2 && (
                      <p className="mt-3 text-sm text-neutral-400">{t('needJudge')}</p>
                    )}
                  </div>
                  <form onSubmit={createGame} className="mt-5">
                    <button
                      type="submit"
                      disabled={saving || !selectedJudge}
                      className="group flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-600 px-5 py-4 font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? t('sending') : t('sendChallenge')}
                      {!saving && <MdArrowForward className="text-xl transition-transform group-hover:translate-x-1" />}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-neutral-500">{t('sessionEyebrow')}</p>
              <h2 className="text-xl font-black uppercase tracking-wide">{t('yourGames')}</h2>
            </div>
            <span className="font-mono text-xs text-neutral-500">{String(games.length).padStart(2, '0')}</span>
          </div>
          {loading ? (
            <p className="py-8 text-center text-neutral-400">{t('loading')}</p>
          ) : games.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-700 p-8 text-center text-neutral-400">{t('empty')}</div>
          ) : (
            <div className="grid gap-3">
              {games.map((game) => (
                <Link
                  key={game.id}
                  href={`/dashboard/skate-games/${game.id}`}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-cyan-600 md:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black">
                        {game.viewerRole === 'challenger'
                          ? t('challengeAgainst', { name: userName(game.opponent) })
                          : game.viewerRole === 'opponent'
                            ? t('challengedBy', { name: userName(game.challenger) })
                            : t('judgingGame', { first: userName(game.challenger), second: userName(game.opponent) })}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                        <MdLocationOn />
                        {game.spot ? `${game.spot.name}${game.spot.city ? ` · ${game.spot.city}` : ''}` : t('challengerLocation')}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClass(game.status)}`}>
                      {t(statusTranslationKey(game.status))}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
                    <span className="flex items-center gap-1"><MdGavel /> {t('judge')}: {userName(game.judge)}</span>
                    {game.status !== 'PENDING_ACCEPTANCE' && game.status !== 'CANCELLED' && (
                      <span className="font-black tracking-widest text-white">
                        {game.challengerLetters || '—'} : {game.opponentLetters || '—'}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function NearbySkaterCard({
  candidate, action, selected, onSelect, disabled,
}: {
  candidate: Candidate;
  action: string;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <article className={`flex items-center gap-3 rounded-xl border p-3 ${
      selected ? 'border-cyan-600 bg-cyan-950/30' : 'border-neutral-800 bg-neutral-950/60'
    }`}>
      <UserAvatar user={candidate} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-white">{userName(candidate)}</p>
        <p className="truncate text-xs text-neutral-400">@{candidate.username}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-cyan-200">
          <MdLocationOn /> ~{approximateDistance(candidate.distanceMeters)} m
        </p>
      </div>
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black uppercase transition-colors disabled:opacity-50 ${
          selected ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-cyan-600 text-white hover:bg-cyan-700'
        }`}
      >
        {action}
      </button>
    </article>
  );
}

function UserAvatar({ user }: { user: PublicUser }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-800 text-sm font-black text-cyan-200">
      {user.photo ? (
        <img src={user.photo} alt="" className="h-full w-full object-cover" />
      ) : (
        (userName(user).charAt(0) || 'S').toUpperCase()
      )}
    </span>
  );
}

function approximateDistance(distanceMeters: number) {
  return Math.max(10, Math.round(distanceMeters / 10) * 10);
}

function userName(user: PublicUser) {
  return user.name || user.username || 'Skater';
}

function statusTranslationKey(status: string) {
  const keys: Record<string, string> = {
    PENDING_ACCEPTANCE: 'statusPending',
    READY: 'statusReady',
    IN_PROGRESS: 'statusPlaying',
    AWAITING_REPORT: 'statusAwaitingReport',
    COMPLETED: 'statusCompleted',
    CANCELLED: 'statusCancelled',
  };
  return keys[status] || 'statusPending';
}

function statusClass(status: string) {
  if (status === 'COMPLETED') return 'bg-green-950 text-green-300';
  if (status === 'IN_PROGRESS' || status === 'AWAITING_REPORT') return 'bg-cyan-950 text-cyan-300';
  if (status === 'CANCELLED') return 'bg-neutral-800 text-neutral-500';
  return 'bg-amber-950 text-amber-300';
}

function isResponse(value: unknown): value is { success?: boolean; data?: unknown; error?: unknown } {
  return Boolean(value && typeof value === 'object' && 'success' in value);
}

function getData(response: { data?: unknown }): Record<string, unknown> {
  return response.data && typeof response.data === 'object'
    ? response.data as Record<string, unknown>
    : {};
}

function getError(response: unknown) {
  if (!response || typeof response !== 'object' || !('error' in response)) return '';
  const error = response.error;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return '';
}
