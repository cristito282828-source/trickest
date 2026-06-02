import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Obtener el usuario con su foto
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        photo: true,
        name: true,
      },
    });

    // Obtener todas las submissions aprobadas del usuario
    const submissions = await prisma.submission.findMany({
      where: {
        userId: email,
        status: 'approved',
      },
      select: {
        score: true,
      },
    });

    // Calcular el score total
    const totalScore = submissions.reduce((acc, submission) => {
      return acc + (submission.score || 0);
    }, 0);

    return NextResponse.json({
      totalScore,
      approvedSubmissions: submissions.length,
      photo: user?.photo || null,
      name: user?.name || null,
    });

  } catch (error) {
    console.error('Error obteniendo score:', error);
    return NextResponse.json({ error: 'Error fetching score' }, { status: 500 });
  }
}
