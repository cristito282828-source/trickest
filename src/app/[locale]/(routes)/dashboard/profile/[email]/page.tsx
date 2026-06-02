"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { FaInstagram, FaTiktok, FaTwitter, FaFacebook } from 'react-icons/fa';
import { MdOutlineSkateboarding, MdLocationOn, MdGroups, MdPersonAdd, MdPersonRemove } from 'react-icons/md';
import { GiSkateboard, GiTrophy } from 'react-icons/gi';
import { Button } from '@nextui-org/react';
import { Button as ArcadeButton } from '@/components/atoms';
import { useTranslations } from 'next-intl';

interface PublicProfile {
  email: string;
  name: string | null;
  photo: string | null;
  location: string | null;
  role: string;
  memberSince: string;
  team: {
    id: number;
    name: string;
    logo: string | null;
  } | null;
  socialMedia: {
    instagram: string | null;
    tiktok: string | null;
    twitter: string | null;
    facebook: string | null;
  } | null;
  skateSetup: {
    madero: string | null;
    trucks: string | null;
    ruedas: string | null;
    rodamientos: string | null;
    tenis: string | null;
  } | null;
  stats: {
    totalScore: number;
    challengesCompleted: number;
    submissionsApproved: number;
    submissionsRejected: number;
    submissionsPending: number;
    successRate: number;
    currentStreak: number;
    bestStreak: number;
    highestDifficulty: number;
    difficultyStats: {
      easy: { completed: number; avgScore: number; totalScore: number };
      medium: { completed: number; avgScore: number; totalScore: number };
      hard: { completed: number; avgScore: number; totalScore: number };
      expert: { completed: number; avgScore: number; totalScore: number };
    };
    totalXP: number;
    achievementsUnlocked: number;
    totalAchievements: number;
  };
  achievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    unlocked: boolean;
    unlockedDate: string | null;
    xp?: number;
  }[];
  recentActivity: {
    type: string;
    challengeName: string;
    difficulty: string;
    status: string;
    score: number | null;
    date: string;
  }[];
  activitySummary: {
    thisMonth: number;
    thisWeek: number;
    lastSubmission: string | null;
  };
  socialStats: {
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
  };
}

