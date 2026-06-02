import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/auth-helpers';
import prisma from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const challenges = await prisma.challenge.findMany({
      include: {
        submissions: {
          select: { status: true, score: true },
        },
      },
      orderBy: { level: 'asc' },
    });

    const challengesWithStats = challenges.map(challenge => {
      const approved = challenge.submissions.filter(s => s.status === 'approved');
      const scores = approved.filter(s => s.score !== null).map(s => s.score!);

      return {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        difficulty: challenge.difficulty,
        points: challenge.points,
        demoVideoUrl: challenge.demoVideoUrl,
        isBonus: challenge.isBonus,
        level: challenge.level,
        createdAt: challenge.createdAt,
        totalSubmissions: challenge.submissions.length,
        approvedSubmissions: approved.length,
        pendingSubmissions: challenge.submissions.filter(s => s.status === 'pending').length,
        rejectedSubmissions: challenge.submissions.filter(s => s.status === 'rejected').length,
        averageScore: scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0,
      };
    });

    return NextResponse.json({ challenges: challengesWithStats });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { name, description, difficulty, points, demoVideoUrl, isBonus } = await request.json();

    if (!name || !description || !difficulty) {
      return NextResponse.json({ error: 'Name, description, and difficulty are required' }, { status: 400 });
    }

    // Find next available level
    const maxLevel = await prisma.challenge.aggregate({
      _max: { level: true },
      where: { isBonus: isBonus || false },
    });
    const nextLevel = (maxLevel._max.level || 0) + 1;

    const challenge = await prisma.challenge.create({
      data: {
        name,
        description,
        difficulty,
        points: points || 100,
        demoVideoUrl: demoVideoUrl || '',
        isBonus: isBonus || false,
        level: isBonus ? 0 : nextLevel,
      },
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { challengeId, name, description, difficulty, points, demoVideoUrl, isBonus } = await request.json();

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    const challenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(difficulty !== undefined && { difficulty }),
        ...(points !== undefined && { points }),
        ...(demoVideoUrl !== undefined && { demoVideoUrl }),
        ...(isBonus !== undefined && { isBonus }),
      },
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { challengeId } = await request.json();

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    // Check if challenge has submissions
    const submissionCount = await prisma.submission.count({
      where: { challengeId },
    });

    if (submissionCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: challenge has ${submissionCount} submissions` },
        { status: 400 }
      );
    }

    await prisma.challenge.delete({ where: { id: challengeId } });

    return NextResponse.json({ message: 'Challenge deleted' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
