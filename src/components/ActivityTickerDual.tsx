'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface RecentUser {
  id: string;
  username: string;
  name: string;
  action: string;
  time: string;
  photo?: string | null;
}

const ActivityTickerDual = () => {
  const t = useTranslations('activityTicker');
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch real activity from API
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        console.log('Fetching activity from API...');
        const response = await fetch('/api/activity/recent', {
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Activity data received:', data);
          setRecentUsers(data);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 1800000);
    return () => clearInterval(interval);
  }, []);

  const getActionText = (action: string) => {
    switch (action) {
      case 'new_user':
        return t('justJoined');
      case 'team':
        return t('team');
      default:
        return action;
    }
  };

  const getActionEmoji = (action: string) => {
    if (action === 'team') {
      return '🏆';
    }
    return '🎉';
  };

  if (recentUsers.length === 0) {
    return (
      <div className="w-full bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 border-y-4 border-accent-cyan-500 overflow-hidden">
        <div className="flex items-center justify-center py-3">
          <div className="flex items-center gap-3 text-white animate-pulse">
            <span className="text-2xl">🛹</span>
            <span className="text-neutral-300">Cargando actividad...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 border-y-4 border-accent-cyan-500 overflow-hidden">
      <div className="relative">
        {/* First visible container */}
        <div
          className="flex animate-tick-scroll-alt whitespace-nowrap py-3"
          style={{ animationIterationCount: '1', animationFillMode: 'forwards' }}
          onAnimationEnd={() => setIsVisible(!isVisible)}
        >
          {[...recentUsers, ...recentUsers, ...recentUsers, ...recentUsers].map((user, index) => (
            <div
              key={`${user.id}-1-${index}`}
              className="flex items-center gap-3 mx-8 text-white"
            >
              {user.photo ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-accent-cyan-400 flex-shrink-0">
                  <img
                    src={user.photo}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <span className="text-2xl">{getActionEmoji(user.action)}</span>
              )}
              <span className="font-bold text-accent-cyan-400">{user.name}</span>
              <span className="text-neutral-300">{getActionText(user.action)}</span>
              <span className="text-accent-pink-400 font-black">{user.time}</span>
              <span className="text-neutral-500">•</span>
            </div>
          ))}
        </div>

        {/* Second container (hidden initially) */}
        <div
          className="flex whitespace-nowrap py-3 absolute top-0 left-0"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateX(0)' : 'translateX(100%)', transition: 'none' }}
        >
          {[...recentUsers, ...recentUsers, ...recentUsers, ...recentUsers].map((user, index) => (
            <div
              key={`${user.id}-2-${index}`}
              className="flex items-center gap-3 mx-8 text-white"
            >
              {user.photo ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-accent-cyan-400 flex-shrink-0">
                  <img
                    src={user.photo}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <span className="text-2xl">{getActionEmoji(user.action)}</span>
              )}
              <span className="font-bold text-accent-cyan-400">{user.name}</span>
              <span className="text-neutral-300">{getActionText(user.action)}</span>
              <span className="text-accent-pink-400 font-black">{user.time}</span>
              <span className="text-neutral-500">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityTickerDual;