export default function PublicProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const t = useTranslations('publicProfilePage');

  const email = params.email as string;
  const isOwnProfile = session?.user?.email === decodeURIComponent(email);

  const handleFollowToggle = async () => {
    if (!session?.user?.email || isOwnProfile) return;

    setFollowLoading(true);
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserEmail: decodeURIComponent(email) }),
      });

      if (response.ok) {
        const data = await response.json();
        setFollowing(data.action === 'follow');
        // Update follower count in profile
        if (profile) {
          setProfile({
            ...profile,
            socialStats: {
              ...profile.socialStats,
              followerCount: profile.socialStats.followerCount + (data.action === 'follow' ? 1 : -1),
              isFollowing: data.action === 'follow'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
    setFollowLoading(false);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${email}/profile`);

        if (!response.ok) {
          if (response.status === 404) {
            setError(t('userNotFound'));
          } else {
            setError(t('errorLoadingProfile'));
          }
          return;
        }

        const data = await response.json();
        setProfile(data);

        // Check if current user is following this profile
        if (session?.user?.email && session.user.email !== decodeURIComponent(email)) {
          try {
            const followResponse = await fetch(`/api/follow?user=${encodeURIComponent(email)}`);
            if (followResponse.ok) {
              const followData = await followResponse.json();
              setFollowing(followData.isFollowing);
            }
          } catch (error) {
            console.error('Error checking follow status:', error);
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError(t('errorLoadingProfile'));
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchProfile();
    }
  }, [email]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="text-xs bg-gradient-to-r from-red-500 to-accent-orange-500 text-white px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-lg shadow-red-500/50">
            {t('admin')}
          </span>
        );
      case 'judge':
        return (
          <span className="text-xs bg-gradient-to-r from-accent-yellow-500 to-accent-amber-500 text-black px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-lg shadow-accent-yellow-500/50">
            {t('judge')}
          </span>
        );
      default:
        return (
          <span className="text-xs bg-gradient-to-r from-accent-cyan-500 to-accent-blue-500 text-white px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-lg shadow-accent-cyan-500/50">
            {t('skater')}
          </span>
        );
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['', 'Ollie', 'Kickflip', 'Heelflip', '50-50', 'Boardslide', 'Pop Shuvit', '360 Flip', 'Hardflip', 'Varial Kickflip', 'Switch Kickflip'];
    return labels[difficulty] || `Level ${difficulty}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent-purple-900 via-accent-blue-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-cyan-400 mx-auto"></div>
          <p className="mt-4 text-accent-cyan-400 font-bold text-xl">{t('loadingProfile')}</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-gradient-to-r from-red-500 to-accent-orange-500 p-1 rounded-lg shadow-2xl">
          <div className="bg-neutral-900 rounded-lg p-8 text-center">
            <p className="text-red-400 font-bold text-xl">{error || t('profileNotAvailable')}</p>
            <Link
              href="/dashboard/leaderboard"
              className="inline-block mt-4 text-accent-cyan-400 hover:text-accent-cyan-300 font-bold uppercase"
            >
              {t('backToLeaderboard')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      {/* Header Card */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-1 rounded-lg shadow-2xl shadow-accent-cyan-500/30">
          <div className="bg-neutral-900 rounded-lg p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 rounded-full blur-lg opacity-50"></div>
                {profile.photo ? (
                  <Image
                    src={profile.photo}
                    alt={profile.name || 'Avatar'}
                    width={120}
                    height={120}
                    className="relative rounded-full border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-accent-cyan-500 to-accent-purple-600 flex items-center justify-center text-white font-black text-4xl border-4 border-white">
                    {profile.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-purple-400 uppercase tracking-wider">
                  {profile.name || 'Skater'}
                </h1>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                  {getRoleBadge(profile.role)}

                  {profile.location && (
                    <span className="text-neutral-400 text-sm flex items-center gap-1">
                      <MdLocationOn className="text-accent-cyan-400" />
                      {profile.location}
                    </span>
                  )}

                  {profile.team && (
                    <Link
                      href="/dashboard/teams"
                      className="text-accent-purple-400 text-sm flex items-center gap-1 hover:text-accent-purple-300"
                    >
                      <MdGroups />
                      {profile.team.name}
                    </Link>
                  )}
                </div>

                <p className="text-neutral-500 text-xs mt-2">
                  {`${t('memberSince')} ${new Date(profile.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`}
                </p>

                {/* Follow Stats */}
                <div className="flex items-center gap-6 mt-3 justify-center md:justify-start">
                  <div className="text-center">
                    <p className="text-accent-cyan-400 font-bold text-lg">{profile.socialStats?.followerCount || 0}</p>
                    <p className="text-neutral-400 text-xs">{t('followers')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-accent-cyan-400 font-bold text-lg">{profile.socialStats?.followingCount || 0}</p>
                    <p className="text-neutral-400 text-xs">{t('following')}</p>
                  </div>
                </div>
              </div>

              {/* Main Score */}
              <div className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 p-[3px] rounded-lg">
                <div className="bg-neutral-900 rounded-lg p-4 text-center">
                  <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider">{t('scoreTotal')}</p>
                  <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow-400 to-accent-orange-400">
                    {profile.stats.totalScore}
                  </p>
                </div>
              </div>
            </div>

            {/* Follow Button */}
            {!isOwnProfile && session?.user?.email && (
              <div className="mt-4 text-center md:text-right">
                <ArcadeButton
                  onClick={handleFollowToggle}
                  isLoading={followLoading}
                  variant={following ? 'danger' : 'primary'}
                  leftIcon={following ? <MdPersonRemove size={20} /> : <MdPersonAdd size={20} />}
                >
                  {following ? t('unfollow') : t('follow')}
                </ArcadeButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Stats Grid */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-[3px] rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-4 text-center h-full">
              <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider">{t('challenges')}</p>
              <p className="text-3xl font-black text-green-400">{profile.stats.challengesCompleted}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-accent-blue-500 to-accent-cyan-600 p-[3px] rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-4 text-center h-full">
              <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider">{t('successRate')}</p>
              <p className="text-3xl font-black text-accent-cyan-400">{profile.stats.successRate}%</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-accent-purple-500 to-accent-pink-600 p-[3px] rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-4 text-center h-full">
              <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider">{t('currentStreak')}</p>
              <p className="text-3xl font-black text-accent-purple-400">{profile.stats.currentStreak}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-accent-rose-500 to-red-600 p-[3px] rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-4 text-center h-full">
              <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider">{t('bestStreak')}</p>
              <p className="text-3xl font-black text-accent-rose-400">{profile.stats.bestStreak}</p>
            </div>
          </div>
        </div>

        {/* XP and Achievements Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-600 p-[3px] rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-neutral-400 text-xs uppercase font-bold tracking-wider">{t('xpTotal')}</span>
                <span className="text-accent-yellow-400 font-black">{profile.stats.totalXP.toLocaleString()}</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-3 border-2 border-neutral-700">
                <div
                  className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((profile.stats.achievementsUnlocked / profile.stats.totalAchievements) * 100, 100)}%` }}
                />
              </div>
              <p className="text-center text-white font-bold text-sm mt-2">
                {profile.stats.achievementsUnlocked}/{profile.stats.totalAchievements} {t('achievements')}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-blue-600 p-[3px] rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-4">
              <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider mb-2">{t('recentActivity')}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-300">{t('thisWeek')}</span>
                  <span className="text-accent-cyan-400 font-bold">{profile.activitySummary.thisWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-300">{t('thisMonth')}</span>
                  <span className="text-accent-cyan-400 font-bold">{profile.activitySummary.thisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-300">{t('lastSubmission')}</span>
                  <span className="text-accent-cyan-400 font-bold text-xs">
                    {profile.activitySummary.lastSubmission
                      ? new Date(profile.activitySummary.lastSubmission).toLocaleDateString('en-US')
                      : t('never')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Stats */}
        <div className="bg-gradient-to-r from-neutral-700 to-neutral-800 p-[3px] rounded-lg">
          <div className="bg-neutral-900 rounded-lg p-4">
            <h3 className="text-white font-bold text-lg mb-4 text-center uppercase tracking-wider">{t('statisticsByDifficulty')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(profile.stats.difficultyStats).map(([difficulty, stats]) => (
                <div key={difficulty} className="text-center">
                  <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider mb-1">
                    {difficulty === 'easy' ? t('easy') :
                     difficulty === 'medium' ? t('medium') :
                     difficulty === 'hard' ? t('hard') : t('expert')}
                  </p>
                  <p className="text-2xl font-black text-accent-cyan-400">{stats.completed}</p>
                  <p className="text-neutral-500 text-xs">{t('completed')}</p>
                  {stats.avgScore > 0 && (
                    <p className="text-accent-yellow-400 text-sm font-bold">{stats.avgScore} {t('avg')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Achievements */}
        <div className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 p-[3px] rounded-lg">
          <div className="bg-neutral-900 rounded-lg p-6 h-full">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow-400 to-accent-orange-400 uppercase mb-4 flex items-center gap-2">
              <GiTrophy className="text-accent-yellow-400" /> {t('achievementsUnlocked')}
            </h2>

            {profile.achievements.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {profile.achievements.map((achievement) => {
                  const rarityColors = {
                    common: 'border-neutral-500 bg-neutral-800',
                    uncommon: 'border-green-400 bg-green-900/20',
                    rare: 'border-accent-cyan-400 bg-accent-cyan-900/20',
                    epic: 'border-accent-purple-400 bg-accent-purple-900/20',
                    legendary: 'border-accent-yellow-400 bg-accent-yellow-900/20',
                    secret: 'border-accent-rose-400 bg-accent-rose-900/20',
                  };

                  return (
                    <div
                      key={achievement.id}
                      className={`border-2 rounded-lg p-3 ${rarityColors[achievement.rarity as keyof typeof rarityColors]} hover:scale-105 transition-transform`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm uppercase">{achievement.name}</p>
                          <p className="text-neutral-400 text-xs">{achievement.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${
                              achievement.rarity === 'legendary' ? 'bg-accent-yellow-500 text-black' :
                              achievement.rarity === 'epic' ? 'bg-accent-purple-500 text-white' :
                              achievement.rarity === 'rare' ? 'bg-accent-cyan-500 text-white' :
                              'bg-neutral-600 text-white'
                            }`}>
                              {achievement.rarity}
                            </span>
                            {achievement.unlockedDate && (
                              <span className="text-neutral-500 text-xs">
                                {new Date(achievement.unlockedDate).toLocaleDateString('en-US')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <GiTrophy className="text-neutral-600 text-4xl mx-auto mb-4" />
                <p className="text-neutral-500">{t('noAchievementsYet')}</p>
                <p className="text-neutral-600 text-sm mt-2">{t('submitFirstToStart')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-r from-accent-purple-500 to-accent-pink-500 p-[3px] rounded-lg">
          <div className="bg-neutral-900 rounded-lg p-6 h-full">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-purple-400 to-accent-pink-400 uppercase mb-4 flex items-center gap-2">
              <MdOutlineSkateboarding className="text-accent-purple-400" /> {t('recentActivityTitle')}
            </h2>

            {profile.recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {profile.recentActivity.map((activity, idx) => {
                  const statusColors = {
                    approved: 'text-green-400 border-green-500/30 bg-green-500/10',
                    rejected: 'text-red-400 border-red-500/30 bg-red-500/10',
                    pending: 'text-accent-yellow-400 border-accent-yellow-500/30 bg-accent-yellow-500/10',
                  };

                  const statusIcons = {
                    approved: '✅',
                    rejected: '❌',
                    pending: '⏳',
                  };

                  return (
                    <div
                      key={idx}
                      className={`border-2 rounded-lg p-3 ${statusColors[activity.status as keyof typeof statusColors]}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{statusIcons[activity.status as keyof typeof statusIcons]}</span>
                            <p className="text-white font-bold text-sm">{activity.challengeName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${
                              activity.difficulty === 'easy' ? 'bg-green-500 text-black' :
                              activity.difficulty === 'medium' ? 'bg-accent-yellow-500 text-black' :
                              activity.difficulty === 'hard' ? 'bg-red-500 text-white' :
                              'bg-accent-purple-500 text-white'
                            }`}>
                              {activity.difficulty}
                            </span>
                            <span className="text-neutral-400 text-xs">
                              {new Date(activity.date).toLocaleDateString('en-US')}
                            </span>
                          </div>
                        </div>
                        {activity.score && (
                          <div className="text-right">
                            <p className="text-2xl font-black text-accent-yellow-400">{activity.score}</p>
                            <p className="text-neutral-500 text-xs">{t('points')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <MdOutlineSkateboarding className="text-neutral-600 text-4xl mx-auto mb-4" />
                <p className="text-neutral-500">{t('noRecentActivity')}</p>
                <p className="text-neutral-600 text-sm mt-2">{t('submitFirst')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Skate Setup */}
        <div className="bg-gradient-to-r from-green-500 to-accent-teal-500 p-[3px] rounded-lg">
          <div className="bg-neutral-900 rounded-lg p-6 h-full">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-accent-teal-400 uppercase mb-4 flex items-center gap-2">
              <GiSkateboard className="text-green-400" /> 🛼 {t('dreamSetup')}
            </h2>

            {profile.skateSetup ? (
              <div className="space-y-3">
                {profile.skateSetup.madero && (
                  <div className="bg-neutral-800 border-2 border-neutral-700 rounded-lg p-3">
                    <p className="text-neutral-500 text-xs uppercase">{t('deck')}</p>
                    <p className="text-white font-bold">{profile.skateSetup.madero}</p>
                  </div>
                )}
                {profile.skateSetup.trucks && (
                  <div className="bg-neutral-800 border-2 border-neutral-700 rounded-lg p-3">
                    <p className="text-neutral-500 text-xs uppercase">{t('trucks')}</p>
                    <p className="text-white font-bold">{profile.skateSetup.trucks}</p>
                  </div>
                )}
                {profile.skateSetup.ruedas && (
                  <div className="bg-neutral-800 border-2 border-neutral-700 rounded-lg p-3">
                    <p className="text-neutral-500 text-xs uppercase">{t('wheels')}</p>
                    <p className="text-white font-bold">{profile.skateSetup.ruedas}</p>
                  </div>
                )}
                {profile.skateSetup.rodamientos && (
                  <div className="bg-neutral-800 border-2 border-neutral-700 rounded-lg p-3">
                    <p className="text-neutral-500 text-xs uppercase">{t('bearings')}</p>
                    <p className="text-white font-bold">{profile.skateSetup.rodamientos}</p>
                  </div>
                )}
                {profile.skateSetup.tenis && (
                  <div className="bg-neutral-800 border-2 border-neutral-700 rounded-lg p-3">
                    <p className="text-neutral-500 text-xs uppercase">{t('shoes')}</p>
                    <p className="text-white font-bold">{profile.skateSetup.tenis}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <GiSkateboard className="text-neutral-600 text-4xl mx-auto mb-4" />
                <p className="text-neutral-500">{t('setupNotConfigured')}</p>
                <p className="text-neutral-600 text-sm mt-2">{t('configureSetupHint')}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Social Media Section */}
      {profile.socialMedia && (profile.socialMedia.instagram || profile.socialMedia.tiktok || profile.socialMedia.twitter || profile.socialMedia.facebook) && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-green-500 to-accent-teal-500 p-[3px] rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-6">
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-accent-teal-400 uppercase mb-4 text-center">
                {t('socialMedia')}
              </h2>

              <div className="flex flex-wrap justify-center gap-4">
                {profile.socialMedia.instagram && (
                  <a
                    href={`https://instagram.com/${profile.socialMedia.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-r from-accent-pink-500 to-accent-purple-500 text-white px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform"
                  >
                    <FaInstagram size={24} />
                    {profile.socialMedia.instagram}
                  </a>
                )}
                {profile.socialMedia.tiktok && (
                  <a
                    href={`https://tiktok.com/@${profile.socialMedia.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-r from-neutral-800 to-neutral-900 text-white px-6 py-3 rounded-lg font-bold border-2 border-neutral-600 hover:scale-105 transition-transform"
                  >
                    <FaTiktok size={24} />
                    {profile.socialMedia.tiktok}
                  </a>
                )}
                {profile.socialMedia.twitter && (
                  <a
                    href={`https://twitter.com/${profile.socialMedia.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-r from-accent-blue-400 to-accent-cyan-500 text-white px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform"
                  >
                    <FaTwitter size={24} />
                    {profile.socialMedia.twitter}
                  </a>
                )}
                {profile.socialMedia.facebook && (
                  <a
                    href={`https://facebook.com/${profile.socialMedia.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-r from-accent-blue-600 to-accent-blue-700 text-white px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform"
                  >
                    <FaFacebook size={24} />
                    {profile.socialMedia.facebook}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Button (if own profile) */}
      {isOwnProfile && (
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <Link
            href="/dashboard/skaters/profile"
            className="inline-block bg-accent-purple-600 hover:bg-accent-purple-700 text-white font-black py-3 px-8 rounded-lg border-4 border-white uppercase tracking-wider shadow-lg shadow-accent-purple-500/30 transform hover:scale-105 transition-all"
          >
            {t('editMyProfile')}
          </Link>
        </div>
      )}

      {/* Back Link */}
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <Link
          href="/dashboard/leaderboard"
          className="text-accent-cyan-400 hover:text-accent-cyan-300 font-bold uppercase text-sm"
        >
          {t('backToLeaderboard')}
        </Link>
      </div>
    </div>
  );
}
