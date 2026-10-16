'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { MdArrowBack, MdCheckCircle, MdGavel, MdLocationOn, MdSportsScore } from 'react-icons/md';

type PlayerRole = 'challenger' | 'opponent';

interface PublicUser {
  username: string | null;
  name: string | null;
  photo: string | null;
}

interface GameTurn {
  id: number;
  turnNumber: number;
  attemptedBy: PublicUser;
  trickName: string;
  landed: boolean;
  letterAwardedTo: PublicUser | null;
  judgeNote: string | null;
  createdAt: string;
}

interface SkateGame {
  id: number;
  status: string;
  createdAt: string;
  challengerAcceptedAt: string | null;
  opponentAcceptedAt: string | null;
  judgeAcceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  challengerLetters: string;
  opponentLetters: string;
  judgeReport: string | null;
  challenger: PublicUser;
  opponent: PublicUser;
  judge: PublicUser;
  winner: PublicUser | null;
  loser: PublicUser | null;
  spot: { id: number; name: string; type: string; city: string | null } | null;
  turns: GameTurn[];
  checkIns: { username: string | null; name: string | null; checkedInAt: string; accuracyMeters: number }[];
  myCheckIn: boolean;
  myRating: { id: number; score: number; comment: string | null } | null;
  viewerRole: 'challenger' | 'opponent' | 'judge';
}

interface JudgeRatingSummary {
  average: number | null;
  count: number;
}

