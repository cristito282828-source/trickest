'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { useRealtime } from '@/providers/SupabaseRealtimeProvider';

interface Notification {
  id: number;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  type: string;
  createdAt: string;
  metadata: any;
}

export default function NotificationBell() {
  const t = useTranslations('notificationBell');
  const tMsg = useTranslations('notificationMessages'); // Para traducciones de mensajes
  const { data: session } = useSession();
  const { unreadCount, refreshUnreadCount } = useRealtime();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const userEmail = session?.user?.email;

  // Cargar notificaciones al abrir
  const fetchNotifications = async () => {
    if (!userEmail) return;

    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=20');
      const data = await response.json();

      if (response.ok && data.data) {
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal
  const handleOpen = () => {
    if (!userEmail) {
      // Si no hay sesión, mostrar toast o redirigir a login
      return;
    }

    setIsOpen(true);
    fetchNotifications();
  };

  // Marcar como leídas
  const markAsRead = async (notificationIds?: number[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markAll: !notificationIds,
          notificationIds: notificationIds || []
        })
      });

      if (response.ok) {
        // Recargar lista y contador
        await fetchNotifications();
        await refreshUnreadCount();

        // Actualizar localmente las notificaciones marcadas
        if (notificationIds) {
          setNotifications(prev =>
            prev.map(n =>
              notificationIds.includes(n.id)
                ? { ...n, isRead: true }
                : n
            )
          );
        } else {
          setNotifications(prev =>
            prev.map(n => ({ ...n, isRead: true }))
          );
        }
      }
    } catch (error) {
      console.error('Error marcando como leídas:', error);
    }
  };

  // Marcar una notificación individual como leída
  const markOneAsRead = async (id: number) => {
    await markAsRead([id]);
  };

  // Cerrar modal
  const handleClose = () => {
    setIsOpen(false);
  };

  // Marcar todas como leídas al cerrar
  const handleCloseAndMarkAll = async () => {
    await markAsRead(); // Marcar todas
    handleClose();
  };

  // Eliminar notificación
  const deleteNotification = async (id: number) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      // Nota: Necesitaríamos crear endpoint DELETE
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });

      // Recargar lista
      await fetchNotifications();
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('minutesAgo', { min: diffMins });
    if (diffHours < 24) return t('hoursAgo', { hours: diffHours });
    if (diffDays < 7) return t('daysAgo', { days: diffDays });
    return date.toLocaleDateString('es-ES');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment_reply':
        return '💬';
      case 'new_spot_comment':
        return '📍';
      case 'team_invitation':
        return '👥';
      case 'submission_evaluated':
        return '🎬';
      case 'team_accepted':
        return '🎊';
      case 'new_follower':
        return '👥';
      default:
        return '🔔';
    }
  };

  // Traducir mensaje según tipo de notificación
  const translateNotification = (notification: Notification) => {
    const type = notification.type;
    const metadata = notification.metadata || {};

    // Traducciones basadas en tipo
    switch (type) {
      case 'team_invitation':
        return {
          title: tMsg('teamInvitation.title'),
          message: tMsg('teamInvitation.message', {
            name: metadata.inviterName || tMsg('someone'),
            teamName: metadata.teamName || ''
          })
        };
      case 'team_accepted':
        return {
          title: tMsg('teamAccepted.title'),
          message: tMsg('teamAccepted.message', {
            teamName: metadata.teamName || ''
          })
        };
      case 'submission_evaluated':
        const isApproved = metadata.status === 'approved';
        return {
          title: isApproved
            ? tMsg('submissionApproved.title', { challenge: metadata.challengeName || '' })
            : tMsg('submissionRejected.title', { challenge: metadata.challengeName || '' }),
          message: isApproved
            ? tMsg('submissionApproved.message', {
                judge: metadata.judgeName || 'Un juez',
                score: metadata.score
              })
            : tMsg('submissionRejected.message', {
                judge: metadata.judgeName || 'Un juez'
              })
        };
      case 'new_follower':
        return {
          title: tMsg('newFollower.title'),
          message: tMsg('newFollower.message', {
            name: metadata.followerName || 'Un skater'
          })
        };
      case 'ranking_update':
        const improved = metadata.newPosition < metadata.oldPosition;
        const change = Math.abs(metadata.newPosition - metadata.oldPosition);
        const category = metadata.category === 'team' ? tMsg('teamRanking') : tMsg('individualRanking');
        return {
          title: improved
            ? tMsg('rankingUp.title')
            : tMsg('rankingDown.title'),
          message: improved
            ? tMsg('rankingUp.message', { count: change, category, position: metadata.newPosition })
            : tMsg('rankingDown.message', { count: change, category, position: metadata.newPosition })
        };
      case 'vote_received':
        return {
          title: tMsg('voteReceived.title', {
            emoji: metadata.voteType === 'upvote' ? '👍' : '👎',
            challenge: metadata.challengeName || ''
          }),
          message: tMsg('voteReceived.message', { voteType: metadata.voteType })
        };
      case 'community_approved':
        return {
          title: tMsg('communityApproved.title'),
          message: tMsg('communityApproved.message', {
            challenge: metadata.challengeName || '',
            upvotes: metadata.upvotes || 0
          })
        };
      default:
        // Si no hay traducción, usar el texto original guardado
        return {
          title: notification.title,
          message: notification.message
        };
    }
  };

  return (
    <div className="relative">
      {/* Botón de campana */}
      <button
        onClick={handleOpen}
        disabled={!userEmail}
        className="relative p-2 rounded-full bg-lime-500/15 hover:bg-lime-500/30 border border-lime-500/50 hover:border-lime-400 transition-all disabled:opacity-50"
        title={userEmail ? t('title') : t('signInToSee')}
      >
        <Bell className="w-6 h-6 text-lime-400" />

        {/* Badge con contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-lime-400 text-black text-xs font-bold rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modal de notificaciones */}
      {isOpen && (
        <div className="fixed right-4 top-16 w-96 bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-lime-400" />
              <h3 className="font-bold text-white">
                {t('title')}
                {unreadCount > 0 && (
                  <span className="text-cyan-400">({unreadCount} {unreadCount > 1 ? t('news') : t('new')})</span>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Marcar todas como leídas */}
              <button
                onClick={handleCloseAndMarkAll}
                disabled={loading || unreadCount === 0}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                title={t('markAllRead')}
              >
                <Check className="w-4 h-4" />
              </button>

              {/* Cerrar */}
              <button
                onClick={handleClose}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title={t('close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 animate-spin border-2 border-cyan-400 border-t-transparent rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-lime-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">{t('empty')}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer
                    ${notification.isRead
                      ? 'bg-slate-800 border-slate-700 opacity-60'
                      : 'bg-slate-800 border-cyan-500/50 hover:border-cyan-400'
                    }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markOneAsRead(notification.id);
                    }

                    // Si hay link, navegar
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono según tipo */}
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>

                    <div className="flex-1 min-w-0">
                      {/* Traducir y mostrar título */}
                      {(() => {
                        const translated = translateNotification(notification);
                        return (
                          <>
                            <p className={`font-bold text-sm mb-1 ${
                              notification.isRead ? 'text-slate-400' : 'text-white'
                            }`}>
                              {translated.title}
                            </p>

                            {/* Mensaje */}
                            <p className={`text-xs mb-2 ${
                              notification.isRead ? 'text-slate-500' : 'text-slate-300'
                            }`}>
                              {translated.message}
                            </p>
                          </>
                        );
                      })()}

                      {/* Fecha */}
                      <p className="text-[10px] text-slate-500">
                        {formatDate(notification.createdAt)}
                      </p>

                      {/* Metadata opcional */}
                      {notification.metadata && (
                        <div className="mt-2 pt-2 border-t border-slate-700">
                          <p className="text-[10px] text-slate-600">
                            {JSON.stringify(notification.metadata, null, 2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-700">
              <Link
                href="/notifications"
                className="block text-center text-xs font-bold text-cyan-400 hover:text-cyan-300"
                onClick={handleClose}
              >
                {t('viewAll')} →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
