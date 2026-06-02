'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface LeaderboardUser {
  rank: number;
  email: string;
  username: string;
  name: string;
  photo: string | null;
  location: string | null;
  team: {
    id: number;
    name: string;
    logo: string | null;
  } | null;
  totalScore: number;
  challengesCompleted: number;
  submissionsApproved: number;
}

interface LeaderboardTeam {
  rank: number;
  id: number;
  name: string;
  description: string | null;
  logo: string | null;
  owner: {
    email: string;
    name: string | null;
    photo: string | null;
  };
  memberCount: number;
  maxMembers: number;
  totalScore: number;
  challengesCompleted: number;
}

type Tab = 'users' | 'teams';

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const t = useTranslations('leaderboardPage');
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [usersLeaderboard, setUsersLeaderboard] = useState<LeaderboardUser[]>(
    []
  );
  const [teamsLeaderboard, setTeamsLeaderboard] = useState<LeaderboardTeam[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, teamsRes] = await Promise.all([
          fetch('/api/leaderboards/users?limit=100'),
          fetch('/api/leaderboards/teams?limit=50'),
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsersLeaderboard(usersData.leaderboard || []);
        }

        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeamsLeaderboard(teamsData.leaderboard || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error loading leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentUserRank = usersLeaderboard.find(
    (u) => u.email === session?.user?.email
  );

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-accent-yellow-400 to-accent-amber-600 shadow-accent-yellow-500/50';
      case 2:
        return 'from-neutral-300 to-neutral-500 shadow-neutral-400/50';
      case 3:
        return 'from-accent-amber-600 to-accent-amber-800 shadow-accent-amber-600/50';
      default:
        return 'from-neutral-700 to-neutral-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent-purple-900 via-accent-blue-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-cyan-400 mx-auto"></div>
          <p className="mt-4 text-accent-cyan-400 font-bold text-xl">
            {t('loadingRankings')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-600 p-1 rounded-lg shadow-2xl">
          <div className="bg-neutral-900 rounded-lg p-6">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow-400 to-accent-orange-400 uppercase tracking-wider text-center">
              {`🏆 ${t('title')}`}
            </h1>
            <p className="text-accent-yellow-300 mt-2 text-sm md:text-base text-center">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold uppercase transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-accent-cyan-500 to-accent-blue-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {`👤 ${t('skatersTab')}`}
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold uppercase transition-all ${
              activeTab === 'teams'
                ? 'bg-gradient-to-r from-accent-purple-500 to-accent-pink-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {t('teamsTab')}
          </button>
        </div>
      </div>

      {/* Current User Position (only for users tab) */}
      {activeTab === 'users' && currentUserRank && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-blue-600 p-1 rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-accent-cyan-400">
                  {t('yourPosition', { rank: currentUserRank.rank })}
                </span>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-xl">
                  {currentUserRank.totalScore} pts
                </p>
                <p className="text-neutral-400 text-sm">
                  {t('challengesCompleted', { count: currentUserRank.challengesCompleted })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-red-500 border-4 border-red-700 rounded-lg p-4">
            <p className="text-white font-bold text-center">{error}</p>
          </div>
        </div>
      )}

      {/* Users Leaderboard */}
      {activeTab === 'users' && (
        <div className="max-w-4xl mx-auto">
          {usersLeaderboard.length === 0 ? (
            <div className="bg-neutral-800 border-4 border-neutral-700 rounded-lg p-8 text-center">
              <p className="text-neutral-400 text-xl">
                {t('noSkatersYet')}
              </p>
              <p className="text-neutral-500 mt-2">
                {t('beFirst')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Top 3 */}
              {usersLeaderboard.slice(0, 3).map((user) => (
                <Link
                  key={user.email}
                  href={`/profile/${user.username}`}
                  className={`block bg-gradient-to-r ${getRankStyle(
                    user.rank
                  )} p-1 rounded-lg shadow-lg ${
                    user.email === session?.user?.email
                      ? 'ring-4 ring-accent-cyan-400'
                      : ''
                  } hover:scale-[1.02] transition-transform cursor-pointer`}
                >
                  <div className="bg-neutral-900 rounded-lg p-4 flex items-center gap-4">
                    <div className="text-4xl w-16 text-center">
                      {getRankIcon(user.rank)}
                    </div>
                    <div className="relative">
                      {user.photo ? (
                        <Image
                          src={user.photo}
                          alt={user.name}
                          width={56}
                          height={56}
                          className="rounded-full border-2 border-white"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-cyan-500 to-accent-purple-600 flex items-center justify-center text-white font-bold text-xl">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg hover:text-accent-cyan-400 transition-colors">
                        {user.name}
                        {user.email === session?.user?.email && (
                          <span className="ml-2 text-accent-cyan-400 text-sm">
                            {t('you')}
                          </span>
                        )}
                      </h3>
                      {user.location && (
                        <p className="text-neutral-400 text-sm">
                          📍 {user.location}
                        </p>
                      )}
                      {user.team && (
                        <p className="text-accent-purple-400 text-sm">
                          👥 {user.team.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black text-2xl">
                        {user.totalScore}
                      </p>
                      <p className="text-neutral-400 text-xs uppercase">{t('points')}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-accent-cyan-400 font-bold">
                        {user.challengesCompleted}
                      </p>
                      <p className="text-neutral-400 text-xs uppercase">
                        {t('challenges')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Rest */}
              {usersLeaderboard.slice(3).map((user) => (
                <Link
                  key={user.email}
                  href={`/profile/${user.username}`}
                  className={`bg-neutral-800 border-2 border-neutral-700 rounded-lg p-4 flex items-center gap-4 hover:border-accent-cyan-500 hover:scale-[1.01] transition-all cursor-pointer ${
                    user.email === session?.user?.email
                      ? 'border-accent-cyan-400 bg-neutral-800/80'
                      : ''
                  }`}
                >
                  <div className="text-neutral-400 font-bold text-xl w-12 text-center">
                    #{user.rank}
                  </div>
                  <div className="relative">
                    {user.photo ? (
                      <Image
                        src={user.photo}
                        alt={user.name}
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-neutral-600"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold hover:text-accent-cyan-400 transition-colors">
                      {user.name}
                      {user.email === session?.user?.email && (
                        <span className="ml-2 text-accent-cyan-400 text-sm">{t('you')}</span>
                      )}
                    </h3>
                    <div className="flex gap-4 text-sm">
                      {user.location && (
                        <span className="text-neutral-500">
                          📍 {user.location}
                        </span>
                      )}
                      {user.team && (
                        <span className="text-accent-purple-400">
                          👥 {user.team.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">
                      {user.totalScore}
                    </p>
                    <p className="text-neutral-500 text-xs">pts</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-accent-cyan-400 font-bold">
                      {user.challengesCompleted}
                    </p>
                    <p className="text-neutral-500 text-xs">{t('challenges')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Teams Leaderboard */}
      {activeTab === 'teams' && (
        <div className="max-w-4xl mx-auto">
          {teamsLeaderboard.length === 0 ? (
            <div className="bg-neutral-800 border-4 border-neutral-700 rounded-lg p-8 text-center">
              <p className="text-neutral-400 text-xl">
                {t('noTeamsYet')}
              </p>
              <p className="text-neutral-500 mt-2">{t('createAndCompete')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Top 3 Teams */}
              {teamsLeaderboard.slice(0, 3).map((team) => (
                <div
                  key={team.id}
                  className={`bg-gradient-to-r ${getRankStyle(
                    team.rank
                  )} p-1 rounded-lg shadow-lg`}
                >
                  <div className="bg-neutral-900 rounded-lg p-4 flex items-center gap-4">
                    <div className="text-4xl w-16 text-center">
                      {getRankIcon(team.rank)}
                    </div>
                    <div className="relative">
                      {team.logo ? (
                        <Image
                          src={team.logo}
                          alt={team.name}
                          width={56}
                          height={56}
                          className="rounded-lg border-2 border-white"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-accent-purple-500 to-accent-pink-600 flex items-center justify-center text-white font-bold text-xl">
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">
                        {team.name}
                      </h3>
                      <p className="text-neutral-400 text-sm">
                        {team.owner.name || t('captain')}
                      </p>
                      <p className="text-accent-purple-400 text-sm">
                        {team.memberCount}/{team.maxMembers} {t('members')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black text-2xl">
                        {team.totalScore}
                      </p>
                      <p className="text-neutral-400 text-xs uppercase">{t('points')}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-accent-purple-400 font-bold">
                        {team.challengesCompleted}
                      </p>
                      <p className="text-neutral-400 text-xs uppercase">
                        {t('challenges')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Rest of Teams */}
              {teamsLeaderboard.slice(3).map((team) => (
                <div
                  key={team.id}
                  className="bg-neutral-800 border-2 border-neutral-700 rounded-lg p-4 flex items-center gap-4 hover:border-accent-purple-500 transition-colors"
                >
                  <div className="text-neutral-400 font-bold text-xl w-12 text-center">
                    #{team.rank}
                  </div>
                  <div className="relative">
                    {team.logo ? (
                      <Image
                        src={team.logo}
                        alt={team.name}
                        width={48}
                        height={48}
                        className="rounded-lg border-2 border-neutral-600"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center text-white font-bold">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{team.name}</h3>
                    <p className="text-neutral-500 text-sm">
                      {team.memberCount}/{team.maxMembers} {t('members')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">
                      {team.totalScore}
                    </p>
                    <p className="text-neutral-500 text-xs">pts</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-accent-purple-400 font-bold">
                      {team.challengesCompleted}
                    </p>
                    <p className="text-neutral-500 text-xs">{t('challenges')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-neutral-800/50 rounded-lg p-4">
          <p className="text-neutral-400 text-center text-sm">
            {activeTab === 'users'
              ? t('legendUsers')
              : t('legendTeams')}
          </p>
        </div>
      </div>
    </div>
  );
}
