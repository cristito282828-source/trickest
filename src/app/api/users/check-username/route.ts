import prisma from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { available: false, message: 'Invalid username format' },
        { status: 200 }
      );
    }

    // Check if username exists
    const existingUser = await prisma.user.findFirst({
      where: { username },
      select: { username: true },
    });

    return NextResponse.json({
      available: !existingUser,
      message: existingUser ? 'Username already taken' : 'Username available',
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
