'use client'
import React, { useMemo } from 'react'
import { SidebarMenuItem } from './SidebarMenuItem';
import { MdOutlineSkateboarding, MdGavel, MdAdminPanelSettings, MdLeaderboard, MdGroups, MdLogout, MdSettings } from "react-icons/md";
import { GiSkateboard } from "react-icons/gi";
import { GiTrophy } from "react-icons/gi";
import { FaVideo } from "react-icons/fa";
import { useSession, signOut } from 'next-auth/react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms';


export const Sidebar = () => {
  const { data: session } = useSession();
  const t = useTranslations();

  // Menu items with translation keys
  const skaterMenuItems = useMemo(() => [
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
      className="bg-neutral-900 h-full z-10 text-neutral-300 w-full lg:w-72 left-0 border-r-4 border-neutral-800 flex flex-col overflow-hidden"
    >
      <div className="overflow-y-auto flex-1">
        {/* Navigation menu */}
        <div className="px-4 pb-4">
          <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-3 px-2">
            {t('sidebar.navigation')}
          </p>
          <div className="space-y-2">
            {menuItems.map(item => (
              <SidebarMenuItem key={item.path} {...item} />
            ))}
          </div>
        </div>
      </div>

      {/* Logout button - sticky at bottom */}
      <div className="px-4 pb-6 pt-4 border-t-4 border-neutral-800 bg-neutral-900 shrink-0">
        <Button
          onClick={() => signOut({ callbackUrl: '/' })}
          variant="danger"
          size="md"
          fullWidth
          leftIcon={<MdLogout size={24} />}
        >
          {t('auth.signOut')}
        </Button>
      </div>
    </div>
  )
}
