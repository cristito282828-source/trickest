import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);

    const following = await prisma.follow.findMany({
      where: { followerId: decodedUsername },
      include: {
        following: {
          select: {
            email: true,
            name: true,
            photo: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent following
    });

    const followingData = following.map(follow => ({
      email: follow.following.email,
      name: follow.following.name,
      photo: follow.following.photo,
      role: follow.following.role,
      followedAt: follow.createdAt
    }));

    return NextResponse.json({
      following: followingData,
      count: following.length
    });

  } catch (error) {
    console.error('Error fetching following:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}