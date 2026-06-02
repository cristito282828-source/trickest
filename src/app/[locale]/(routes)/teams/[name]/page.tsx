'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { createSlug } from '@/lib/utils/slug';

interface TeamMember {
  email: string;
  username: string | null;
  name: string | null;
  photo: string | null;
  score: number;
}

interface TeamData {
  name: string;
  description: string | null;
  logo: string | null;
  maxMembers: number;
  memberCount: number;
  totalScore: number;
  owner: {
    name: string | null;
    photo: string | null;
  };
  members: TeamMember[];
}

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const teamSlug = params.name as string;

        // Buscar equipo por slug en el leaderboard
        const response = await fetch('/api/leaderboards/teams?limit=100');

        if (!response.ok) {
          setError('Error loading teams');
          return;
        }

        const data = await response.json();
        const foundTeam = data.leaderboard.find((t: any) => createSlug(t.name) === teamSlug);

        if (!foundTeam) {
          setError('Team not found');
          return;
        }

        // Obtener detalles completos del equipo
        const detailResponse = await fetch(`/api/teams/${foundTeam.id}`);

        if (!detailResponse.ok) {
          setError('Error loading team details');
          return;
        }

        const detailData = await detailResponse.json();
        setTeam(detailData.team);
      } catch (err) {
        console.error('Error fetching team:', err);
        setError('Error loading team');
      } finally {
        setLoading(false);
      }
    };

    if (params.name) {
      fetchTeam();
    }
  }, [params.name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-cyan-400 font-bold text-xl">
            Loading team...
          </p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-bold text-xl mb-4">
            {error || 'Team not found'}
          </p>
          <button
            onClick={() => router.back()}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-black uppercase px-6 py-3 rounded-lg border-4 border-cyan-400"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
          >
            ← Back
          </button>
        </div>

        {/* Team Header Card */}
        <div className="bg-neutral-800 border-4 border-cyan-500 rounded-lg p-6 mb-6 shadow-lg shadow-cyan-500/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt={team.name}
                  className="w-32 h-32 rounded-lg border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-black text-4xl border-4 border-white shadow-lg">
                  {team.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Team Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider mb-2">
                {team.name}
              </h1>
              {team.description && (
                <p className="text-neutral-300 text-lg mb-4">
                  {team.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                <div className="bg-neutral-900 border-2 border-cyan-500 rounded-lg px-4 py-2">
                  <div>
                    <p className="text-neutral-400 text-xs uppercase">SCORE</p>
                    <p className="text-white font-black text-xl">{team.totalScore}</p>
                  </div>
                </div>

                <div className="bg-neutral-900 border-2 border-purple-500 rounded-lg px-4 py-2">
                  <div>
                    <p className="text-neutral-400 text-xs uppercase">MEMBERS</p>
                    <p className="text-white font-black text-xl">
                      {team.memberCount}/{team.maxMembers}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Captain Card */}
        {team.owner && (
          <div className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 border-4 border-yellow-400 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                {team.owner.photo ? (
                  <img
                    src={team.owner.photo}
                    alt={team.owner.name || 'Captain'}
                    className="w-16 h-16 rounded-full border-4 border-yellow-400 shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-white font-black text-2xl border-4 border-yellow-400 shadow-lg">
                    {team.owner.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs font-black uppercase px-2 py-1 rounded-full border-2 border-white">
                  👑 Captain
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black text-lg uppercase">
                  {team.owner.name || 'Captain'}
                </h3>
                <p className="text-yellow-400 text-sm">Team Leader</p>
              </div>
            </div>
          </div>
        )}

        {/* Members Section */}
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-4">
            👥 Team Members
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {team.members.map((member) => (
              <Link
                key={member.email}
                href={member.username ? `/profile/${member.username}` : '#'}
                className="bg-neutral-800 border-2 border-neutral-700 hover:border-cyan-500 rounded-lg p-4 transition-all hover:scale-[1.02] block"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name || 'Member'}
                        className="w-14 h-14 rounded-full border-2 border-cyan-400 object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-black text-xl border-2 border-cyan-400">
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1">
                    <h3 className="text-white font-black text-base uppercase">
                      {member.name || 'Anonymous Skater'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-400">🏆 {member.score} pts</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {team.members.length === 0 && (
            <div className="bg-neutral-800 border-2 border-neutral-700 rounded-lg p-8 text-center">
              <p className="text-neutral-400">No members yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
