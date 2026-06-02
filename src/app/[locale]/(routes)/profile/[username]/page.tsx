'use client';

import { Button } from '@nextui-org/react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FaFacebook,
  FaInstagram,
  FaShare,
  FaTiktok,
  FaTwitter,
} from 'react-icons/fa';
import { GiSkateboard, GiTrophy } from 'react-icons/gi';
import {
  MdGroups,
  MdLocationOn,
  MdOutlineSkateboarding,
} from 'react-icons/md';
import { createSlug } from '@/lib/utils/slug';

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
  const t = useTranslations('publicProfile');
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const username = params.username as string;
  const decodedUsername = decodeURIComponent(username);
  const isOwnProfile = session?.user?.username === decodedUsername;

  const handleShare = async () => {
    const profileUrl = window.location.href;
    const shareText = t('checkOutProfile', { name: profile?.name || t('skater') });

    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('profileTitle', { name: profile?.name || t('skater') }),
          text: shareText,
          url: profileUrl,
        });
        return; // Share successful, exit
      } catch (error) {
        // User cancelled or share failed, continue to clipboard fallback
        console.log('Share cancelled or failed');
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(profileUrl);
      alert(t('linkCopied'));
    } catch (error) {
      // If clipboard fails, create a temporary input element
      const input = document.createElement('input');
      input.value = profileUrl;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        alert(t('linkCopied'));
      } catch (err) {
        console.error('Failed to copy:', err);
        alert(t('couldNotCopy') + profileUrl);
      }
      document.body.removeChild(input);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/profile/${username}`);

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
      } catch (err) {
        console.error('Error:', err);
        setError(t('errorLoadingProfile'));
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, session?.user?.email]);

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
    const labels = [
      '',
      'Ollie',
      'Kickflip',
      'Heelflip',
      '50-50',
      'Boardslide',
      'Pop Shuvit',
      '360 Flip',
      'Hardflip',
      'Varial Kickflip',
      'Switch Kickflip',
    ];
    return labels[difficulty] || `Level ${difficulty}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent-purple-900 via-accent-blue-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-cyan-400 mx-auto"></div>
          <p className="mt-4 text-accent-cyan-400 font-bold text-xl">
            {t('loadingProfile')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-gradient-to-r from-red-500 to-accent-orange-500 p-1 rounded-lg shadow-2xl">
          <div className="bg-neutral-900 rounded-lg p-8 text-center">
            <p className="text-red-400 font-bold text-xl">
              {error || t('profileNotAvailable')}
            </p>
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

  // Main render
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
                      href={`/teams/${createSlug(profile.team.name)}`}
                      className="text-accent-purple-400 text-sm flex items-center gap-1 hover:text-accent-purple-300"
                    >
                      <MdGroups />
                      {profile.team.name}
                    </Link>
                  )}

                  {/* Share Button */}
                  <Button
                    onClick={handleShare}
                    className="bg-accent-purple-500 hover:bg-accent-purple-600 text-white font-black uppercase tracking-wider border-4 border-white shadow-lg transform hover:scale-105 transition-all"
                  >
                    <FaShare className="mr-2" />
                    {t('share')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-1 rounded-lg shadow-2xl shadow-accent-cyan-500/30">
          <div className="bg-neutral-900 rounded-lg p-6">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-purple-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <GiTrophy className="text-accent-yellow-400" />
              {t('stats')}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-black text-accent-cyan-400">
                  {profile.stats.totalScore}
                </div>
                <div className="text-neutral-400 text-sm uppercase tracking-wider">
                  {t('totalPoints')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-green-400">
                  {profile.stats.challengesCompleted}
                </div>
                <div className="text-neutral-400 text-sm uppercase tracking-wider">
                  {t('tricksCompleted')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-accent-purple-400">
                  {profile.stats.successRate}%
                </div>
                <div className="text-neutral-400 text-sm uppercase tracking-wider">
                  {t('successRate')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-accent-yellow-400">
                  {profile.stats.currentStreak}
                </div>
                <div className="text-neutral-400 text-sm uppercase tracking-wider">
                  {t('currentStreak')}
                </div>
              </div>
            </div>

            {/* Difficulty Stats */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">
                {t('byDifficulty')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(profile.stats.difficultyStats).map(
                  ([level, stats]) => (
                    <div
                      key={level}
                      className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700"
                    >
                      <div className="text-accent-cyan-400 font-bold uppercase text-sm mb-2">
                        {level.toUpperCase()}
                      </div>
                      <div className="text-white text-lg font-black">
                        {stats.completed}
                      </div>
                      <div className="text-neutral-400 text-xs">{t('completed')}</div>
                      <div className="text-green-400 text-sm font-bold mt-1">
                        {stats.avgScore.toFixed(1)} {t('pts')}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Social Stats */}
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-black text-accent-cyan-400">
                  {profile.socialStats.followerCount}
                </div>
                <div className="text-neutral-400 text-sm uppercase tracking-wider">
                  {t('followers')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-accent-purple-400">
                  {profile.socialStats.followingCount}
                </div>
                <div className="text-neutral-400 text-sm uppercase tracking-wider">
                  {t('following')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      {profile.achievements && profile.achievements.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-1 rounded-lg shadow-2xl shadow-accent-cyan-500/30">
            <div className="bg-neutral-900 rounded-lg p-6">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-purple-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <GiTrophy className="text-accent-yellow-400" />
                {t('achievements')} ({profile.stats.achievementsUnlocked}/
                {profile.stats.totalAchievements})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`rounded-lg p-4 border-2 transition-all ${
                      achievement.unlocked
                        ? 'bg-gradient-to-r from-accent-yellow-500/20 to-accent-amber-500/20 border-accent-yellow-400 shadow-lg shadow-accent-yellow-500/30'
                        : 'bg-neutral-800/30 border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-2xl ${
                          achievement.unlocked ? '' : 'grayscale opacity-50'
                        }`}
                      >
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-bold uppercase tracking-wider text-sm ${
                            achievement.unlocked
                              ? 'text-accent-yellow-400'
                              : 'text-neutral-500'
                          }`}
                        >
                          {achievement.name}
                        </h3>
                        <p
                          className={`text-xs mt-1 ${
                            achievement.unlocked
                              ? 'text-neutral-300'
                              : 'text-neutral-600'
                          }`}
                        >
                          {achievement.description}
                        </p>
                        {achievement.unlocked && achievement.unlockedDate && (
                          <p className="text-xs text-neutral-500 mt-1">
                            {t('unlocked')}:{' '}
                            {new Date(
                              achievement.unlockedDate
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {profile.recentActivity && profile.recentActivity.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-1 rounded-lg shadow-2xl shadow-accent-cyan-500/30">
            <div className="bg-neutral-900 rounded-lg p-6">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-purple-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <MdOutlineSkateboarding className="text-accent-cyan-400" />
                {t('recentActivity')}
              </h2>

              <div className="space-y-3">
                {profile.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            activity.status === 'approved'
                              ? 'bg-green-400'
                              : activity.status === 'rejected'
                              ? 'bg-red-400'
                              : 'bg-accent-yellow-400'
                          }`}
                        ></div>
                        <div>
                          <span className="text-white font-bold">
                            {activity.challengeName}
                          </span>
                          <span className="text-neutral-400 text-sm ml-2">
                            ({activity.difficulty})
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {activity.score && (
                          <div className="text-accent-cyan-400 font-bold">
                            {activity.score} pts
                          </div>
                        )}
                        <div className="text-neutral-400 text-xs">
                          {new Date(activity.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dream Setup */}
      {profile.skateSetup && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-1 rounded-lg shadow-2xl shadow-accent-cyan-500/30">
            <div className="bg-neutral-900 rounded-lg p-6">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-purple-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <GiSkateboard className="text-accent-purple-400" />
                {t('dreamSetup')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(profile.skateSetup).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700"
                  >
                    <div className="text-accent-purple-400 font-bold uppercase text-sm mb-2">
                      {key === 'madero'
                        ? t('deck')
                        : key === 'trucks'
                        ? t('trucks')
                        : key === 'ruedas'
                        ? t('wheels')
                        : key === 'rodamientos'
                        ? t('bearings')
                        : key === 'tenis'
                        ? t('shoes')
                        : key}
                    </div>
                    <div className="text-white font-bold">
                      {value || t('notSpecified')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Media */}
      {profile.socialMedia && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-1 rounded-lg shadow-2xl shadow-accent-cyan-500/30">
            <div className="bg-neutral-900 rounded-lg p-6">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-purple-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                {t('socialMedia')}
              </h2>

              <div className="flex flex-wrap gap-4">
                {profile.socialMedia.instagram && (
                  <a
                    href={`https://instagram.com/${profile.socialMedia.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-r from-accent-pink-500 to-accent-orange-500 hover:from-accent-pink-400 hover:to-accent-orange-400 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider border-2 border-white shadow-lg transform hover:scale-105 transition-all"
                  >
                    <FaInstagram />
                    Instagram
                  </a>
                )}
                {profile.socialMedia.tiktok && (
                  <a
                    href={`https://tiktok.com/@${profile.socialMedia.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black hover:bg-neutral-900 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider border-2 border-white shadow-lg transform hover:scale-105 transition-all"
                  >
                    <FaTiktok />
                    TikTok
                  </a>
                )}
                {profile.socialMedia.twitter && (
                  <a
                    href={`https://twitter.com/${profile.socialMedia.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-accent-blue-500 hover:bg-accent-blue-400 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider border-2 border-white shadow-lg transform hover:scale-105 transition-all"
                  >
                    <FaTwitter />
                    Twitter
                  </a>
                )}
                {profile.socialMedia.facebook && (
                  <a
                    href={`https://facebook.com/${profile.socialMedia.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-accent-blue-600 hover:bg-accent-blue-500 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider border-2 border-white shadow-lg transform hover:scale-105 transition-all"
                  >
                    <FaFacebook />
                    Facebook
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Preview */}
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
          <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <FaShare className="text-accent-cyan-400" />
            {t('sharePreview')}
          </h3>
          <p className="text-neutral-300 text-sm mb-4">
            {t('sharePreviewDesc')}
          </p>

          {/* Social Card Preview */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg max-w-md">
            {/* Image */}
            <div className="aspect-[1200/630] bg-gradient-to-br from-accent-cyan-500 to-accent-purple-600 flex items-center justify-center">
              {profile?.photo ? (
                <Image
                  src={profile.photo}
                  alt={profile.name || 'Skater'}
                  width={1200}
                  height={630}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white text-6xl">🛹</div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h4 className="font-bold text-lg text-neutral-900">
                {t('profileTitle', { name: profile?.name || t('skater') })}
              </h4>
              <p className="text-neutral-600 text-sm mt-1">
                {t('profileDesc', { role: profile?.role || '', score: profile?.stats?.totalScore || 0, tricks: profile?.stats?.challengesCompleted || 0 })}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-accent-cyan-100 text-accent-cyan-800 px-2 py-1 rounded">
                  trickest.com
                </span>
              </div>
            </div>
          </div>

          <p className="text-neutral-400 text-xs mt-3">
            {t('shareProfileMsg')}
          </p>
        </div>
      </div>

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
