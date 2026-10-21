import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';
import { isWallActivityVisible } from '@/lib/wall-activity';

interface RouteContext {
  params: Promise<{ activityId: string }>;
}

async function getVisibleActivity(rawActivityId: string) {
  const activityId = Number(rawActivityId);
  if (!Number.isInteger(activityId) || activityId <= 0) {
    return { error: errorResponse('INVALID_ID', 'Invalid activity ID', 400) };
  }

  const activity = await prisma.wallActivity.findUnique({
    where: { id: activityId },
    select: { id: true, type: true, sourceId: true },
  });
  if (!activity || !(await isWallActivityVisible(activity.type, activity.sourceId))) {
    return { error: errorResponse('NOT_FOUND', 'Wall activity not found', 404) };
  }

  return { activity };
}

async function getRepostState(activityId: number, userId: string) {
  const [count, repost] = await Promise.all([
    prisma.wallRepost.count({ where: { activityId } }),
    prisma.wallRepost.findUnique({
      where: { activityId_userId: { activityId, userId } },
      select: { id: true },
    }),
  ]);

  return { count, isReposted: repost !== null };
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email;
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { activityId: rawActivityId } = await params;
    const result = await getVisibleActivity(rawActivityId);
    if (result.error) return result.error;

    await prisma.wallRepost.createMany({
      data: [{ activityId: result.activity.id, userId }],
      skipDuplicates: true,
    });

    return successResponse(await getRepostState(result.activity.id, userId));
  } catch (error) {
    console.error('[API /wall/[activityId]/repost] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error saving repost', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email;
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { activityId: rawActivityId } = await params;
    const result = await getVisibleActivity(rawActivityId);
    if (result.error) return result.error;

    await prisma.wallRepost.deleteMany({
      where: { activityId: result.activity.id, userId },
    });

    return successResponse(await getRepostState(result.activity.id, userId));
  } catch (error) {
    console.error('[API /wall/[activityId]/repost] DELETE error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error removing repost', 500);
  }
}
