import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface CreateCommentRequest {
  content: string;
  parentCommentId?: number;
}

const RATE_LIMIT_MS = 60 * 1000; // 1 minuto
const MAX_COMMENT_LENGTH = 500;

/**
 * POST /api/reels/:id/comments - Crear comentario en un reel.
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
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return errorResponse('INVALID_ID', 'Invalid reel ID', 400);
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
        `Comment is too long (${trimmed.length}/${MAX_COMMENT_LENGTH} characters)`,
        400
      );
    }

    // Anti-spam: ratio de palabras únicas bajo = sospechoso
    const words = trimmed.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 10 && uniqueWords.size < words.length * 0.3) {
      return errorResponse(
        'SPAM_DETECTED',
        'Your comment looks like spam. Please write something more original.',
        400
      );
    }

    // Verificar que el reel existe y está aprobado
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) {
      return errorResponse('NOT_FOUND', 'Reel not found', 404);
    }
    if (submission.status !== 'approved') {
      return errorResponse('NOT_APPROVED', 'Cannot comment on a non-approved reel', 400);
    }

    // Si es reply, validar parent
    let parentComment = null;
    if (parentCommentId) {
      parentComment = await prisma.reelComment.findUnique({
        where: { id: parentCommentId },
        select: { id: true, submissionId: true, userId: true },
      });
      if (!parentComment) {
        return errorResponse('NOT_FOUND', 'Parent comment does not exist', 404);
      }
      if (parentComment.submissionId !== submissionId) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Parent comment does not belong to this reel',
          400
        );
      }
    }

    // Rate limit: 1 comment por minuto por usuario
    const recent = await prisma.reelComment.findFirst({
      where: {
        submissionId,
        userId: userEmail,
        createdAt: { gte: new Date(Date.now() - RATE_LIMIT_MS) },
      },
    });
    if (recent) {
      return errorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Wait 1 minute before commenting again on this reel',
        429
      );
    }

    // Crear comment
    const comment = await prisma.reelComment.create({
      data: {
        submissionId,
        userId: userEmail,
        content: trimmed,
        ...(parentCommentId && { parentCommentId }),
      },
      include: {
        user: {
          select: { name: true, photo: true, username: true },
        },
      },
    });

    // Notifications
    if (parentComment && parentComment.userId !== userEmail) {
      await prisma.notification.create({
        data: {
          userId: parentComment.userId,
          type: 'comment_reply',
          title: 'New reply to your comment',
          message: `${comment.user?.name || 'Someone'} replied to your comment on a reel`,
          link: `/suppls?reel=${submissionId}&comment=${comment.id}`,
          metadata: {
            submissionId,
            commentId: comment.id,
            parentCommentId,
            replierName: comment.user?.name,
            replyContent: trimmed.substring(0, 100),
          },
        },
      });
    } else if (!parentCommentId) {
      // Top-level: notificar al autor del reel + otros commenters
      const interestedEmails = new Set<string>();
      if (submission.userId !== userEmail) {
        interestedEmails.add(submission.userId);
      }
      const otherCommenters = await prisma.reelComment.findMany({
        where: {
          submissionId,
          userId: { not: userEmail },
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      otherCommenters.forEach((c) => {
        if (c.userId !== userEmail) interestedEmails.add(c.userId);
      });
      if (interestedEmails.size > 0) {
        await prisma.notification.createMany({
          data: Array.from(interestedEmails).map((email) => ({
            userId: email,
            type: 'reel_comment',
            title: 'New comment on a reel',
            message: `${comment.user?.name || 'Someone'} commented on a reel`,
            link: `/suppls?reel=${submissionId}&comment=${comment.id}`,
            metadata: {
              submissionId,
              commentId: comment.id,
              commenterName: comment.user?.name,
            },
          })),
        });
      }
    }

    return successResponse({ comment, message: 'Comment created successfully' });
  } catch (error: any) {
    console.error('[API /reels/[id]/comments] POST error:', error);
    const message =
      process.env.NODE_ENV === 'development'
        ? error.message || 'Error creating comment'
        : 'Error creating comment';
    return errorResponse('INTERNAL_ERROR', message, 500);
  }
}

/**
 * GET /api/reels/:id/comments - Listar comentarios principales de un reel.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email ?? null;
    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return errorResponse('INVALID_ID', 'Invalid reel ID', 400);
    }

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    if (limit > 50) {
      return errorResponse('VALIDATION_ERROR', 'Maximum limit is 50 comments', 400);
    }

    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      return errorResponse('NOT_FOUND', 'Reel not found', 404);
    }

    const orderBy =
      sort === 'popular'
        ? [{ likes: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const comments = await prisma.reelComment.findMany({
      where: {
        submissionId,
        isHidden: false,
        parentCommentId: null,
      },
      orderBy,
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { name: true, photo: true, username: true },
        },
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

    const total = await prisma.reelComment.count({
      where: { submissionId, isHidden: false, parentCommentId: null },
    });

    return successResponse({
      comments: processed,
      total,
      hasMore: offset + processed.length < total,
    });
  } catch (error: any) {
    console.error('[API /reels/[id]/comments] GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error fetching comments', 500);
  }
}
