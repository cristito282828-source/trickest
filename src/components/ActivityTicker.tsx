'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface RecentUser {
  id: string;
  username: string;
  name: string;
  action: string;
  time: string;
  photo?: string | null;
}

// ─── KEY INSIGHT ───────────────────────────────────────────────────────────────
// El truco del ticker infinito:
// 1. Duplicar el array UNA SOLA VEZ → [A, B, C, A, B, C]
// 2. Animar translateX de 0% → -50% (exactamente la mitad)
// 3. Cuando llega a -50%, el contenido visual es idéntico → loop perfecto
// 4. NO usar whitespace-nowrap en el wrapper, sino en cada item
// ──────────────────────────────────────────────────────────────────────────────

const FALLBACK_USERS: RecentUser[] = [
  { id: '1', username: 'skater_pro', name: 'Carlos M.', action: 'new_user', time: '2m', photo: 'https://i.pravatar.cc/150?u=carlos' },
  { id: '2', username: 'ollie_king', name: 'María L.', action: 'new_user', time: '5m', photo: 'https://i.pravatar.cc/150?u=maria' },
  { id: '3', username: 'kickflip_master', name: 'Juan P.', action: 'new_user', time: '10m', photo: 'https://i.pravatar.cc/150?u=juan' },
  { id: '4', username: 'grind_queen', name: 'Sofía R.', action: 'team', time: '15m', photo: 'https://i.pravatar.cc/150?u=sofia' },
  { id: '5', username: 'halfpipe_hero', name: 'Diego F.', action: 'new_user', time: '22m', photo: 'https://i.pravatar.cc/150?u=diego' },
];

const ActivityTicker = () => {
  const t = useTranslations('activityTicker');
  const [users, setUsers] = useState<RecentUser[]>(FALLBACK_USERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/activity/recent', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.length > 0) setUsers(data);
        }
      } catch {
        // silently use fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 1_800_000);
    return () => clearInterval(interval);
  }, []);

  const getActionText = (action: string) => {
    switch (action) {
      case 'new_user': return t('justJoined');
      case 'team':     return t('team');
      default:         return action;
    }
  };

  const getEmoji = (action: string) => action === 'team' ? '🏆' : '🎉';

  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 border-y-4 border-cyan-500 py-3 flex justify-center">
        <span className="text-neutral-300 animate-pulse">🛹 Cargando actividad...</span>
      </div>
    );
  }

  // Duplicar UNA vez → la animación va de 0 a -50%
  const items = [...users, ...users];

  return (
    <>
      {/* ── Inyectar keyframe via <style> para no depender de tailwind config ── */}
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          /* width: max-content garantiza que el track sea tan ancho como su contenido */
          display: flex;
          width: max-content;
          animation: ticker 30s linear infinite;
        }
      `}</style>

      <div
        className="w-full bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 border-y-4 border-cyan-500 overflow-hidden"
        /* overflow-hidden es CRÍTICO — sin esto el track desborda visualmente */
      >
        <div className="ticker-track py-3">
          {items.map((user, idx) => (
            <div
              key={`${user.id}-${idx}`}
              className="flex items-center gap-3 mx-8 text-white flex-shrink-0"
              /* flex-shrink-0 evita que los items se compriman */
            >
              {user.photo ? (
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-cyan-400 flex-shrink-0">
                  <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <span className="text-2xl">{getEmoji(user.action)}</span>
              )}

              <span className="font-bold text-cyan-400 whitespace-nowrap">{user.name}</span>
              <span className="text-neutral-300 whitespace-nowrap">{getActionText(user.action)}</span>
              <span className="text-pink-400 font-black whitespace-nowrap">{user.time}</span>
              <span className="text-neutral-600 mx-2">◆</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ActivityTicker;
