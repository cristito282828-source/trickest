import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);

    const followers = await prisma.follow.findMany({
      where: { followingId: decodedUsername },
      include: {
        follower: {
          select: {
            email: true,
            name: true,
            photo: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent followers
    });

    const followerData = followers.map(follow => ({
      email: follow.follower.email,
      name: follow.follower.name,
      photo: follow.follower.photo,
      role: follow.follower.role,
      followedAt: follow.createdAt
    }));

    return NextResponse.json({
      followers: followerData,
      count: followers.length
    });

  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}