import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get latest 25 users from database (regardless of date)
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        photo: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 25, // Last 25 users
    });

    // Get latest 5 teams from database (regardless of date)
    const recentTeams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        logo: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5, // Last 5 teams
    });

    // Format users for ticker
    const usersData = recentUsers.map(user => {
      const timeDiff = Date.now() - user.createdAt.getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor(timeDiff / (1000 * 60));

      let timeString = '';
      if (days > 0) {
        timeString = `${days}d`;
      } else if (hours > 0) {
        timeString = `${hours}h`;
      } else if (minutes > 0) {
        timeString = `${minutes}m`;
      } else {
        timeString = '1m';
      }

      return {
        id: user.id.toString(),
        username: user.username || user.name?.toLowerCase().replace(/\s+/g, '') || 'user',
        name: user.name || 'Skater',
        action: 'new_user' as const,
        time: timeString,
        photo: user.photo || '/logo.png'
      };
    });

    // Format teams for ticker
    const teamsData = recentTeams.map(team => {
      const timeDiff = Date.now() - team.createdAt.getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor(timeDiff / (1000 * 60));

      let timeString = '';
      if (days > 0) {
        timeString = `${days}d`;
      } else if (hours > 0) {
        timeString = `${hours}h`;
      } else if (minutes > 0) {
        timeString = `${minutes}m`;
      } else {
        timeString = '1m';
      }

      return {
        id: `team-${team.id}`,
        username: 'team',
        name: team.name || 'Equipo',
        action: 'team' as const,
        time: timeString,
        photo: team.logo || '/logo.png'
      };
    });

    // Mix users and teams
    const mixedData = [...usersData, ...teamsData];

    // Shuffle for variety
    const shuffled = mixedData.sort(() => Math.random() - 0.5);

    return NextResponse.json(shuffled);
  } catch (error) {
    // Fallback to mock data if database fails
    const fallbackData = [
      { id: '1', username: 'skater_pro', name: 'Carlos M.', action: 'new_user' as const, time: '2m', photo: '/logo.png' },
      { id: '2', username: 'ollie_king', name: 'María L.', action: 'new_user' as const, time: '5m', photo: '/logo.png' },
    ];

    return NextResponse.json(fallbackData);
  }
}
