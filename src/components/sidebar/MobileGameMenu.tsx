'use client'
import React, { useMemo, useState } from 'react'
import { MdOutlineSkateboarding, MdGavel, MdAdminPanelSettings, MdLeaderboard, MdGroups, MdLogout } from "react-icons/md";
import { GiSkateboard } from "react-icons/gi";
import { GiTrophy } from "react-icons/gi";
import { FaVideo } from "react-icons/fa";
import { useSession, signOut } from 'next-auth/react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

interface MenuItem {
  path: string;
  icon: React.ReactElement;
  title: string;
  action?: () => void;
}

export const MobileGameMenu = () => {
  const { data: session } = useSession();
  const t = useTranslations();
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Main navigation items (show 4 primary on bottom bar)
  const skaterMenuItems: MenuItem[] = useMemo(() => [
    {
      path: '/dashboard/skaters/profile',
      icon: <MdOutlineSkateboarding size={24} />,
      title: t('menu.profile')
    },
    {
      path: '/dashboard/skaters/tricks',
      icon: <GiSkateboard size={24} />,
      title: t('menu.tricks')
    },
    {
      path: '/dashboard/skaters/submissions',
      icon: <FaVideo size={24} />,
      title: t('menu.submissions')
    },
    {
      path: '/dashboard/leaderboard',
      icon: <MdLeaderboard size={24} />,
      title: t('menu.ranking')
    }
  ], [t]);

  const judgeMenuItems: MenuItem[] = useMemo(() => [
    {
      path: '/dashboard/judges/evaluate',
      icon: <MdGavel size={24} />,
      title: t('menu.evaluate')
    },
    {
      path: '/dashboard/skaters/profile',
      icon: <MdOutlineSkateboarding size={24} />,
      title: t('menu.profile')
    },
    {
      path: '/dashboard/skaters/tricks',
      icon: <GiSkateboard size={24} />,
      title: t('menu.tricks')
    },
    {
      path: '/dashboard/leaderboard',
      icon: <MdLeaderboard size={24} />,
      title: t('menu.ranking')
    }
  ], [t]);

  const adminMenuItems: MenuItem[] = useMemo(() => [
    {
      path: '/dashboard/admin/users',
      icon: <MdAdminPanelSettings size={24} />,
      title: t('menu.users')
    },
    {
      path: '/dashboard/admin/challenges',
      icon: <GiSkateboard size={24} />,
      title: t('menu.challenges')
    },
    {
      path: '/dashboard/judges/evaluate',
      icon: <MdGavel size={24} />,
      title: t('menu.evaluate')
    },
    {
      path: '/dashboard/leaderboard',
      icon: <MdLeaderboard size={24} />,
      title: t('menu.ranking')
    }
  ], [t]);

  // Secondary items (show in "MORE" popup)
  const getSecondaryItems = (): MenuItem[] => {
    const userRole = session?.user?.role || 'skater';

    if (userRole === 'admin') {
      return [
        {
          path: '/dashboard/admin/settings',
          icon: <MdAdminPanelSettings size={24} />,
          title: t('menu.settings')
        },
        {
          path: '/dashboard/teams',
          icon: <MdGroups size={24} />,
          title: t('menu.teams')
        }
      ];
    } else if (userRole === 'judge') {
      return [
        {
          path: '/dashboard/teams',
          icon: <MdGroups size={24} />,
          title: t('menu.teams')
        }
      ];
    } else {
      return [
        {
          path: '/dashboard/teams',
          icon: <MdGroups size={24} />,
          title: t('menu.teams')
        },
        {
          path: '/dashboard/skaters/logros',
          icon: <GiTrophy size={24} />,
          title: t('menu.achievements')
        }
      ];
    }
  };

  const menuItems = useMemo(() => {
    const userRole = session?.user?.role || 'skater';

    if (userRole === 'admin') {
      return adminMenuItems;
    } else if (userRole === 'judge') {
      return judgeMenuItems;
    } else {
      return skaterMenuItems;
    }
  }, [session?.user?.role, adminMenuItems, judgeMenuItems, skaterMenuItems]);

  const secondaryItems = getSecondaryItems();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Fixed bottom navigation bar - Game HUD style */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9995] bg-neutral-900/95 backdrop-blur-md border-t-4 border-accent-cyan-500/50 shadow-2xl shadow-accent-cyan-500/20">
        <div className="flex items-center justify-around px-2 py-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-col items-center gap-1 px-2 py-1 min-w-[60px]"
            >
              <div className={`
                relative p-2 rounded-lg transition-all duration-200
                ${isActive(item.path)
                  ? 'bg-gradient-to-br from-accent-cyan-500 to-accent-purple-600 shadow-lg shadow-accent-cyan-500/50 scale-110'
                  : 'bg-neutral-800 hover:bg-neutral-700'
                }
              `}>
                {/* Active glow effect */}
                {isActive(item.path) && (
                  <div className="absolute inset-0 bg-accent-cyan-400/30 rounded-lg animate-pulse blur-sm"></div>
                )}
                <div className="relative">
                  {React.cloneElement(item.icon, {
                    className: isActive(item.path)
                      ? 'text-white drop-shadow-lg'
                      : 'text-neutral-400'
                  })}
                </div>
              </div>
              <span className={`
                text-[10px] font-black uppercase tracking-wider
                ${isActive(item.path) ? 'text-accent-cyan-400' : 'text-neutral-500'}
              `}>
                {item.title.substring(0, 6)}
              </span>
            </Link>
          ))}

          {/* MORE button - floating action menu style */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`
                relative p-2 rounded-lg transition-all duration-200
                ${showMoreMenu
                  ? 'bg-gradient-to-br from-accent-purple-500 to-accent-pink-500 shadow-lg shadow-accent-purple-500/50 scale-110'
                  : 'bg-neutral-800 hover:bg-neutral-700'
                }
              `}
            >
              {/* More dots icon */}
              <div className="flex flex-col items-center gap-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${showMoreMenu ? 'bg-white' : 'bg-neutral-400'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full ${showMoreMenu ? 'bg-white' : 'bg-neutral-400'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full ${showMoreMenu ? 'bg-white' : 'bg-neutral-400'}`}></div>
              </div>
            </button>

            {/* Floating "MORE" menu popup */}
            {showMoreMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-neutral-900/98 backdrop-blur-xl border-4 border-accent-purple-500/50 rounded-xl shadow-2xl shadow-accent-purple-500/30 overflow-hidden">
                <div className="p-2">
                  {secondaryItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setShowMoreMenu(false)}
                      className={`
                        flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                        ${isActive(item.path)
                          ? 'bg-gradient-to-r from-accent-purple-500 to-accent-pink-500'
                          : 'hover:bg-neutral-800'
                        }
                      `}
                    >
                      <div className={isActive(item.path) ? 'text-white' : 'text-neutral-400'}>
                        {item.icon}
                      </div>
                      <span className={`
                        text-sm font-black uppercase tracking-wide
                        ${isActive(item.path) ? 'text-white' : 'text-neutral-300'}
                      `}>
                        {item.title}
                      </span>
                    </Link>
                  ))}

                  {/* Logout button */}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-500/20 transition-all duration-200 mt-1"
                  >
                    <MdLogout size={24} className="text-red-400" />
                    <span className="text-sm font-black uppercase tracking-wide text-red-400">
                      {t('auth.signOut')}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close backdrop when more menu is open */}
      {showMoreMenu && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[9994]"
          onClick={() => setShowMoreMenu(false)}
        />
      )}
    </>
  );
};
