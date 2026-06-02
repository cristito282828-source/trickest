import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/auth-helpers';
import prisma from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const challengeId = searchParams.get('challengeId');
  const userId = searchParams.get('userId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;
    if (challengeId) where.challengeId = parseInt(challengeId);
    if (userId) where.userId = { contains: userId, mode: 'insensitive' };

    const [submissions, total, stats] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, photo: true } },
          challenge: { select: { name: true, difficulty: true, points: true } },
          judge: { select: { name: true, email: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.submission.count({ where }),
      Promise.all([
        prisma.submission.count({ where: { status: 'pending' } }),
        prisma.submission.count({ where: { status: 'approved' } }),
        prisma.submission.count({ where: { status: 'rejected' } }),
      ]),
    ]);

    return NextResponse.json({
      submissions,
      stats: {
        pending: stats[0],
        approved: stats[1],
        rejected: stats[2],
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { submissionId, action, score, feedback } = await request.json();

    if (action === 'reevaluate') {
      if (!submissionId || score === undefined) {
        return NextResponse.json({ error: 'Submission ID and score are required' }, { status: 400 });
      }

      if (score < 0 || score > 100) {
        return NextResponse.json({ error: 'Score must be between 0 and 100' }, { status: 400 });
      }

      const submission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          score,
          feedback: feedback || null,
          status: score >= 50 ? 'approved' : 'rejected',
          evaluatedAt: new Date(),
          evaluatedBy: session.user.email,
        },
      });

      return NextResponse.json({ submission });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
