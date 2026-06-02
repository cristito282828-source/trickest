import type { Prisma } from '@prisma/client';
import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'score'; // score, followers, recent
    const role = searchParams.get('role') || 'all'; // all, skater, judge, admin

    // Build where clause
    const where: Prisma.UserWhereInput = {
      isActive: true,
    };

    if (role !== 'all') {
      where.role = role;
    }

    // Build order by - simplified for now
    let orderBy: Prisma.UserFindManyArgs['orderBy'] = { createdAt: 'desc' }; // default: most recent

    // For now, we'll use simple sorting. Complex sorting can be added later
    switch (sortBy) {
      case 'score':
        // Sort by total submissions count as proxy for score
        orderBy = { submissions: { _count: 'desc' } };
        break;
      case 'followers':
        // Sort by follower count
        orderBy = { followers: { _count: 'desc' } };
        break;
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Get skaters with their stats - simplified query
    const skaters = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        photo: true,
        role: true,
        ciudad: true,
        departamento: true,
        estado: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            submissions: true,
            followers: true,
            following: true,
          },
        },
        submissions: {
          where: { status: 'approved' },
          select: {
            score: true,
          },
          take: 100, // Limit submissions for performance
        },
      },
      orderBy: { createdAt: 'desc' }, // Simple ordering for now
      take: Math.min(limit, 50), // Max 50 per request
      skip: offset,
    });

    // Calculate stats for each skater
    const skatersWithStats = skaters.map((skater) => {
      const totalScore = skater.submissions.reduce(
        (acc, sub) => acc + (sub.score || 0),
        0
      );
      const approvedSubmissions = skater.submissions.length;
      const avgScore =
        approvedSubmissions > 0
          ? Math.round(totalScore / approvedSubmissions)
          : 0;

      // Build location string
      const locationParts = [
        skater.ciudad,
        skater.departamento,
        skater.estado,
      ].filter(Boolean);
      const location =
        locationParts.length > 0 ? locationParts.join(', ') : null;

      return {
        id: skater.id,
        username: skater.username,
        email: skater.email,
        name: skater.name,
        photo: skater.photo,
        role: skater.role,
        location,
        team: skater.team,
        memberSince: skater.createdAt,
        stats: {
          totalScore,
          approvedSubmissions,
          avgScore,
          followerCount: skater._count.followers,
          followingCount: skater._count.following,
        },
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    return NextResponse.json({
      skaters: skatersWithStats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching public skaters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
