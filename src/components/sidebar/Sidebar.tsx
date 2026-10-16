'use client'
import React, { useMemo } from 'react'
import { SidebarMenuItem } from './SidebarMenuItem';
import { MdOutlineSkateboarding, MdGavel, MdAdminPanelSettings, MdLeaderboard, MdGroups, MdLogout, MdSettings, MdShoppingCart, MdDynamicFeed } from "react-icons/md";
import { GiSkateboard } from "react-icons/gi";
import { GiTrophy } from "react-icons/gi";
import { FaVideo } from "react-icons/fa";
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';


export const Sidebar = () => {
  const { data: session } = useSession();
  const t = useTranslations();

  // Menu items with translation keys
  const skaterMenuItems = useMemo(() => [
    {
      path: '/dashboard/muro',
      icon: <MdDynamicFeed size={28} />,
      title: t('menu.wall'),
      subTitle: t('menu.communityActivity')
    },
    {
      path: '/dashboard/skaters/profile',
      icon: <MdOutlineSkateboarding size={28} />,
      title: t('menu.profile'),
      subTitle: t('menu.editProfile')
    },
    {
      path: '/dashboard/skaters/tricks',
      icon: <GiSkateboard size={28} />,
      title: t('menu.tricks'),
      subTitle: t('menu.inProgress')
    },
    {
      path: '/dashboard/skaters/submissions',
      icon: <FaVideo size={28} />,
      title: t('menu.submissions'),
      subTitle: t('menu.history')
    },
    {
      path: '/dashboard/skaters/orders',
      icon: <MdShoppingCart size={28} />,
      title: t('menu.orders'),
      subTitle: t('menu.myOrders')
    },
    {
      path: '/dashboard/leaderboard',
      icon: <MdLeaderboard size={28} />,
      title: t('menu.ranking'),
      subTitle: t('menu.topSkaters')
    },
    {
      path: '/dashboard/teams',
      icon: <MdGroups size={28} />,
      title: t('menu.teams'),
      subTitle: t('menu.myTeam')
    },
    {
      path: '/dashboard/skaters/logros',
      icon: <GiTrophy size={28} />,
      title: t('menu.achievements'),
      subTitle: t('menu.badges')
    }
  ], [t]);

  const judgeMenuItems = useMemo(() => [
    {
      path: '/dashboard/muro',
      icon: <MdDynamicFeed size={28} />,
      title: t('menu.wall'),
      subTitle: t('menu.communityActivity')
    },
    {
      path: '/dashboard/judges/evaluate',
      icon: <MdGavel size={28} />,
      title: t('menu.evaluate'),
      subTitle: t('menu.pendingHistory')
    },
    {
      path: '/dashboard/skaters/profile',
      icon: <MdOutlineSkateboarding size={28} />,
      title: t('menu.profile'),
      subTitle: t('menu.editProfile')
    },
    {
      path: '/dashboard/skaters/tricks',
      icon: <GiSkateboard size={28} />,
      title: t('menu.tricks'),
      subTitle: t('menu.asSkater')
    },
    {
      path: '/dashboard/leaderboard',
      icon: <MdLeaderboard size={28} />,
      title: t('menu.ranking'),
      subTitle: t('menu.topSkaters')
    },
    {
      path: '/dashboard/teams',
      icon: <MdGroups size={28} />,
      title: t('menu.teams'),
      subTitle: t('menu.myTeam')
    }
  ], [t]);

  const adminMenuItems = useMemo(() => [
    {
      path: '/dashboard/muro',
      icon: <MdDynamicFeed size={28} />,
      title: t('menu.wall'),
      subTitle: t('menu.communityActivity')
    },
    {
      path: '/dashboard/skaters/profile',
      icon: <MdOutlineSkateboarding size={28} />,
      title: t('menu.profile'),
      subTitle: t('menu.editProfile')
    },
    {
      path: '/dashboard/admin/users',
      icon: <MdAdminPanelSettings size={28} />,
      title: t('menu.users'),
      subTitle: t('menu.manage')
    },
    {
      path: '/dashboard/admin/challenges',
      icon: <GiSkateboard size={28} />,
      title: t('menu.challenges'),
      subTitle: t('menu.manage')
    },
    {
      path: '/dashboard/admin/orders',
      icon: <MdShoppingCart size={28} />,
      title: t('menu.orders'),
      subTitle: t('menu.manage')
    },
    {
      path: '/dashboard/admin/settings',
      icon: <MdSettings size={28} />,
      title: t('menu.settings'),
      subTitle: t('menu.system')
    },
    {
      path: '/dashboard/judges/evaluate',
      icon: <MdGavel size={28} />,
      title: t('menu.evaluate'),
      subTitle: t('menu.score')
    },
    {
      path: '/dashboard/leaderboard',
      icon: <MdLeaderboard size={28} />,
      title: t('menu.ranking'),
      subTitle: t('menu.topSkaters')
    },
    {
      path: '/dashboard/teams',
      icon: <MdGroups size={28} />,
      title: t('menu.teams'),
      subTitle: t('menu.manage')
    }
  ], [t]);

  // Determine which menu to show based on role
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

  return (
    <div
      id="menu"
      className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-[#f0f2f5] text-neutral-800 lg:w-72 lg:border-r lg:border-neutral-200"
    >
      <div className="overflow-y-auto flex-1">
        {/* Navigation menu */}
        <div className="px-4 py-5">
          <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
            {t('sidebar.navigation')}
          </p>
          <div className="space-y-1">
            {menuItems.map(item => (
              <SidebarMenuItem key={item.path} {...item} />
            ))}
          </div>
        </div>
      </div>

      {/* Logout button - sticky at bottom */}
      <div className="shrink-0 border-t border-neutral-200 bg-[#f0f2f5] px-4 py-4">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          <MdLogout size={20} />
          {t('auth.signOut')}
        </button>
      </div>
    </div>
  )
}
