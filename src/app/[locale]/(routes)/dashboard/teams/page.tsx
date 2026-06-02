"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import TeamLogoUpload from '@/components/TeamLogoUpload';

interface TeamMember {
  email: string;
  name: string | null;
  photo: string | null;
  score: number;
}

interface Team {
  id: number;
  name: string;
  description: string | null;
  logo: string | null;
  maxMembers: number;
  isActive: boolean;
  owner: {
    email: string;
    name: string | null;
    photo: string | null;
  };
  members: TeamMember[];
  memberCount: number;
  totalScore: number;
  isOwner?: boolean;
}

interface TeamInvitation {
  id: number;
  teamId: number;
  teamName: string;
  teamLogo: string | null;
  teamDescription: string | null;
  owner: {
    name: string | null;
    photo: string | null;
  };
  memberCount: number;
  maxMembers: number;
  createdAt: string;
}

interface SearchUser {
  email: string;
  name: string | null;
  username: string | null;
  photo: string | null;
  hasTeam: boolean;
}

export default function TeamsPage() {
  const { data: session } = useSession();
  const t = useTranslations('teamsPage');
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState('');
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDescription, setEditTeamDescription] = useState('');
  const [editTeamLogo, setEditTeamLogo] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch my team and invitations in parallel
      const [myTeamRes, invitationsRes] = await Promise.all([
        fetch('/api/teams/my-team'),
        fetch('/api/teams/invitations'),
      ]);

      if (myTeamRes.ok) {
        const myTeamData = await myTeamRes.json();
        setMyTeam(myTeamData.team);
      }

      if (invitationsRes.ok) {
        const invitationsData = await invitationsRes.json();
        setInvitations(invitationsData.invitations || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Debounced search for users
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setCreating(true);
    try {
      const teamData = {
        name: newTeamName,
        description: newTeamDescription || undefined,
        logo: newTeamLogo || undefined,
      };

      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || t('errorCreating'));
        return;
      }

      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
      setNewTeamLogo('');
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert(t('errorCreating'));
    } finally {
      setCreating(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!myTeam) return;
    if (!confirm(t('confirmLeave'))) return;

    setActionLoading(myTeam.id);
    try {
      const res = await fetch(`/api/teams/${myTeam.id}/leave`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || t('errorLeaving'));
        return;
      }

      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert(t('errorLeaving'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditTeam = () => {
    if (!myTeam) return;
    setEditTeamName(myTeam.name);
    setEditTeamDescription(myTeam.description || '');
    setEditTeamLogo(myTeam.logo || '');
    setShowEditModal(true);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTeam) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/teams/${myTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTeamName.trim() || undefined,
          description: editTeamDescription.trim() || undefined,
          logo: editTeamLogo.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || t('errorUpdating'));
        return;
      }

      setShowEditModal(false);
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert(t('errorUpdating'));
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectUser = (user: SearchUser) => {
    setInviteEmail(user.email);
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteError('');
    setInviteSuccess(false);
    try {
      const res = await fetch('/api/teams/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitedUserEmail: inviteEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error || t('errorSending'));
        return;
      }

      // Mostrar mensaje de éxito
      setInviteSuccess(true);

      // Esperar 1.5 segundos antes de cerrar para que vean el mensaje
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteEmail('');
        setSearchQuery('');
        setSearchResults([]);
        setInviteSuccess(false);
        // Refrescar datos para mostrar cambios
        fetchData();
      }, 1500);
    } catch (err) {
      console.error('Error completo:', err);
      setInviteError(t('connectionError'));
    } finally {
      setInviting(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: number) => {
    setActionLoading(invitationId);
    try {
      const res = await fetch(`/api/teams/invitations/${invitationId}/accept`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || t('errorAccepting'));
        return;
      }

      alert(t('joinedTeam'));
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert(t('errorAccepting'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectInvitation = async (invitationId: number) => {
    setActionLoading(invitationId);
    try {
      const res = await fetch(`/api/teams/invitations/${invitationId}/reject`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || t('errorRejecting'));
        return;
      }

      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert(t('errorRejecting'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTeam = async () => {
    if (!myTeam) return;
    if (!confirm(t('confirmDelete'))) return;

    setActionLoading(myTeam.id);
    try {
      const res = await fetch(`/api/teams/${myTeam.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || t('errorDeleting'));
        return;
      }

      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert(t('errorDeleting'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-accent-purple-900 via-accent-blue-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-purple-400 mx-auto"></div>
          <p className="mt-4 text-accent-purple-400 font-bold text-xl">{t('loadingTeams')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-accent-purple-500 to-accent-pink-600 p-1 rounded-lg shadow-2xl">
          <div className="bg-neutral-900 rounded-lg p-6">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-purple-400 to-accent-pink-400 uppercase tracking-wider text-center">
              {`👥 ${t('title')}`}
            </h1>
            <p className="text-accent-purple-300 mt-2 text-sm md:text-base text-center">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-red-500 border-4 border-red-700 rounded-lg p-4">
            <p className="text-white font-bold text-center">{error}</p>
          </div>
        </div>
      )}

      {/* My Team Section */}
      <div className="max-w-6xl mx-auto mb-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-4">
          {`🏠 ${t('myTeam')}`}
        </h2>

        {myTeam ? (
          <div className="bg-gradient-to-r from-accent-purple-500 to-accent-pink-500 p-1 rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Team Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    {myTeam.logo ? (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={myTeam.logo}
                          alt={myTeam.name}
                          width={64}
                          height={64}
                          className="rounded-lg object-cover"
                          onError={() => {
                            console.error('Error loading logo:', myTeam.logo);
                          }}
                          onLoad={() => {
                            console.log('Logo loaded successfully:', myTeam.logo);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-accent-purple-500 to-accent-pink-600 flex items-center justify-center text-white font-bold text-2xl">
                        {myTeam.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-white">{myTeam.name}</h3>
                      {myTeam.isOwner && (
                        <span className="text-xs bg-accent-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                          {t('owner')}
                        </span>
                      )}
                    </div>
                  </div>

                  {myTeam.description && (
                    <p className="text-neutral-400 mb-4">{myTeam.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-neutral-800 rounded-lg p-3 text-center">
                      <p className="text-neutral-400 text-xs uppercase">{t('scoreTotal')}</p>
                      <p className="text-white text-2xl font-black">{myTeam.totalScore}</p>
                    </div>
                    <div className="bg-neutral-800 rounded-lg p-3 text-center">
                      <p className="text-neutral-400 text-xs uppercase">{t('members')}</p>
                      <p className="text-white text-2xl font-black">
                        {myTeam.memberCount}/{myTeam.maxMembers}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {myTeam.isOwner && (
                      <>
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                          disabled={myTeam.memberCount >= myTeam.maxMembers}
                        >
                          {`👥 ${t('invite')}`}
                        </button>
                        <button
                          onClick={handleEditTeam}
                          className="bg-accent-purple-500 hover:bg-accent-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                          {`✏️ ${t('edit')}`}
                        </button>
                      </>
                    )}
                    {myTeam.isOwner ? (
                      <button
                        onClick={handleDeleteTeam}
                        disabled={actionLoading === myTeam.id}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === myTeam.id ? t('deleting') : t('deleteTeam')}
                      </button>
                    ) : (
                      <button
                        onClick={handleLeaveTeam}
                        disabled={actionLoading === myTeam.id}
                        className="bg-accent-orange-600 hover:bg-accent-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === myTeam.id ? t('leaving') : t('leaveTeam')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Members List */}
                <div className="md:w-1/3">
                  <h4 className="text-white font-bold mb-3">{t('members')}</h4>
                  <div className="space-y-2">
                    {myTeam.members.map((member) => (
                      <div
                        key={member.email}
                        className="flex items-center gap-3 bg-neutral-800 rounded-lg p-2"
                      >
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name || ''}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center text-white text-sm"
                          style={{ display: member.photo ? 'none' : 'flex' }}
                        >
                          {(member.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {member.name || 'Skater'}
                            {member.email === myTeam.owner.email && (
                              <span className="ml-1 text-accent-yellow-400">👑</span>
                            )}
                          </p>
                        </div>
                        <span className="text-accent-purple-400 font-bold text-sm">
                          {member.score} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-800 border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center">
            <p className="text-neutral-400 text-lg mb-4">{t('noTeam')}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-accent-purple-500 hover:bg-accent-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 border-4 border-white shadow-lg shadow-accent-purple-500/50"
            >
              {t('createTeam')}
            </button>
          </div>
        )}
      </div>

      {/* Team Invitations */}
      {!myTeam && invitations.length > 0 && (
        <div className="max-w-6xl mx-auto mb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-4">
            {`📧 ${t('pendingInvitations')}`}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-gradient-to-r from-green-500 to-accent-cyan-500 p-1 rounded-lg"
              >
                <div className="bg-neutral-900 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {invitation.teamLogo ? (
                      <img
                        src={invitation.teamLogo}
                        alt={invitation.teamName}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-accent-cyan-600 flex items-center justify-center text-white font-bold text-xl"
                      style={{ display: invitation.teamLogo ? 'none' : 'flex' }}
                    >
                      {invitation.teamName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold">{invitation.teamName}</h3>
                      <p className="text-neutral-400 text-xs">
                        {t('by')} {invitation.owner.name || 'Skater'}
                      </p>
                    </div>
                  </div>

                  {invitation.teamDescription && (
                    <p className="text-neutral-400 text-sm mb-3 line-clamp-2">
                      {invitation.teamDescription}
                    </p>
                  )}

                  <div className="flex justify-between items-center mb-3">
                    <div className="text-neutral-400 text-sm">
                      {invitation.memberCount}/{invitation.maxMembers} {t('members').toLowerCase()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === invitation.id ? '⏳' : `✅ ${t('accept')}`}
                    </button>
                    <button
                      onClick={() => handleRejectInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === invitation.id ? '⏳' : `❌ ${t('reject')}`}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info: Invitation only */}
      {!myTeam && invitations.length === 0 && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-accent-purple-500 to-accent-pink-500 p-1 rounded-lg">
            <div className="bg-neutral-900 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-2xl font-black text-white uppercase mb-3">
                {t('joinByInvitation')}
              </h3>
              <p className="text-neutral-300 mb-2">
                {t('joinByInvitationDesc')}
              </p>
              <p className="text-neutral-400 text-sm">
                {t('orCreateOwn')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border-4 border-accent-purple-500 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-purple-400 to-accent-pink-400 uppercase mb-6 text-center">
              {`⚡ ${t('createTeamTitle')}`}
            </h2>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              {/* Team name */}
              <div>
                <label className="text-accent-purple-400 text-sm font-bold uppercase block mb-2">
                  {t('teamName')}
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-neutral-800 border-2 border-neutral-600 rounded-lg px-4 py-3 text-white placeholder-neutral-400 focus:border-accent-purple-500 focus:outline-none transition-colors"
                  placeholder={t('teamNamePlaceholder')}
                  required
                  minLength={3}
                  maxLength={30}
                />
                <p className="text-neutral-300 text-xs mt-1">
                  {t('teamNameHint')}
                </p>
              </div>

              {/* Team logo upload */}
              <div>
                <label className="text-accent-purple-400 text-sm font-bold uppercase block mb-4">
                  {t('logoUrl')}
                </label>
                <TeamLogoUpload
                  currentLogo={newTeamLogo}
                  onLogoChange={setNewTeamLogo}
                  teamName={newTeamName || 'Team'}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-accent-purple-400 text-sm font-bold uppercase block mb-2">
                  {t('description')}
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="w-full bg-neutral-800 border-2 border-neutral-600 rounded-lg px-4 py-3 text-white placeholder-neutral-400 focus:border-accent-purple-500 focus:outline-none resize-none transition-colors"
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                  maxLength={200}
                />
                <p className="text-neutral-300 text-xs mt-1 text-right">
                  {newTeamDescription.length}/200 {t('characters')}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTeamName('');
                    setNewTeamDescription('');
                    setNewTeamLogo('');
                  }}
                  className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-4 rounded-lg transition-colors border-2 border-neutral-600 uppercase"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTeamName.trim() || newTeamName.trim().length < 3}
                  className="flex-1 bg-accent-purple-500 hover:bg-accent-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-4 border-white shadow-lg shadow-accent-purple-500/50 uppercase"
                >
                  {creating ? `⏳ ${t('creating')}` : `✨ ${t('create')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && myTeam && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border-4 border-accent-purple-500 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-purple-400 to-accent-pink-400 uppercase mb-6 text-center">
              {`✏️ ${t('editTeamTitle')}`}
            </h2>

            <form onSubmit={handleUpdateTeam} className="space-y-4">
              {/* Team name */}
              <div>
                <label className="text-accent-purple-400 text-sm font-bold uppercase block mb-2">
                  {t('teamName')}
                </label>
                <input
                  type="text"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full bg-neutral-800 border-2 border-neutral-600 rounded-lg px-4 py-3 text-white placeholder-neutral-400 focus:border-accent-purple-500 focus:outline-none transition-colors"
                  placeholder={t('teamNamePlaceholder')}
                  minLength={3}
                  maxLength={30}
                />
              </div>

              {/* Team logo upload */}
              <div>
                <label className="text-accent-purple-400 text-sm font-bold uppercase block mb-4">
                  {t('logoUrl')}
                </label>
                <TeamLogoUpload
                  currentLogo={editTeamLogo}
                  onLogoChange={setEditTeamLogo}
                  teamName={editTeamName || myTeam.name}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-accent-purple-400 text-sm font-bold uppercase block mb-2">
                  {t('description')}
                </label>
                <textarea
                  value={editTeamDescription}
                  onChange={(e) => setEditTeamDescription(e.target.value)}
                  className="w-full bg-neutral-800 border-2 border-neutral-600 rounded-lg px-4 py-3 text-white placeholder-neutral-400 focus:border-accent-purple-500 focus:outline-none resize-none transition-colors"
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                  maxLength={200}
                />
                <p className="text-neutral-300 text-xs mt-1 text-right">
                  {editTeamDescription.length}/200 {t('characters')}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-4 rounded-lg transition-colors border-2 border-neutral-600 uppercase"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-accent-purple-500 hover:bg-accent-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-4 border-white shadow-lg shadow-accent-purple-500/50 uppercase"
                >
                  {updating ? `⏳ ${t('savingTeam')}` : `💾 ${t('saveTeam')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && myTeam && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border-4 border-green-500 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-accent-cyan-400 uppercase mb-6 text-center">
              {`👥 ${t('inviteMember')}`}
            </h2>

            {/* Error Message */}
            {inviteError && (
              <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm font-bold text-center">❌ {inviteError}</p>
              </div>
            )}

            {/* Success Message */}
            {inviteSuccess && (
              <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-3 mb-4">
                <p className="text-green-400 text-sm font-bold text-center">{`✅ ${t('invitationSent')}`}</p>
              </div>
            )}

            <form onSubmit={handleInviteMember} className="space-y-4">
              {/* Search Skater */}
              <div className="relative">
                <label className="text-green-400 text-sm font-bold uppercase block mb-2">
                  {`🔍 ${t('searchSkater')}`}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchResults(true);
                  }}
                  className="w-full bg-neutral-800 border-2 border-neutral-600 rounded-lg px-4 py-3 text-white placeholder-neutral-400 focus:border-green-500 focus:outline-none transition-colors"
                  placeholder={t('searchPlaceholder')}
                  autoComplete="off"
                />
                <p className="text-neutral-300 text-xs mt-1">
                  {t('searchHint')}
                </p>

                {/* Loading indicator */}
                {searching && (
                  <div className="absolute right-3 top-10">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-400"></div>
                  </div>
                )}

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border-2 border-green-500 rounded-lg shadow-xl max-h-64 overflow-y-auto z-10">
                    {searchResults.map((user) => (
                      <button
                        key={user.email}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        disabled={user.hasTeam}
                        className="w-full flex items-center gap-3 p-3 hover:bg-neutral-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed border-b border-neutral-700 last:border-0"
                      >
                        {/* User Photo */}
                        {user.photo ? (
                          <img
                            src={user.photo}
                            alt={user.name || ''}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-accent-cyan-600 flex items-center justify-center text-white font-bold"
                          style={{ display: user.photo ? 'none' : 'flex' }}
                        >
                          {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold truncate">
                            {user.name || user.username || 'Skater'}
                          </p>
                          <p className="text-neutral-400 text-xs truncate">
                            @{user.username || user.email.split('@')[0]}
                          </p>
                        </div>

                        {/* Team Status Badge */}
                        {user.hasTeam ? (
                          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-bold whitespace-nowrap">
                            {t('alreadyHasTeam')}
                          </span>
                        ) : (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-bold whitespace-nowrap">
                            {`${t('available')} ✓`}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {showSearchResults && searchResults.length === 0 && !searching && searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border-2 border-neutral-600 rounded-lg p-4 text-center">
                    <p className="text-neutral-400 text-sm">{t('noSkatersFound')}</p>
                  </div>
                )}
              </div>

              {/* Selected email */}
              {inviteEmail && (
                <div className="bg-neutral-800 rounded-lg p-3 border-2 border-green-500">
                  <p className="text-neutral-400 text-xs uppercase mb-1">{t('selectedEmail')}</p>
                  <p className="text-white font-bold truncate">{inviteEmail}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setInviteEmail('');
                      setSearchQuery('');
                    }}
                    className="text-red-400 text-xs mt-2 hover:text-red-300 transition-colors"
                  >
                    {`❌ ${t('clearSelection')}`}
                  </button>
                </div>
              )}

              {/* Team info */}
              <div className="bg-neutral-800 rounded-lg p-4 border-2 border-neutral-700">
                <p className="text-neutral-400 text-xs uppercase mb-2">{t('team')}</p>
                <p className="text-white font-bold">{myTeam.name}</p>
                <p className="text-neutral-400 text-sm mt-2">
                  {t('slots')} {myTeam.memberCount}/{myTeam.maxMembers}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-4 rounded-lg transition-colors border-2 border-neutral-600 uppercase"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-4 border-white shadow-lg shadow-green-500/50 uppercase"
                >
                  {inviting ? `⏳ ${t('sending')}` : `📧 ${t('send')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
