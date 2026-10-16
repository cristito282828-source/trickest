'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { MdArrowForward, MdGavel, MdLocationOn, MdSportsScore } from 'react-icons/md';

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
  const [opponentQuery, setOpponentQuery] = useState('');
  const [judgeQuery, setJudgeQuery] = useState('');
  const [opponentCandidates, setOpponentCandidates] = useState<Candidate[]>([]);
  const [judgeCandidates, setJudgeCandidates] = useState<Candidate[]>([]);
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

  useEffect(() => {
    if (selectedOpponent || opponentQuery.trim().length < 2) {
      setOpponentCandidates([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void searchUsers(opponentQuery, setOpponentCandidates, setError, t('searchError'), controller.signal);
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [opponentQuery, selectedOpponent, t]);

  useEffect(() => {
    if (selectedJudge || judgeQuery.trim().length < 2) {
      setJudgeCandidates([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void searchUsers(judgeQuery, setJudgeCandidates, setError, t('searchError'), controller.signal);
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [judgeQuery, selectedJudge, t]);

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
      setOpponentQuery('');
      setJudgeQuery('');
      await loadGames();
    } catch (createError) {
      console.error('Error creating skate game:', createError);
      setError(createError instanceof Error ? createError.message : t('createError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white md:px-8">
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
              <h2 className="text-2xl font-black uppercase tracking-tight md:text-3xl">{t('createTitle')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">{t('createDescription')}</p>
            </div>
            <span className="rounded-md border border-neutral-700 px-3 py-2 font-mono text-xs font-bold text-neutral-400">01 / 02</span>
          </div>
          <form onSubmit={createGame} className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3 rounded-xl border border-cyan-900/70 bg-cyan-950/30 p-4 text-sm leading-6 text-cyan-100 md:col-span-2">
              <MdLocationOn className="mt-0.5 shrink-0 text-xl text-cyan-300" />
              <p>{t('nearbyUsersNote')}</p>
            </div>
            <UserPicker
              step="01"
              label={t('opponent')}
              placeholder={t('searchSkater')}
              query={opponentQuery}
              candidates={opponentCandidates.filter((user) => user.username !== selectedJudge?.username)}
              selected={selectedOpponent}
              onQuery={(value) => {
                setSelectedOpponent(null);
                setOpponentQuery(value);
              }}
              onSelect={(user) => {
                setSelectedOpponent(user);
                setOpponentQuery('');
              }}
            />
            <UserPicker
              step="02"
              label={t('judge')}
              placeholder={t('searchJudge')}
              query={judgeQuery}
              candidates={judgeCandidates.filter((user) => user.username !== selectedOpponent?.username)}
              selected={selectedJudge}
              onQuery={(value) => {
                setSelectedJudge(null);
                setJudgeQuery(value);
              }}
              onSelect={(user) => {
                setSelectedJudge(user);
                setJudgeQuery('');
              }}
            />
            <button
              type="submit"
              disabled={saving || !selectedOpponent || !selectedJudge}
              className="group flex items-center justify-center gap-3 rounded-xl bg-cyan-600 px-5 py-4 font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
            >
              {saving ? t('sending') : t('sendChallenge')}
              {!saving && <MdArrowForward className="text-xl transition-transform group-hover:translate-x-1" />}
            </button>
          </form>
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

function UserPicker({
  step, label, placeholder, query, candidates, selected, onQuery, onSelect,
}: {
  step: string;
  label: string;
  placeholder: string;
  query: string;
  candidates: Candidate[];
  selected: Candidate | null;
  onQuery: (value: string) => void;
  onSelect: (user: Candidate) => void;
}) {
  const t = useTranslations('skateGamesPage');
  return (
    <div className="relative rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
      <label className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-neutral-200">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-neutral-800 font-mono text-xs text-cyan-300">{step}</span>
        {label}
      </label>
      {selected ? (
        <div className="flex items-center gap-3 rounded-lg border border-cyan-800 bg-neutral-900 p-3">
          <UserAvatar user={selected} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-white">{userName(selected)}</p>
            <p className="truncate text-xs text-neutral-400">@{selected.username}</p>
          </div>
          <button type="button" onClick={() => onQuery('')} className="shrink-0 rounded-md px-2 py-1 text-xs font-black uppercase text-cyan-300 transition-colors hover:bg-cyan-950">{t('change')}</button>
        </div>
      ) : (
        <>
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={placeholder}
            minLength={2}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-neutral-600 focus:border-cyan-500"
          />
          {query.trim().length >= 2 && candidates.length > 0 && (
            <div className="absolute inset-x-4 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl">
              {candidates.map((candidate) => (
                <button
                  key={candidate.username}
                  type="button"
                  onClick={() => onSelect(candidate)}
                  className="flex w-full items-center gap-3 border-b border-neutral-800 px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-neutral-800"
                >
                  <UserAvatar user={candidate} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{userName(candidate)}</span>
                    <span className="block truncate text-xs text-neutral-400">@{candidate.username}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-cyan-950 px-2 py-1 text-[10px] font-bold text-cyan-200">
                    ~{approximateDistance(candidate.distanceMeters)} m
                  </span>
                  {candidate.role === 'judge' && <span className="shrink-0 rounded bg-purple-900 px-1.5 py-1 text-[10px] font-black uppercase text-purple-200">{t('judge')}</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
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

async function searchUsers(
  query: string,
  setUsers: (users: Candidate[]) => void,
  setError: (message: string) => void,
  errorMessage: string,
  signal: AbortSignal
) {
  try {
    const searchParams = new URLSearchParams({ q: query.trim() });
    const response = await fetch(`/api/skate-games/users?${searchParams.toString()}`, { signal });
    const result: unknown = await response.json();
    if (!response.ok || !isResponse(result)) throw new Error(getError(result) || errorMessage);
    const users = getData(result).users;
    setUsers(Array.isArray(users) ? users as Candidate[] : []);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return;
    console.error('Error searching for game participants:', error);
    setError(error instanceof Error ? error.message : errorMessage);
    setUsers([]);
  }
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
