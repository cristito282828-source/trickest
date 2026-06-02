"use client";

import { Bell } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import SigninButton from './SigninButton';
import LocationToggle from './LocationToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useRealtime } from '@/providers/SupabaseRealtimeProvider';
import SpotModal from '@/components/organisms/SpotModal';

interface UserScore {
  totalScore: number;
  photo: string | null;
  name: string | null;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const Appbar = () => {
  const { data: session } = useSession();
  const { unreadCount, markNotificationsSeen, refreshUnreadCount } = useRealtime();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [userScore, setUserScore] = useState<UserScore | null>(null);
  const [showSpotModal, setShowSpotModal] = useState(false);
  const [modalSpotId, setModalSpotId] = useState<number | null>(null);
  const [modalCommentId, setModalCommentId] = useState<number | null>(null);
  const t = useTranslations();
  const pathname = usePathname();

  // Detectar si estamos en una página del dashboard (no en home)
  // Ejemplo: /es/dashboard/skaters/profile -> isDashboard = true
  // Ejemplo: /es -> isDashboard = false
  const isDashboard = pathname?.includes('/dashboard') ?? false;


  // Fetch user score and photo
  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchUserScore = async () => {
      try {
        const res = await fetch(`/api/users/score?email=${session.user.email}`);
        if (res.ok) {
          const data = await res.json();
          setUserScore({
            totalScore: data.totalScore || 0,
            photo: data.photo,
            name: data.name,
          });
        }
      } catch (err) {
        console.error('Error fetching user score:', err);
      }
    };

    fetchUserScore();
  }, [session?.user?.email]);

  // Fetch notifications on mount and when opening dropdown
  const fetchNotifications = async () => {
    if (!session?.user?.email) return;

    try {
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data?.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Fetch notifications when session changes
  useEffect(() => {
    fetchNotifications();
  }, [session?.user?.email]);


  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    setLoading(true);
    try {
      // Mark as read
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markAll: false,
          notificationIds: [notification.id]
        })
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );

      // Refresh counter from provider
      await refreshUnreadCount();

      // If comment, open modal
      if (notification.type === 'comment_reply' || notification.type === 'comment_mention') {
        console.log('🔔 Comment notification:', notification);
        console.log('📦 Metadata:', notification.metadata);

        const spotId = notification.metadata?.spotId as number | undefined;
        const commentId = notification.metadata?.commentId as number | undefined;

        console.log('✅ Extracted data:', { spotId, commentId });

        if (spotId) {
          console.log('🚀 Opening modal with spotId:', spotId, 'commentId:', commentId);
          setModalSpotId(spotId);
          setModalCommentId(commentId || null);
          setShowSpotModal(true);
          setShowNotifications(false);
          return;
        }
      }

      // Redirect if has link
      if (notification.link) {
        window.location.href = notification.link;
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markAll: true,
          notificationIds: []
        })
      });

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

      // Refresh counter from provider
      await refreshUnreadCount();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission_evaluated':
        return '⭐';
      case 'team_invitation':
        return '👥';
      case 'ranking_update':
        return '📊';
      case 'new_follower':
        return '🔔';
      case 'vote_received':
        return '👍';
      case 'community_approved':
        return '🎉';
      case 'team_accepted':
        return '🎊';
      case 'comment_reply':
        return '💬';
      case 'comment_mention':
        return '💬';
      default:
        return '📬';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[9990] flex p-4 items-center w-full bg-transparent backdrop-blur-sm">
      {/* Logo - Solo visible en páginas del dashboard (no en home) */}
      {isDashboard ? (
        <Link href="/" className="flex items-center gap-2 group" aria-label="Ir a inicio">
          <div className="relative">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-accent-cyan-500/30 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <img
              src="/logo-icon.png"
              alt="Trickest"
              className="relative w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 border-accent-cyan-500/50 group-hover:border-accent-cyan-400 transition-all group-hover:scale-110"
              onError={(e) => {
                // Fallback to logo.png if logo-icon.png doesn't exist
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>
          <span className="hidden md:inline text-white font-black uppercase tracking-wider text-sm group-hover:text-accent-cyan-400 transition-colors">
            TRICKEST
          </span>
        </Link>
      ) : (
        /* En home:
           - Si NO hay sesión: SigninButton a la izquierda (botón login)
           - Si hay sesión en mobile: SigninButton a la izquierda (acceso a logout/menú)
           - Si hay sesión en desktop: NO mostrar (ya está el avatar a la derecha) */
        <div className={session?.user ? 'md:hidden' : ''}>
          <SigninButton />
        </div>
      )}

      {/* User Score Badge - mobile: avatar + score compacto | desktop: card completo */}
      {session?.user && (
        <Link href="/dashboard/skaters/profile" className="ml-2 md:ml-4 flex">
          {/* Mobile: solo avatar + score (chip compacto) */}
          <div className="flex md:hidden items-center gap-1.5 bg-neutral-800/80 px-2 py-1.5 rounded-lg border-2 border-accent-cyan-500/50 active:scale-95 transition-transform">
            <div className="flex-shrink-0">
              {(userScore?.photo || session.user.image) ? (
                <img
                  src={userScore?.photo || session.user.image || ''}
                  alt={userScore?.name || session.user.name || 'User'}
                  className="w-7 h-7 rounded-full border-2 border-accent-cyan-400 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-cyan-500 to-accent-blue-500 flex items-center justify-center border-2 border-accent-cyan-400">
                  <span className="text-white font-black text-xs">
                    {(userScore?.name || session.user.name)?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-accent-yellow-400 text-xs">⭐</span>
              <span className="text-accent-yellow-400 font-bold text-xs">
                {userScore?.totalScore?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {/* Desktop: card completo avatar + nombre + score */}
          <div className="hidden md:flex items-center gap-2 md:gap-3 bg-neutral-800/80 px-3 py-2 rounded-lg border-2 border-accent-cyan-500/50 hover:border-accent-cyan-400 hover:shadow-lg hover:shadow-accent-cyan-500/30 transition-all cursor-pointer hover:scale-105">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {(userScore?.photo || session.user.image) ? (
                <img
                  src={userScore?.photo || session.user.image || ''}
                  alt={userScore?.name || session.user.name || 'User'}
                  className="w-10 h-10 rounded-full border-2 border-accent-cyan-400 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan-500 to-accent-blue-500 flex items-center justify-center border-2 border-accent-cyan-400">
                  <span className="text-white font-black text-lg">
                    {(userScore?.name || session.user.name)?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex flex-col">
              <p className="text-white font-bold text-sm uppercase tracking-wider leading-tight truncate max-w-[150px]">
                {userScore?.name || session.user.name || 'Skater'}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-accent-yellow-400 text-xs font-black">⭐</span>
                <span className="text-accent-yellow-400 font-bold text-xs">
                  {userScore?.totalScore?.toLocaleString() || 0} PTS
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Spacer - pushes everything to the right */}
      <div className="flex-1" />

      {/* Floating buttons on the right */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* SigninButton - en dashboard solo en mobile (en desktop ya está el avatar de perfil) */}
        {/* En home NO se muestra a la derecha (ya está a la izquierda) */}
        {isDashboard && (
          <div className="md:hidden">
            <SigninButton />
          </div>
        )}

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Location button */}
        {session?.user?.email && (
          <LocationToggle />
        )}

        {/* Notifications button */}
        {session?.user?.email && (
          <div className="relative notifications-container">
            <button
              onClick={async () => {
                const willOpen = !showNotifications;
                setShowNotifications(!showNotifications);

                if (willOpen) {
                  await fetchNotifications();
                  markNotificationsSeen();
                }
              }}
              className="group relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 border-2 backdrop-blur-sm bg-green-600/80 hover:bg-green-500/90 border-green-300 hover:shadow-green-500/50"
            >
              <Bell className="w-5 h-5 md:w-6 md:h-6" />

              {/* Notifications badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-neutral-900 border-4 border-green-500 rounded-lg shadow-2xl z-[9991] max-h-[32rem] flex flex-col">
                <div className="p-4 border-b border-green-500 flex justify-between items-center">
                  <h3 className="text-white font-black uppercase text-lg">
                    🔔 {t('notifications.title')}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={loading}
                      className="text-green-400 hover:text-green-300 text-xs font-bold uppercase transition-colors disabled:opacity-50"
                    >
                      {t('notifications.markAll')}
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-neutral-400">{t('notifications.empty')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-700">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          disabled={loading}
                          className={`w-full p-4 hover:bg-neutral-800 transition-colors text-left ${
                            !notification.isRead ? 'bg-neutral-800/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-accent-cyan-600 flex items-center justify-center text-xl">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className={`font-bold text-sm ${notification.isRead ? 'text-neutral-300' : 'text-white'}`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-neutral-400 text-xs">
                                {notification.message}
                              </p>
                              <p className="text-neutral-500 text-xs mt-1">
                                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Community Voting button */}

      </div>

      {/* Spot Modal with Comments */}
      <SpotModal
        isOpen={showSpotModal}
        spotId={modalSpotId}
        commentId={modalCommentId}
        onClose={() => {
          setShowSpotModal(false);
          setModalSpotId(null);
          setModalCommentId(null);
        }}
      />
    </header>
  );
};

export default Appbar;
