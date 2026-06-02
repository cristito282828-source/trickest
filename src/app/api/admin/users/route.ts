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
  const role = searchParams.get('role');
  const search = searchParams.get('search');
  const registeredIn = searchParams.get('registeredIn');
  const hasSubmissions = searchParams.get('hasSubmissions');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;
  const orderBy = searchParams.get('orderBy') || 'createdAt';
  const order = searchParams.get('order') || 'desc';

  try {
    // Build where clause with multiple filters
    const where: any = {};

    // Filter by role
    if (role && role !== 'all') {
      where.role = role;
    }

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by registration date
    if (registeredIn && registeredIn !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (registeredIn) {
        case 'today':
          // Start of today (00:00:00)
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case '3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      where.createdAt = { gte: startDate };
    }

    // Filter by submissions
    if (hasSubmissions === 'true') {
      where.submissions = { some: {} };
    } else if (hasSubmissions === 'false') {
      where.submissions = { none: {} };
    }

    // Build orderBy clause
    const orderByClause: any = {};
    if (orderBy === 'score') {
      orderByClause.score = order;
    } else if (orderBy === 'name') {
      orderByClause.name = order;
    } else {
      orderByClause.createdAt = order;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          photo: true,
          role: true,
          profileStatus: true,
          createdAt: true,
          submissions: {
            select: { id: true, score: true, status: true },
          },
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithStats = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      photo: user.photo,
      role: user.role,
      profileStatus: user.profileStatus,
      createdAt: user.createdAt,
      totalSubmissions: user.submissions.length,
      totalScore: user.submissions
        .filter(s => s.status === 'approved' && s.score !== null)
        .reduce((sum, s) => sum + (s.score || 0), 0),
    }));

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { userId, action, newRole } = await request.json();

    if (action === 'updateRole') {
      if (!['skater', 'judge', 'admin'].includes(newRole)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: { id: true, email: true, role: true },
      });

      return NextResponse.json({ user: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