export default function SkateGameWorkspace({ gameId }: { gameId: string }) {
  const { data: session } = useSession();
  const t = useTranslations('skateGamesPage');
  const [game, setGame] = useState<SkateGame | null>(null);
  const [judgeRating, setJudgeRating] = useState<JudgeRatingSummary>({ average: null, count: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attemptedBy, setAttemptedBy] = useState<PlayerRole>('challenger');
  const [trickName, setTrickName] = useState('');
  const [landed, setLanded] = useState(true);
  const [letterAwardedTo, setLetterAwardedTo] = useState('');
  const [judgeNote, setJudgeNote] = useState('');
  const [winner, setWinner] = useState<PlayerRole>('challenger');
  const [report, setReport] = useState('');
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const loadGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/skate-games/${gameId}`);
      const result: unknown = await response.json();
      if (!response.ok || !isResponse(result)) throw new Error(getError(result) || t('loadError'));
      const data = getData(result);
      if (!data.game || typeof data.game !== 'object') throw new Error(t('loadError'));
      setGame(data.game as SkateGame);
      if (data.judgeRating && typeof data.judgeRating === 'object') {
        setJudgeRating(data.judgeRating as JudgeRatingSummary);
      }
    } catch (loadError) {
      console.error('Error loading skate game:', loadError);
      setError(loadError instanceof Error ? loadError.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [gameId, t]);

  useEffect(() => {
    void loadGame();
    const interval = setInterval(() => void loadGame(), 15_000);
    return () => clearInterval(interval);
  }, [loadGame]);

  const requestAction = async (path: string, body: unknown, successMessage?: string): Promise<boolean> => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/skate-games/${gameId}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result: unknown = await response.json();
      if (!response.ok || !isResponse(result)) throw new Error(getError(result) || t('actionError'));
      if (successMessage) setSuccess(successMessage);
      await loadGame();
      return true;
    } catch (actionError) {
      console.error(`Error in skate game action (${path}):`, actionError);
      setError(actionError instanceof Error ? actionError.message : t('actionError'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const checkIn = () => {
    if (!navigator.geolocation) {
      setError(t('geolocationUnavailable'));
      return;
    }
    setBusy(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await requestAction('check-in', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }, t('checkedIn'));
      },
      (geolocationError) => {
        console.error('Could not access device location:', geolocationError);
        setError(geolocationError.code === geolocationError.PERMISSION_DENIED
          ? t('locationPermissionDenied')
          : t('locationError'));
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 }
    );
  };

  const submitTurn = (event: React.FormEvent) => {
    event.preventDefault();
    void requestAction('turns', {
      attemptedBy,
      trickName,
      landed,
      letterAwardedTo: landed ? null : letterAwardedTo || null,
      judgeNote: judgeNote.trim(),
    }, t('turnRecorded')).then((saved) => {
      if (!saved) return;
      setTrickName('');
      setJudgeNote('');
      setLetterAwardedTo('');
      setLanded(true);
    });
  };

  if (loading) return <main className="p-10 text-center text-neutral-300">{t('loading')}</main>;
  if (!game) {
    return (
      <main className="min-h-screen bg-neutral-950 p-8 text-center text-white">
        <p className="mb-4">{error || t('notFound')}</p>
        <Link href="/dashboard/skate-games" className="font-bold text-cyan-300">{t('backToGames')}</Link>
      </main>
    );
  }

  const isPlayer = game.viewerRole !== 'judge';
  const invitedRole = game.viewerRole === 'opponent' && !game.opponentAcceptedAt
    ? 'opponent'
    : game.viewerRole === 'judge' && !game.judgeAcceptedAt
      ? 'judge'
      : null;
  const didReachSkate = game.challengerLetters.length === 5 || game.opponentLetters.length === 5;

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard/skate-games" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-100">
          <MdArrowBack /> {t('backToGames')}
        </Link>
        {(error || success) && (
          <p role={error ? 'alert' : 'status'} className={`mb-4 rounded-xl border p-3 text-sm font-semibold ${
            error ? 'border-red-700 bg-red-950 text-red-200' : 'border-green-700 bg-green-950 text-green-200'
          }`}>{error || success}</p>
        )}

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black uppercase md:text-3xl">{t('gameTitle')}</h1>
              <p className="mt-2 flex items-center gap-1 text-sm text-neutral-300">
                <MdLocationOn /> {game.spot
                  ? `${game.spot.name}${game.spot.city ? ` · ${game.spot.city}` : ''}`
                  : t('challengerLocation')}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClass(game.status)}`}>
              {t(statusTranslationKey(game.status))}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <PlayerCard
              label={t('challenger')}
              user={game.challenger}
              letters={game.challengerLetters}
              checkedIn={hasCheckedIn(game, game.challenger)}
            />
            <PlayerCard
              label={t('opponent')}
              user={game.opponent}
              letters={game.opponentLetters}
              checkedIn={hasCheckedIn(game, game.opponent)}
            />
          </div>
          <div className="mt-4 rounded-xl border border-purple-900 bg-purple-950/40 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-purple-200">
              <MdGavel /> {t('assignedJudge')}: {userName(game.judge)}
            </p>
            {judgeRating.count > 0 && (
              <p className="mt-1 text-xs text-purple-300">
                {t('judgeRatingSummary', { score: judgeRating.average?.toFixed(1) || '0', count: judgeRating.count })}
              </p>
            )}
          </div>

          {game.status === 'PENDING_ACCEPTANCE' && (
            <div className="mt-5 rounded-xl border border-amber-900 bg-amber-950/40 p-4">
              <p className="mb-3 text-sm text-amber-200">
                {t('acceptanceStatus', {
                  opponent: game.opponentAcceptedAt ? t('accepted') : t('waiting'),
                  judge: game.judgeAcceptedAt ? t('accepted') : t('waiting'),
                })}
              </p>
              {invitedRole && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void requestAction('respond', { accept: true }, t('acceptedGame'))}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-black hover:bg-green-700 disabled:opacity-50"
                  >
                    {t('accept')}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void requestAction('respond', { accept: false }, t('declinedGame'))}
                    className="rounded-lg bg-neutral-700 px-4 py-2 text-sm font-bold hover:bg-neutral-600 disabled:opacity-50"
                  >
                    {t('decline')}
                  </button>
                </div>
              )}
              {game.viewerRole === 'challenger' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void requestAction('respond', { accept: false }, t('cancelledGame'))}
                  className="rounded-lg bg-neutral-700 px-4 py-2 text-sm font-bold hover:bg-neutral-600 disabled:opacity-50"
                >
                  {t('cancelGame')}
                </button>
              )}
            </div>
          )}

          {game.status === 'READY' && (
            <div className="mt-5 rounded-xl border border-cyan-900 bg-cyan-950/40 p-4">
              <p className="mb-3 text-sm text-cyan-100">{t('checkInDescription')}</p>
              <p className="mb-3 text-xs text-cyan-200">
                {t('checkInProgress', { count: game.checkIns.filter((checkIn) =>
                  Date.now() - new Date(checkIn.checkedInAt).getTime() <= 15 * 60_000
                ).length, total: 3 })}
              </p>
              {!game.myCheckIn && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={checkIn}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-black hover:bg-cyan-700 disabled:opacity-50"
                >
                  {busy ? t('checkingIn') : t('checkIn')}
                </button>
              )}
              {game.myCheckIn && <p className="flex items-center gap-2 text-sm font-bold text-green-300"><MdCheckCircle /> {t('alreadyCheckedIn')}</p>}
            </div>
          )}

          {(game.status === 'IN_PROGRESS' || game.status === 'AWAITING_REPORT') && (
            <section className="mt-6">
              <div className="mb-4 flex items-center gap-2">
                <MdSportsScore className="text-2xl text-cyan-300" />
                <h2 className="text-lg font-black">{t('turnHistory', { count: game.turns.length })}</h2>
              </div>
              {game.turns.length ? (
                <ol className="space-y-2">
                  {game.turns.map((turn) => (
                    <li key={turn.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">#{turn.turnNumber} · {turn.trickName} · {userName(turn.attemptedBy)}</p>
                        <span className={turn.landed ? 'text-green-300' : 'text-amber-300'}>
                          {turn.landed ? t('landed') : t('missed')}
                          {turn.letterAwardedTo && ` · ${t('letterAwarded', { name: userName(turn.letterAwardedTo) })}`}
                        </span>
                      </div>
                      {turn.judgeNote && <p className="mt-1 text-xs text-neutral-400">{turn.judgeNote}</p>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-xl bg-neutral-950 p-4 text-sm text-neutral-400">{t('noTurns')}</p>
              )}

              {game.viewerRole === 'judge' && game.status === 'IN_PROGRESS' && (
                <form onSubmit={submitTurn} className="mt-5 grid gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                  <h3 className="font-black">{t('recordTurn')}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-neutral-300">
                      {t('attemptedBy')}
                      <select value={attemptedBy} onChange={(event) => setAttemptedBy(event.target.value as PlayerRole)} className={inputClass}>
                        <option value="challenger">{userName(game.challenger)}</option>
                        <option value="opponent">{userName(game.opponent)}</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold text-neutral-300">
                      {t('trickName')}
                      <input value={trickName} onChange={(event) => setTrickName(event.target.value)} maxLength={80} required className={inputClass} />
                    </label>
                  </div>
                  <label className="text-xs font-bold text-neutral-300">
                    {t('attemptResult')}
                    <select value={landed ? 'landed' : 'missed'} onChange={(event) => setLanded(event.target.value === 'landed')} className={inputClass}>
                      <option value="landed">{t('landed')}</option>
                      <option value="missed">{t('missed')}</option>
                    </select>
                  </label>
                  {!landed && (
                    <label className="text-xs font-bold text-neutral-300">
                      {t('awardLetter')}
                      <select value={letterAwardedTo} onChange={(event) => setLetterAwardedTo(event.target.value)} className={inputClass}>
                        <option value="">{t('noLetter')}</option>
                        <option value="challenger">{userName(game.challenger)} · {t('letters', { letters: game.challengerLetters || '—' })}</option>
                        <option value="opponent">{userName(game.opponent)} · {t('letters', { letters: game.opponentLetters || '—' })}</option>
                      </select>
                    </label>
                  )}
                  <label className="text-xs font-bold text-neutral-300">
                    {t('judgeNote')}
                    <textarea value={judgeNote} onChange={(event) => setJudgeNote(event.target.value)} maxLength={500} rows={2} className={inputClass} />
                  </label>
                  <button type="submit" disabled={busy || !trickName.trim()} className="rounded-lg bg-cyan-600 px-4 py-2 font-black hover:bg-cyan-700 disabled:opacity-50">
                    {busy ? t('saving') : t('saveTurn')}
                  </button>
                </form>
              )}
              {game.viewerRole === 'judge' && game.turns.length > 0 && (
                <ReportForm
                  busy={busy}
                  winner={winner}
                  setWinner={setWinner}
                  report={report}
                  setReport={setReport}
                  submit={() => void requestAction('report', { winner, report }, t('reportSubmitted'))}
                />
              )}
              {didReachSkate && game.status === 'AWAITING_REPORT' && (
                <p className="mt-3 rounded-lg bg-amber-950 p-3 text-sm font-bold text-amber-200">{t('skateReached')}</p>
              )}
            </section>
          )}

          {game.status === 'COMPLETED' && (
            <section className="mt-6 space-y-4 rounded-xl border border-green-900 bg-green-950/30 p-4">
              <div>
                <h2 className="text-lg font-black text-green-200">{t('finalResult')}</h2>
                <p className="mt-1 text-sm">{t('winnerIs', { name: userName(game.winner || game.challenger) })}</p>
                <p className="mt-1 text-sm text-neutral-300">
                  {t('finalLetters', { first: game.challengerLetters || '—', second: game.opponentLetters || '—' })}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-950 p-4">
                <p className="mb-1 flex items-center gap-2 text-sm font-black text-purple-200"><MdGavel /> {t('judgeReport')}</p>
                <p className="whitespace-pre-wrap text-sm text-neutral-300">{game.judgeReport}</p>
              </div>
              {isPlayer && !game.myRating && (
                <RatingForm
                  score={ratingScore}
                  setScore={setRatingScore}
                  comment={ratingComment}
                  setComment={setRatingComment}
                  busy={busy}
                  submit={() => void requestAction('rating', { score: ratingScore, comment: ratingComment }, t('ratingSaved'))}
                />
              )}
              {game.myRating && <p className="text-sm font-bold text-cyan-200">{t('youRatedJudge', { score: game.myRating.score })}</p>}
              {judgeRating.count > 0 && (
                <p className="text-sm text-purple-200">
                  {t('judgeRatingSummary', { score: judgeRating.average?.toFixed(1) || '0', count: judgeRating.count })}
                </p>
              )}
            </section>
          )}

          {game.status === 'CANCELLED' && <p className="mt-5 rounded-lg bg-neutral-950 p-4 text-sm text-neutral-400">{t('cancelledDescription')}</p>}
        </section>
      </div>
    </main>
  );
}

function PlayerCard({ label, user, letters, checkedIn }: { label: string; user: PublicUser; letters: string; checkedIn: boolean }) {
  const t = useTranslations('skateGamesPage');
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 font-black">{userName(user)}</p>
      <p className="mt-2 text-2xl font-black tracking-[0.3em] text-cyan-300">{letters || '—'}</p>
      <p className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
        {checkedIn ? <MdCheckCircle className="text-green-400" /> : <MdLocationOn />}
        {checkedIn ? t('presentAtSpot') : t('notCheckedIn')}
      </p>
    </div>
  );
}

function ReportForm({
  busy, winner, setWinner, report, setReport, submit,
}: {
  busy: boolean;
  winner: PlayerRole;
  setWinner: (role: PlayerRole) => void;
  report: string;
  setReport: (value: string) => void;
  submit: () => void;
}) {
  const t = useTranslations('skateGamesPage');
  return (
    <div className="mt-5 rounded-xl border border-purple-900 bg-purple-950/30 p-4">
      <h3 className="mb-3 flex items-center gap-2 font-black text-purple-200"><MdGavel /> {t('judgeReport')}</h3>
      <label className="mb-3 block text-xs font-bold text-neutral-300">
        {t('chooseWinner')}
        <select value={winner} onChange={(event) => setWinner(event.target.value as PlayerRole)} className={inputClass}>
          <option value="challenger">{t('challenger')}</option>
          <option value="opponent">{t('opponent')}</option>
        </select>
      </label>
      <label className="mb-3 block text-xs font-bold text-neutral-300">
        {t('reportDetails')}
        <textarea value={report} onChange={(event) => setReport(event.target.value)} minLength={10} maxLength={3000} rows={4} className={inputClass} />
      </label>
      <button
        type="button"
        onClick={submit}
        disabled={busy || report.trim().length < 10}
        className="rounded-lg bg-purple-600 px-4 py-2 font-black hover:bg-purple-700 disabled:opacity-50"
      >
        {busy ? t('saving') : t('submitReport')}
      </button>
    </div>
  );
}

function RatingForm({
  score, setScore, comment, setComment, busy, submit,
}: {
  score: number;
  setScore: (score: number) => void;
  comment: string;
  setComment: (comment: string) => void;
  busy: boolean;
  submit: () => void;
}) {
  const t = useTranslations('skateGamesPage');
  return (
    <div className="rounded-xl border border-cyan-900 bg-cyan-950/30 p-4">
      <h3 className="mb-3 font-black text-cyan-200">{t('rateJudge')}</h3>
      <label className="mb-3 block text-xs font-bold text-neutral-300">
        {t('ratingScore')}
        <select value={score} onChange={(event) => setScore(Number(event.target.value))} className={inputClass}>
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
        </select>
      </label>
      <label className="mb-3 block text-xs font-bold text-neutral-300">
        {t('ratingComment')}
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} rows={2} className={inputClass} />
      </label>
      <button type="button" onClick={submit} disabled={busy} className="rounded-lg bg-cyan-600 px-4 py-2 font-black hover:bg-cyan-700 disabled:opacity-50">
        {busy ? t('saving') : t('rateJudge')}
      </button>
    </div>
  );
}

function hasCheckedIn(game: SkateGame, user: PublicUser) {
  return game.checkIns.some((checkIn) =>
    checkIn.username && checkIn.username === user.username &&
    Date.now() - new Date(checkIn.checkedInAt).getTime() <= 15 * 60_000
  );
}

function userName(user: PublicUser) {
  return user.name || user.username || 'Skater';
}

const inputClass = 'mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500';

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
