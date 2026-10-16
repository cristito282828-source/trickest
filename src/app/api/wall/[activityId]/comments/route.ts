import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/validation';
import { isWallActivityVisible } from '@/lib/wall-activity';

export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { activityId: rawActivityId } = await params;
    const result = await getVisibleActivity(rawActivityId);
    if (result.error) return result.error;

    const rawParentCommentId = request.nextUrl.searchParams.get('parentCommentId');
    const parentCommentId = rawParentCommentId === null ? null : Number(rawParentCommentId);
    const offset = Number(request.nextUrl.searchParams.get('offset') ?? 0);
    if (!Number.isInteger(offset) || offset < 0) {
      return errorResponse('INVALID_OFFSET', 'Invalid comment offset', 400);
    }
    if (parentCommentId !== null) {
      if (!Number.isInteger(parentCommentId) || parentCommentId <= 0) {
        return errorResponse('INVALID_PARENT_ID', 'Invalid parent comment ID', 400);
      }
      const parent = await prisma.wallComment.findFirst({
        where: { id: parentCommentId, activityId: result.activity.id, parentCommentId: null },
        select: { id: true },
      });
      if (!parent) {
        return errorResponse('PARENT_NOT_FOUND', 'Parent comment not found', 404);
      }
    }

    const where = { activityId: result.activity.id, parentCommentId };
    const [comments, total] = await Promise.all([
      prisma.wallComment.findMany({
        where,
        orderBy: { createdAt: parentCommentId === null ? 'desc' : 'asc' },
        skip: offset,
        take: 50,
        include: {
          user: { select: { name: true, photo: true, username: true } },
          ...(parentCommentId === null ? { _count: { select: { replies: true } } } : {}),
        },
      }),
      prisma.wallComment.count({ where }),
    ]);

    return successResponse({ comments, total, hasMore: offset + comments.length < total });
  } catch (error) {
    console.error('[API /wall/[activityId]/comments] GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error loading wall comments', 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email;
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { activityId: rawActivityId } = await params;
    const result = await getVisibleActivity(rawActivityId);
    if (result.error) return result.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }
    if (!isCommentRequest(body)) {
      return errorResponse('INVALID_COMMENT', 'Comment content is required', 400);
    }

    const content = body.content.trim();
    if (!content) {
      return errorResponse('EMPTY_COMMENT', 'Comment cannot be empty', 400);
    }
    if (content.length > 500) {
      return errorResponse('COMMENT_TOO_LONG', 'Comments must be 500 characters or fewer', 400);
    }

    let parentCommentId: number | null = null;
    if (body.parentCommentId !== undefined) {
      parentCommentId = body.parentCommentId;
      if (!Number.isInteger(parentCommentId) || parentCommentId <= 0) {
        return errorResponse('INVALID_PARENT_ID', 'Invalid parent comment ID', 400);
      }
      const parent = await prisma.wallComment.findFirst({
        where: { id: parentCommentId, activityId: result.activity.id, parentCommentId: null },
        select: { id: true },
      });
      if (!parent) {
        return errorResponse('PARENT_NOT_FOUND', 'Parent comment not found', 404);
      }
    }

    const recentComment = await prisma.wallComment.findFirst({
      where: {
        activityId: result.activity.id,
        userId,
        createdAt: { gte: new Date(Date.now() - 10_000) },
      },
      select: { id: true },
    });
    if (recentComment) {
      return errorResponse('RATE_LIMIT_EXCEEDED', 'Please wait before commenting again', 429);
    }

    const comment = await prisma.wallComment.create({
      data: {
        activityId: result.activity.id,
        userId,
        parentCommentId,
        content,
      },
      include: {
        user: { select: { name: true, photo: true, username: true } },
      },
    });

    return successResponse({ comment });
  } catch (error) {
    console.error('[API /wall/[activityId]/comments] POST error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error creating wall comment', 500);
  }
}

function isCommentRequest(value: unknown): value is { content: string; parentCommentId?: number } {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'content' in value &&
    typeof value.content === 'string' &&
    (!('parentCommentId' in value) || typeof value.parentCommentId === 'number')
  );
}
