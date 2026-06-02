import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/dynamic-challenges/progress
 * Get overall community progress and next milestone
 */
export async function GET() {
  try {
    // Get current counts
    const userCount = await prisma.user.count();
    const videoCount = await prisma.submission.count();
    const evaluationCount = await prisma.submission.count({
      where: {
        status: {
          in: ['approved', 'rejected']
        }
      }
    });

    // Get next pending milestone
    const nextMilestone = await prisma.dynamicChallenge.findFirst({
      where: {
        status: 'PENDING',
        type: 'COMMUNITY_MILESTONE'
      },
      orderBy: {
        triggerValue: 'asc'
      }
    });

    // Calculate progress for next milestone
    let milestoneProgress = null;
    if (nextMilestone) {
      let current = 0;
      switch (nextMilestone.triggerType) {
        case 'USER_COUNT':
          current = userCount;
          break;
        case 'VIDEO_COUNT':
          current = videoCount;
          break;
        case 'EVALUATION_COUNT':
          current = evaluationCount;
          break;
      }

      milestoneProgress = {
        id: nextMilestone.id,
        name: nextMilestone.name,
        description: nextMilestone.description,
        type: nextMilestone.triggerType.toLowerCase().replace('_', ' '),
        current,
        target: nextMilestone.triggerValue,
        percentage: Math.min(Math.round((current / nextMilestone.triggerValue) * 100), 100),
        points: nextMilestone.points
      };
    }

    return NextResponse.json({
      userCount,
      videoCount,
      evaluationCount,
      nextMilestone: milestoneProgress
    });
  } catch (error) {
    console.error('Error fetching community progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
