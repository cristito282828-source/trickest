import { WallActivityType, WallReactionType } from '@prisma/client';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';

const validReactions = Object.values(WallReactionType);

function isWallReactionType(value: unknown): value is WallReactionType {
  return typeof value === 'string' && validReactions.some((reaction) => reaction === value);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { activityId: rawActivityId } = await params;
    const activityId = Number(rawActivityId);
    if (!Number.isInteger(activityId) || activityId <= 0) {
      return errorResponse('INVALID_ID', 'Invalid activity ID', 400);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }

    if (!hasReaction(body) || !isWallReactionType(body.reaction)) {
      return errorResponse('INVALID_REACTION', 'Unsupported reaction type', 400);
    }

    const activity = await prisma.wallActivity.findUnique({
      where: { id: activityId },
      select: { id: true, type: true, sourceId: true },
    });
    if (!activity || !(await isActivityVisible(activity.type, activity.sourceId))) {
      return errorResponse('NOT_FOUND', 'Wall activity not found', 404);
    }

    await prisma.wallReaction.upsert({
      where: {
        activityId_userId: {
          activityId,
          userId: session.user.email,
        },
      },
      create: {
        activityId,
        userId: session.user.email,
        type: body.reaction,
      },
      update: {
        type: body.reaction,
      },
    });

    return successResponse(await getReactionState(activityId, session.user.email));
  } catch (error) {
    console.error('[API /wall/[activityId]/reaction] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error saving reaction', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { activityId: rawActivityId } = await params;
    const activityId = Number(rawActivityId);
    if (!Number.isInteger(activityId) || activityId <= 0) {
      return errorResponse('INVALID_ID', 'Invalid activity ID', 400);
    }

    const activity = await prisma.wallActivity.findUnique({
      where: { id: activityId },
      select: { id: true, type: true, sourceId: true },
    });
    if (!activity || !(await isActivityVisible(activity.type, activity.sourceId))) {
      return errorResponse('NOT_FOUND', 'Wall activity not found', 404);
    }

    await prisma.wallReaction.deleteMany({
      where: { activityId, userId: session.user.email },
    });

    return successResponse(await getReactionState(activityId, session.user.email));
  } catch (error) {
    console.error('[API /wall/[activityId]/reaction] DELETE error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error removing reaction', 500);
  }
}

async function isActivityVisible(type: WallActivityType, sourceId: number) {
  switch (type) {
    case WallActivityType.USER_JOINED:
      return Boolean(await prisma.user.findFirst({
        where: { id: sourceId, isActive: true, profileStatus: 'complete' },
        select: { id: true },
      }));
    case WallActivityType.TEAM_CREATED:
      return Boolean(await prisma.team.findFirst({
        where: { id: sourceId, isActive: true },
        select: { id: true },
      }));
    case WallActivityType.CHALLENGE_CREATED:
      return Boolean(await prisma.challenge.findUnique({
        where: { id: sourceId },
        select: { id: true },
      }));
    case WallActivityType.SUBMISSION_APPROVED:
      return Boolean(await prisma.submission.findFirst({
        where: {
          id: sourceId,
          status: 'approved',
          videoUrl: { not: '' },
          OR: [{ videoSource: 'youtube' }, { videoStatus: 'ready' }],
        },
        select: { id: true },
      }));
    case WallActivityType.SPOT_ADDED: {
      const spot = await prisma.spot.findUnique({
        where: { id: sourceId },
        select: { createdBy: true },
      });
      if (!spot) return false;
      const creator = await prisma.user.findUnique({
        where: { email: spot.createdBy },
        select: { isActive: true, showOnMap: true },
      });
      return Boolean(creator?.isActive && creator.showOnMap);
    }
    default:
      return false;
  }
}

function hasReaction(value: unknown): value is { reaction: unknown } {
  return Boolean(value && typeof value === 'object' && 'reaction' in value);
}

async function getReactionState(activityId: number, userId: string) {
  const [groups, userReaction] = await Promise.all([
    prisma.wallReaction.groupBy({
      by: ['type'],
      where: { activityId },
      _count: { _all: true },
    }),
    prisma.wallReaction.findUnique({
      where: { activityId_userId: { activityId, userId } },
      select: { type: true },
    }),
  ]);

  const reactionCounts: Record<WallReactionType, number> = {
    LIKE: 0,
    LOVE: 0,
    LAUGH: 0,
    WOW: 0,
    ANGRY: 0,
  };
  for (const group of groups) {
    reactionCounts[group.type] = group._count._all;
  }

  return { reactionCounts, userReaction: userReaction?.type ?? null };
}
