'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createSlug } from '@/lib/utils/slug';
import {
  MdCampaign,
  MdEmojiEvents,
  MdGroups,
  MdLocationOn,
  MdOutlinePlayCircle,
  MdPersonAddAlt1,
  MdSkateboarding,
} from 'react-icons/md';

type ActivityType =
  | 'user_joined'
  | 'team_created'
  | 'challenge_created'
  | 'submission_approved'
  | 'spot_added';

interface Activity {
  id: string;
  type: ActivityType;
  createdAt: string;
  actor: { name: string; photo: string | null; username: string | null };
  titleName: string;
  image?: string | null;
  level?: number;
  points?: number;
  videoUrl?: string;
  city?: string | null;
  country?: string;
}

interface CommunityWallProps {
  activities: Activity[];
  stats: { memberCount: number; teamCount: number; challengeCount: number };
  currentUser: { name: string; photo: string | null };
}

type Filter = 'all' | 'community' | 'challenges' | 'videos';

const activityStyles: Record<ActivityType, { icon: typeof MdCampaign; color: string }> = {
  user_joined: { icon: MdPersonAddAlt1, color: 'bg-sky-100 text-sky-700' },
  team_created: { icon: MdGroups, color: 'bg-violet-100 text-violet-700' },
  challenge_created: { icon: MdEmojiEvents, color: 'bg-amber-100 text-amber-700' },
  submission_approved: { icon: MdOutlinePlayCircle, color: 'bg-emerald-100 text-emerald-700' },
  spot_added: { icon: MdLocationOn, color: 'bg-rose-100 text-rose-700' },
};

function Avatar({ photo, name, size = 44 }: { photo: string | null; name: string; size?: number }) {
  return photo ? (
    <Image
      src={photo}
      alt={name}
      width={size}
      height={size}
      unoptimized
      className="h-11 w-11 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
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

  const visibleActivities = useMemo(() => activities.filter((activity) => {
    if (filter === 'all') return true;
    if (filter === 'challenges') return activity.type === 'challenge_created';
    if (filter === 'videos') return activity.type === 'submission_approved';
    return activity.type === 'user_joined' || activity.type === 'team_created' || activity.type === 'spot_added';
  }), [activities, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t('all') },
    { id: 'community', label: t('community') },
    { id: 'challenges', label: t('challenges') },
    { id: 'videos', label: t('videos') },
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
        return t('spotAdded', { name: activity.actor.name });
    }
  };

  const actorHref = (username: string | null) => username ? `/profile/${username}` : null;

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

                  return (
                    <article key={activity.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {href ? (
                            <Link href={href} aria-label={t('openProfile')}>
                              <Avatar photo={activity.actor.photo} name={activity.actor.name} />
                            </Link>
                          ) : (
                            <Avatar photo={activity.actor.photo} name={activity.actor.name} />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-1 text-sm text-neutral-800">
                              <span className="font-extrabold">{activity.actor.name}</span>
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
                          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                            <p className="font-black text-neutral-900">{activity.titleName}</p>
                            <p className="mt-1 text-sm font-semibold text-amber-800">
                              {t('challengeLevel', { level: activity.level ?? 0, points: activity.points ?? 0 })}
                            </p>
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
                              <Image
                                src={activity.image}
                                alt=""
                                width={720}
                                height={360}
                                unoptimized
                                className="h-48 w-full object-cover"
                              />
                            )}
                            <div className="flex items-center gap-2 p-4 text-sm font-semibold text-rose-900">
                              <MdLocationOn className="shrink-0 text-xl" />
                              <span>
                                {activity.city
                                  ? t('location', { city: activity.city, country: activity.country || 'Colombia' })
                                  : t('unknownLocation')}
                              </span>
                            </div>
                          </div>
                        )}
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
