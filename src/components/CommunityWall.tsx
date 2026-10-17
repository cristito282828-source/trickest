'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createSlug } from '@/lib/utils/slug';
import WallComments from '@/components/WallComments';
import {
  MdCampaign,
  MdEmojiEvents,
  MdGroups,
  MdLocationOn,
  MdOutlinePlayCircle,
  MdPersonAddAlt1,
  MdShoppingBag,
  MdSkateboarding,
} from 'react-icons/md';

type ActivityType =
  | 'user_joined'
  | 'team_created'
  | 'challenge_created'
  | 'submission_approved'
  | 'spot_added'
  | 'product_added';

type SpotType = 'skatepark' | 'skateshop' | 'spot';
type ReactionType = 'LIKE' | 'LOVE' | 'LAUGH' | 'WOW' | 'ANGRY';

interface ReactionState {
  reactionCounts: Record<ReactionType, number>;
  userReaction: ReactionType | null;
}

interface Activity {
  id: string;
  wallActivityId: number | undefined;
  type: ActivityType;
  createdAt: string;
  actor: {
    name: string;
    photo: string | null;
    username: string | null;
    isOfficial?: boolean;
  };
  titleName: string;
  image?: string | null;
  level?: number;
  points?: number;
  videoUrl?: string;
  productSlug?: string;
  productIsNew?: boolean;
  isCurrentChallenge?: boolean;
  spotId?: number;
  spotType?: SpotType;
  city?: string | null;
  country?: string;
  reactionCounts: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  commentCount: number;
}

interface CommunityWallProps {
  activities: Activity[];
  stats: { memberCount: number; teamCount: number; challengeCount: number };
  currentUser: { name: string; photo: string | null };
}

type Filter = 'all' | 'community' | 'challenges' | 'videos' | 'products' | 'spots';

const activityStyles: Record<ActivityType, { icon: typeof MdCampaign; color: string }> = {
  user_joined: { icon: MdPersonAddAlt1, color: 'bg-sky-100 text-sky-700' },
  team_created: { icon: MdGroups, color: 'bg-violet-100 text-violet-700' },
  challenge_created: { icon: MdEmojiEvents, color: 'bg-amber-100 text-amber-700' },
  submission_approved: { icon: MdOutlinePlayCircle, color: 'bg-emerald-100 text-emerald-700' },
  spot_added: { icon: MdLocationOn, color: 'bg-rose-100 text-rose-700' },
  product_added: { icon: MdShoppingBag, color: 'bg-fuchsia-100 text-fuchsia-700' },
};

const reactionOptions: { type: ReactionType; emoji: string; label: `reaction${string}` }[] = [
  { type: 'LIKE', emoji: '👍', label: 'reactionLike' },
  { type: 'LOVE', emoji: '❤️', label: 'reactionLove' },
  { type: 'LAUGH', emoji: '😂', label: 'reactionLaugh' },
  { type: 'WOW', emoji: '😮', label: 'reactionWow' },
  { type: 'ANGRY', emoji: '😡', label: 'reactionAngry' },
];

const emptyReactionState: ReactionState = {
  reactionCounts: { LIKE: 0, LOVE: 0, LAUGH: 0, WOW: 0, ANGRY: 0 },
  userReaction: null,
};

