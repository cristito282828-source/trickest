import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUsername } = body;

    if (!targetUsername) {
      return NextResponse.json({ error: 'Target username is required' }, { status: 400 });
    }

    if (targetUsername === session.user.username!) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.username!,
          followingId: targetUsername
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: session.user.username!,
            followingId: targetUsername
          }
        }
      });

      return NextResponse.json({
        success: true,
        action: 'unfollow',
        message: 'User unfollowed successfully'
      });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: session.user.username!,
          followingId: targetUsername
        }
      });

      return NextResponse.json({
        success: true,
        action: 'follow',
        message: 'User followed successfully'
      });
    }

  } catch (error) {
    console.error('Error toggling follow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUsername = searchParams.get('user');

    if (!targetUsername) {
      return NextResponse.json({ error: 'Target username is required' }, { status: 400 });
    }

    // Check if current user is following the target user
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.username!,
          followingId: targetUsername
        }
      }
    });

    // Get follower/following counts
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: targetUsername } }),
      prisma.follow.count({ where: { followerId: targetUsername } })
    ]);

    return NextResponse.json({
      isFollowing: !!follow,
      followerCount,
      followingCount
    });

  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}