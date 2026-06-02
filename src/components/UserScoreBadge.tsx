'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function UserScoreBadge() {
  const { data: session } = useSession();
  const t = useTranslations('userScoreBadge');
  const [totalScore, setTotalScore] = useState<number>(0);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScore = async () => {
      if (!session?.user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/score?email=${session.user.email}`);
        if (response.ok) {
          const data = await response.json();
          setTotalScore(data.totalScore || 0);
          setUserPhoto(data.photo);
          setUserName(data.name);
        }
      } catch (error) {
        console.error('Error fetching score:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScore();
  }, [session?.user?.email]);

  if (!session?.user) return null;

  return (
    <div className="fixed top-20 md:top-24 left-4 md:left-6 z-[9980]">
      <Link href="/dashboard/skaters/profile">
        <div className="bg-gradient-to-r from-neutral-900/95 to-neutral-800/95 backdrop-blur-sm px-4 py-3 rounded-lg border-2 border-accent-cyan-500 shadow-lg shadow-accent-cyan-500/30 hover:shadow-accent-cyan-500/50 transition-all cursor-pointer hover:scale-105 group">
          <div className="flex items-center gap-3">
            {/* Avatar/Icon - Prioriza foto de DB, luego session, luego inicial */}
            <div className="flex-shrink-0">
              {(userPhoto || session.user.image) ? (
                <img
                  src={userPhoto || session.user.image || ''}
                  alt={userName || session.user.name || 'User'}
                  className="w-10 h-10 rounded-full border-2 border-accent-cyan-400 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan-500 to-accent-blue-500 flex items-center justify-center border-2 border-accent-cyan-400">
                  <span className="text-white font-black text-lg">
                    {(userName || session.user.name)?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex flex-col">
              <p className="text-white font-black text-sm uppercase tracking-wider leading-tight">
                {userName || session.user.name || t('skater')}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-accent-yellow-400 text-xs font-black">⭐</span>
                <span className="text-accent-yellow-400 font-black text-xs">
                  {isLoading ? '...' : totalScore.toLocaleString()} {t('pts')}
                </span>
              </div>
            </div>
          </div>

          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-lg border-2 border-accent-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </div>
      </Link>
    </div>
  );
}