function Avatar({
  photo,
  name,
  size = 44,
  isOfficial = false,
}: {
  photo: string | null;
  name: string;
  size?: number;
  isOfficial?: boolean;
}) {
  return photo ? (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        isOfficial ? 'border-2 border-cyan-600 bg-neutral-900 p-1' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <Image
        src={photo}
        alt={name}
        width={size}
        height={size}
        unoptimized
        className={`h-full w-full rounded-full ${isOfficial ? 'object-contain' : 'object-cover'}`}
      />
    </span>
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-black text-neutral-600"
      style={{ width: size, height: size }}
      aria-label={name}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function CommunityWall({ activities, stats, currentUser }: CommunityWallProps) {
  const t = useTranslations('communityWall');
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>('all');
  const [reactionStates, setReactionStates] = useState<Record<number, ReactionState>>(
    () => activities.reduce<Record<number, ReactionState>>((states, activity) => {
      if (activity.wallActivityId !== undefined) {
        states[activity.wallActivityId] = {
          reactionCounts: activity.reactionCounts,
          userReaction: activity.userReaction,
        };
      }
      return states;
    }, {})
  );
  const [savingReactionId, setSavingReactionId] = useState<number | null>(null);
  const [reactionErrorId, setReactionErrorId] = useState<number | null>(null);

  const visibleActivities = useMemo(() => activities.filter((activity) => {
    if (filter === 'all') return true;
    if (filter === 'challenges') return activity.type === 'challenge_created';
    if (filter === 'videos') return activity.type === 'submission_approved';
    if (filter === 'products') return activity.type === 'product_added';
    if (filter === 'spots') return activity.type === 'spot_added';
    return activity.type === 'user_joined' || activity.type === 'team_created' || activity.type === 'spot_added';
  }), [activities, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t('all') },
    { id: 'community', label: t('community') },
    { id: 'challenges', label: t('challenges') },
    { id: 'videos', label: t('videos') },
    { id: 'products', label: t('products') },
    { id: 'spots', label: t('spots') },
  ];

  const formatTime = (date: string) => {
    const elapsed = Math.max(0, Date.now() - new Date(date).getTime());
    const minutes = Math.floor(elapsed / 60_000);
    if (minutes < 1) return t('justNow');
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-minutes, 'minute');
    const days = Math.floor(hours / 24);
    if (days < 1) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-hours, 'hour');
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-days, 'day');
  };

  const activityTitle = (activity: Activity) => {
    switch (activity.type) {
      case 'user_joined':
        return t('joined', { name: activity.titleName });
      case 'team_created':
        return t('teamCreated', { name: activity.titleName });
      case 'challenge_created':
        return t('challengeCreated', { name: activity.titleName });
      case 'submission_approved':
        return t('submissionApproved', { name: activity.actor.name });
      case 'spot_added':
        if (activity.spotType === 'skateshop') {
          return t('skateshopAdded', { name: activity.actor.name, spot: activity.titleName });
        }
        if (activity.spotType === 'spot') {
          return t('streetSpotAdded', { name: activity.actor.name, spot: activity.titleName });
        }
        return t('skateparkAdded', { name: activity.actor.name, spot: activity.titleName });
      case 'product_added':
        return activity.productIsNew
          ? t('productAdded', { name: activity.titleName })
          : t('productFeatured', { name: activity.titleName });
    }
  };

  const actorHref = (username: string | null) => username ? `/profile/${username}` : null;

  const handleReaction = async (activity: Activity, reaction: ReactionType) => {
    const activityId = activity.wallActivityId;
    if (activityId === undefined || savingReactionId !== null) return;

    setSavingReactionId(activityId);
    setReactionErrorId(null);
    try {
      const currentReaction = reactionStates[activityId]
        ? reactionStates[activityId].userReaction
        : activity.userReaction;
      const response = await fetch(`/api/wall/${activityId}/reaction`, {
        method: currentReaction === reaction ? 'DELETE' : 'POST',
        ...(currentReaction === reaction
          ? {}
          : {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reaction }),
            }),
      });
      const result: unknown = await response.json();

      if (!response.ok || !isReactionResponse(result)) {
        throw new Error(isReactionResponse(result) ? result.error?.message : 'Unable to save reaction');
      }
      const savedReactionState = result.data;
      if (!isReactionState(savedReactionState)) {
        throw new Error('Invalid reaction response');
      }

      setReactionStates((current) => ({
        ...current,
        [activityId]: savedReactionState,
      }));
    } catch (error) {
      console.error('Error saving wall reaction:', error);
      setReactionErrorId(activityId);
    } finally {
      setSavingReactionId(null);
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f0f2f5] px-4 py-6 pb-28 lg:px-8 lg:pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section aria-label={t('title')}>
            <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar photo={currentUser.photo} name={currentUser.name} />
                <div className="min-w-0 flex-1 rounded-full bg-neutral-100 px-4 py-3 text-sm text-neutral-500">
                  {t('composerPlaceholder')}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
                  <MdCampaign className="text-xl text-purple-600" />
                  <span>{t('composerTitle')}</span>
                </div>
                <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                  {t('premiumOnly')}
                </span>
              </div>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  aria-pressed={filter === item.id}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                    filter === item.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="font-black text-neutral-800">{t('communityTitle')}</h2>
              <span className="text-xs font-semibold text-neutral-500">
                {t('activityCount', { count: visibleActivities.length })}
              </span>
            </div>

            {visibleActivities.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
                <MdSkateboarding className="mx-auto mb-3 text-4xl text-cyan-600" />
                <h3 className="font-black text-neutral-800">{t('emptyTitle')}</h3>
                <p className="mt-1 text-sm text-neutral-500">{t('emptyDescription')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleActivities.map((activity) => {
                  const style = activityStyles[activity.type];
                  const Icon = style.icon;
                  const href = actorHref(activity.actor.username);
                  const reactionState = activity.wallActivityId !== undefined
                    ? reactionStates[activity.wallActivityId] ?? {
                        reactionCounts: activity.reactionCounts,
                        userReaction: activity.userReaction,
                      }
                    : emptyReactionState;

                  return (
                    <article key={activity.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {href ? (
                            <Link href={href} aria-label={t('openProfile')}>
                              <Avatar
                                photo={activity.actor.photo}
                                name={activity.actor.name}
                                isOfficial={activity.actor.isOfficial}
                              />
                            </Link>
                          ) : (
                            <Avatar
                              photo={activity.actor.photo}
                              name={activity.actor.name}
                              isOfficial={activity.actor.isOfficial}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-1 text-sm text-neutral-800">
                              {href ? (
                                <Link href={href} className="font-extrabold hover:text-cyan-700 hover:underline">
                                  {activity.actor.name}
                                </Link>
                              ) : (
                                <span className="font-extrabold">{activity.actor.name}</span>
                              )}
                              {activity.actor.isOfficial && (
                                <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-cyan-800">
                                  {t('official')}
                                </span>
                              )}
                              <span>{activityTitle(activity)}</span>
                            </div>
                            <time dateTime={activity.createdAt} className="text-xs text-neutral-500">
                              {formatTime(activity.createdAt)}
                            </time>
                          </div>
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.color}`}>
                            <Icon className="text-xl" />
                          </span>
                        </div>

                        {activity.type === 'challenge_created' && (
                          <div className="mt-4 overflow-hidden rounded-xl border border-amber-100 bg-amber-50">
                            {activity.isCurrentChallenge && (
                              <div className="border-b border-amber-100 bg-amber-100 px-4 py-2">
                                <span className="rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                                  {t('currentChallenge')}
                                </span>
                              </div>
                            )}
                            {activity.image ? (
                              <div className="relative aspect-square w-full bg-neutral-900">
                                <Image
                                  src={activity.image}
                                  alt={activity.titleName}
                                  fill
                                  unoptimized
                                  sizes="(max-width: 1024px) 100vw, 700px"
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                  <p className="text-lg font-black text-white drop-shadow">{activity.titleName}</p>
                                  <p className="mt-1 text-sm font-semibold text-amber-200">
                                    {t('challengeLevel', { level: activity.level ?? 0, points: activity.points ?? 0 })}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4">
                                <p className="font-black text-neutral-900">{activity.titleName}</p>
                                <p className="mt-1 text-sm font-semibold text-amber-800">
                                  {t('challengeLevel', { level: activity.level ?? 0, points: activity.points ?? 0 })}
                                </p>
                              </div>
                            )}
                            <div className="flex justify-end border-t border-amber-100 bg-white p-3">
                              <Link
                                href={`/dashboard/skaters/tricks/${encodeURIComponent(activity.titleName)}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-amber-600"
                              >
                                <MdSkateboarding className="text-lg" />
                                {t('playChallenge')}
                              </Link>
                            </div>
                          </div>
                        )}

                        {activity.type === 'product_added' && (
                          <div className="mt-4 overflow-hidden rounded-xl border border-fuchsia-100 bg-fuchsia-50">
                            {activity.image ? (
                              <div className="relative aspect-square w-full bg-neutral-900">
                                <Image
                                  src={activity.image}
                                  alt={activity.titleName}
                                  fill
                                  unoptimized
                                  sizes="(max-width: 1024px) 100vw, 700px"
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                <span className="absolute left-3 top-3 rounded-md bg-fuchsia-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                                  {activity.productIsNew ? t('newProduct') : t('featuredProductBadge')}
                                </span>
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                  <p className="text-lg font-black text-white drop-shadow">{activity.titleName}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4">
                                <span className="mb-2 inline-block rounded-md bg-fuchsia-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                                  {activity.productIsNew ? t('newProduct') : t('featuredProductBadge')}
                                </span>
                                <p className="font-black text-neutral-900">{activity.titleName}</p>
                              </div>
                            )}
                            <div className="flex justify-end border-t border-fuchsia-100 bg-white p-3">
                              <Link
                                href={activity.productSlug
                                  ? `/suppls?product=${encodeURIComponent(activity.productSlug)}`
                                  : '/suppls'}
                                className="inline-flex items-center gap-2 rounded-lg bg-fuchsia-700 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-fuchsia-800"
                              >
                                <MdShoppingBag className="text-lg" />
                                {t('viewProduct')}
                              </Link>
                            </div>
                          </div>
                        )}

                        {activity.type === 'team_created' && (
                          <div className="mt-4 flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4">
                            {activity.image ? (
                              <Image src={activity.image} alt="" width={56} height={56} unoptimized className="h-14 w-14 rounded-xl object-cover" />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-200 text-violet-800">
                                <MdGroups className="text-3xl" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-violet-700">{t('team')}</p>
                              <p className="truncate font-black text-neutral-900">{activity.titleName}</p>
                            </div>
                            <Link
                              href={`/teams/${createSlug(activity.titleName)}`}
                              className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white hover:bg-violet-800"
                            >
                              {t('openTeam')}
                            </Link>
                          </div>
                        )}

                        {activity.type === 'submission_approved' && (
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                            <div>
                              <p className="font-black text-neutral-900">
                                {t('approvedVideo', { name: activity.titleName })}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-emerald-800">{t('videos')}</p>
                            </div>
                            {activity.videoUrl && (
                              <a
                                href={activity.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                              >
                                <MdOutlinePlayCircle className="text-lg" />
                                {t('watchVideo')}
                              </a>
                            )}
                          </div>
                        )}

                        {activity.type === 'spot_added' && (
                          <div className="mt-4 overflow-hidden rounded-xl border border-rose-100 bg-rose-50">
                            {activity.image && (
                              <div className="relative aspect-square w-full bg-neutral-900">
                                <Image
                                  src={activity.image}
                                  alt={activity.titleName}
                                  fill
                                  unoptimized
                                  sizes="(max-width: 1024px) 100vw, 700px"
                                  className="object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                                  <p className="font-black text-white">{activity.titleName}</p>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-2 p-4 text-sm font-semibold text-rose-900">
                              <MdLocationOn className="shrink-0 text-xl" />
                              <div className="min-w-0 flex-1">
                                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-rose-700">
                                  {activity.spotType === 'skateshop'
                                    ? t('skateshop')
                                    : activity.spotType === 'spot'
                                      ? t('streetSpot')
                                      : t('skatepark')}
                                </span>
                                {!activity.image && (
                                  <span className="mb-1 block font-black text-neutral-900">{activity.titleName}</span>
                                )}
                                <span className="block">
                                  {activity.city
                                    ? t('location', { city: activity.city, country: activity.country || 'Colombia' })
                                    : t('unknownLocation')}
                                </span>
                              </div>
                              {activity.spotId && (
                                <Link
                                  href={`/spots?spot=${activity.spotId}`}
                                  className="shrink-0 rounded-lg bg-rose-700 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-rose-800"
                                >
                                  {t('viewOnMap')}
                                </Link>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 border-t border-neutral-100 pt-3">
                          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('reactions')}>
                            {reactionOptions.map((option) => {
                              const count = reactionState.reactionCounts[option.type];
                              const selected = reactionState.userReaction === option.type;

                              return (
                                <button
                                  key={option.type}
                                  type="button"
                                  title={t(option.label)}
                                  aria-label={`${t(option.label)} (${count})`}
                                  aria-pressed={selected}
                                  disabled={activity.wallActivityId === undefined || savingReactionId !== null}
                                  onClick={() => handleReaction(activity, option.type)}
                                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-wait disabled:opacity-60 ${
                                    selected
                                      ? 'border-cyan-300 bg-cyan-50 font-bold text-cyan-800'
                                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-cyan-200 hover:bg-neutral-50'
                                  }`}
                                >
                                  <span aria-hidden="true">{option.emoji}</span>
                                  <span>{count > 0 ? count : t(option.label)}</span>
                                </button>
                              );
                            })}
                          </div>
                          {reactionErrorId === activity.wallActivityId && (
                            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                              {t('reactionError')}
                            </p>
                          )}
                        </div>
                        <WallComments
                          activityId={activity.wallActivityId}
                          initialCount={activity.commentCount}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-black text-neutral-900">{t('communityTitle')}</h2>
              <div className="space-y-3">
                <Stat icon={<MdPersonAddAlt1 />} label={t('memberCount', { count: stats.memberCount })} />
                <Stat icon={<MdGroups />} label={t('teamCount', { count: stats.teamCount })} />
                <Stat icon={<MdEmojiEvents />} label={t('challengeCount', { count: stats.challengeCount })} />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-black text-neutral-900">{t('shortcuts')}</h2>
              <div className="space-y-1">
                <Shortcut href="/dashboard/teams" icon={<MdGroups />} label={t('teamsShortcut')} />
                <Shortcut href="/dashboard/leaderboard" icon={<MdEmojiEvents />} label={t('rankingShortcut')} />
                <Shortcut href="/dashboard/skaters/tricks" icon={<MdSkateboarding />} label={t('challengesShortcut')} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function isReactionState(value: unknown): value is ReactionState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { reactionCounts?: unknown; userReaction?: unknown };
  const counts = candidate.reactionCounts;
  const validReaction = (reaction: unknown): reaction is ReactionType =>
    reactionOptions.some((option) => option.type === reaction);

  if (!counts || typeof counts !== 'object') return false;
  const countValues = counts as Record<string, unknown>;
  return Boolean(
      reactionOptions.every(({ type }) => typeof countValues[type] === 'number') &&
      (candidate.userReaction === null || validReaction(candidate.userReaction))
  );
}

function isReactionResponse(value: unknown): value is {
  success: boolean;
  data?: unknown;
  error?: { message?: string };
} {
  return Boolean(value && typeof value === 'object' && 'success' in value);
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-neutral-700">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-lg text-cyan-700">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Shortcut({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-100">
      <span className="text-xl text-cyan-700">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
