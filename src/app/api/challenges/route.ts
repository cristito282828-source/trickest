import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    console.log('[DEBUG /api/challenges] Iniciando GET request');

    const session = await getServerSession(authOptions);
    console.log('[DEBUG /api/challenges] Session:', session?.user?.email || 'no session');

    // Obtener todos los challenges ordenados por nivel
    console.log('[DEBUG /api/challenges] Obteniendo challenges de DB...');
    const challenges = await prisma.challenge.findMany({
      orderBy: [
        { isBonus: 'asc' }, // No bonus primero
        { level: 'asc' },   // Luego por nivel
      ],
    });
    console.log('[DEBUG /api/challenges] Challenges obtenidos:', challenges.length);

    // Si el usuario está autenticado, enriquecer con sus submissions
    if (session?.user?.email) {
      console.log('[DEBUG /api/challenges] Usuario autenticado, obteniendo submissions...');
      try {
        const userSubmissions = await prisma.submission.findMany({
          where: {
            userId: session.user.email,
          },
          select: {
            id: true,
            challengeId: true,
            status: true,
            score: true,
            videoUrl: true,
            submittedAt: true,
            feedback: true,
          },
        });
        console.log('[DEBUG /api/challenges] Submissions obtenidas:', userSubmissions.length);

        // Crear un mapa de submissions por challengeId
        const submissionsMap = new Map(
          userSubmissions.map(sub => [sub.challengeId, sub])
        );

        // Enriquecer challenges con datos de submissions del usuario
        const enrichedChallenges = challenges.map(challenge => ({
          ...challenge,
          userSubmission: submissionsMap.get(challenge.id) || null,
        }));

        console.log('[DEBUG /api/challenges] Retornando challenges con submissions');
        return NextResponse.json({ challenges: enrichedChallenges });
      } catch (submissionError) {
        console.error('[DEBUG /api/challenges] Error obteniendo submissions:', submissionError);
        // Si falla obtener submissions, devolver challenges sin submissions
      }
    }

    // Si no está autenticado o no tiene email, devolver solo los challenges
    console.log('[DEBUG /api/challenges] Retornando challenges sin submissions');
    const challengesWithoutSubmissions = challenges.map(challenge => ({
      ...challenge,
      userSubmission: null,
    }));

    console.log('[DEBUG /api/challenges] Respuesta lista, total challenges:', challengesWithoutSubmissions.length);
    return NextResponse.json({ challenges: challengesWithoutSubmissions });

  } catch (error) {
    console.error('[DEBUG /api/challenges] ERROR:', error);
    console.error('[DEBUG /api/challenges] Error message:', error instanceof Error ? error.message : 'unknown');
    console.error('[DEBUG /api/challenges] Error stack:', error instanceof Error ? error.stack : 'no stack');
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
