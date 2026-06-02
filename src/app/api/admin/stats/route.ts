import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/auth-helpers';
import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const [
      totalUsers,
      totalSubmissions,
      totalChallenges,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      roleCounts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.submission.count(),
      prisma.challenge.count(),
      prisma.submission.count({ where: { status: 'pending' } }),
      prisma.submission.count({ where: { status: 'approved' } }),
      prisma.submission.count({ where: { status: 'rejected' } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
    ]);

    const skaterCount = roleCounts.find(r => r.role === 'skater')?._count.role || 0;
    const judgeCount = roleCounts.find(r => r.role === 'judge')?._count.role || 0;
    const adminCount = roleCounts.find(r => r.role === 'admin')?._count.role || 0;

    return NextResponse.json({
      totalUsers,
      totalSubmissions,
      totalChallenges,
      activeJudges: judgeCount + adminCount,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      skaterCount,
      judgeCount,
      adminCount,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
