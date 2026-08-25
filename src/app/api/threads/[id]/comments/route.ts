import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface CreateCommentRequest {
  content: string;
  parentCommentId?: number;
}

const MAX_COMMENT_LENGTH = 500;
const RATE_LIMIT_MS = 60 * 1000;

/**
 * POST /api/threads/:id/comments - Crear comentario en un hilo del mes.
 * Reusa el modelo SpotComment (polimórfico).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('UNAUTHORIZED', 'You must log in to comment', 401);
    }
    const userEmail = session.user.email;
    const { id } = await params;
    const threadId = parseInt(id, 10);
    if (isNaN(threadId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid thread ID', 400);
    }

    const body: CreateCommentRequest = await req.json();
    const { content, parentCommentId } = body;

    if (!content || typeof content !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'Content is required', 400);
    }
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Comment cannot be empty', 400);
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      return errorResponse(
        'VALIDATION_ERROR',
        `Comment is too long (${trimmed.length}/${MAX_COMMENT_LENGTH})`,
        400
      );
    }

    // Anti-spam
    const words = trimmed.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 10 && uniqueWords.size < words.length * 0.3) {
      return errorResponse('SPAM_DETECTED', 'Your comment looks like spam', 400);
    }

    // Verificar thread existe + activo
    const thread = await prisma.monthlyThread.findUnique({ where: { id: threadId } });
    if (!thread) {
      return errorResponse('NOT_FOUND', 'Thread not found', 404);
    }
    if (thread.status !== 'active' || thread.endsAt < new Date()) {
      return errorResponse('THREAD_CLOSED', 'This thread is closed', 400);
    }

    // Si es reply, validar parent
    let parentComment = null;
    if (parentCommentId) {
      parentComment = await prisma.spotComment.findUnique({
        where: { id: parentCommentId },
        include: { user: { select: { email: true } } },
      });
      if (!parentComment) {
        return errorResponse('NOT_FOUND', 'Parent comment does not exist', 404);
      }
      if (parentComment.threadId !== threadId) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Parent comment does not belong to this thread',
          400
        );
      }
    }

    // Rate limit
    const recentComment = await prisma.spotComment.findFirst({
      where: {
        threadId,
        userId: userEmail,
        createdAt: { gte: new Date(Date.now() - RATE_LIMIT_MS) },
      },
    });
    if (recentComment) {
      return errorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Wait 1 minute before commenting again',
        429
      );
    }

    // Crear comentario
    const comment = await prisma.spotComment.create({
      data: {
        threadId,
        spotId: null, // explícitamente null para confirmar polimórfico
        userId: userEmail,
        content: trimmed,
        ...(parentCommentId && { parentCommentId }),
      },
      include: {
        user: { select: { name: true, photo: true, username: true } },
      },
    });

    // Notificación si es reply
    if (parentComment && parentComment.userId !== userEmail) {
      await prisma.notification.create({
        data: {
          userId: parentComment.userId,
          type: 'comment_reply',
          title: 'New reply to your comment',
          message: `${comment.user?.name || 'Someone'} replied to your comment in the monthly thread`,
          link: `/threads/${threadId}?comment=${comment.id}`,
          metadata: {
            threadId,
            commentId: comment.id,
            parentCommentId,
          },
        },
      });
    }

    return successResponse({
      comment: {
        id: comment.id,
        content: comment.content,
        likes: comment.likes,
        dislikes: comment.dislikes,
        createdAt: comment.createdAt,
        parentCommentId: comment.parentCommentId,
        user: comment.user,
        replyCount: 0,
      },
    });
  } catch (error: any) {
    console.error('[POST /api/threads/:id/comments] Error:', error);
    if (error?.code === 'P2021') {
      return errorResponse('TABLE_NOT_FOUND', 'Run: npx prisma migrate dev', 500);
    }
    return errorResponse('INTERNAL_ERROR', 'Could not create comment', 500);
  }
}

/**
 * GET /api/threads/:id/comments - Obtener comentarios top-level del thread.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const { id } = await params;
    const threadId = parseInt(id, 10);
    if (isNaN(threadId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid thread ID', 400);
    }

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'recent';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    const orderBy =
      sort === 'popular'
        ? [{ likes: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const comments = await prisma.spotComment.findMany({
      where: {
        threadId,
        isHidden: false,
        parentCommentId: null,
      },
      orderBy,
      take: limit,
      skip: offset,
      include: {
        user: { select: { name: true, photo: true, username: true } },
        _count: { select: { replies: true } },
        ...(userEmail
          ? {
              votes: {
                where: { userId: userEmail },
                select: { voteType: true },
              },
            }
          : {}),
      },
    });

    const processed = comments.map((c) => ({
      ...c,
      userVote: c.votes?.[0]?.voteType || null,
      replyCount: c._count?.replies || 0,
      votes: undefined,
      _count: undefined,
    }));

    const total = await prisma.spotComment.count({
      where: { threadId, isHidden: false, parentCommentId: null },
    });

    return successResponse({
      comments: processed,
      total,
      hasMore: offset + processed.length < total,
    });
  } catch (error: any) {
    console.error('[GET /api/threads/:id/comments] Error:', error);
    if (error?.code === 'P2021') {
      return errorResponse('TABLE_NOT_FOUND', 'Run: npx prisma migrate dev', 500);
    }
    return errorResponse('INTERNAL_ERROR', 'Could not fetch comments', 500);
  }
}
