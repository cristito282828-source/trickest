import prisma from '@/app/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { mux, getSignedPlaybackUrl } from '@/lib/mux';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    console.log('📋 GET /api/submissions/pending - Request received');
    console.log('👤 Session user email:', session?.user?.email);

    if (!session?.user?.email) {
      console.log('❌ Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verificar que el usuario sea juez o admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    console.log('👨‍⚖️ User role:', user?.role);

    if (!user || (user.role !== 'judge' && user.role !== 'admin')) {
      console.log('❌ Not authorized - role:', user?.role);
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    console.log('🔍 Buscando submissions pendientes...');

    // Obtener TODAS las submissions pendientes
    const submissions = await prisma.submission.findMany({
      where: {
        status: 'pending',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        challenge: {
          select: {
            name: true,
            level: true,
            difficulty: true,
            points: true,
          },
        },
      },
      orderBy: [
        { submittedAt: 'asc' }, // Más antiguas primero
      ],
    });

    console.log(`✅ Encontradas ${submissions.length} submissions pendientes`);

    // Adjuntar signed playback URL a las que son de Mux
    const enrichedSubmissions = submissions.map((s) => {
      if (s.videoSource === 'mux' && s.muxPlaybackId) {
        try {
          return {
            ...s,
            muxSignedUrl: getSignedPlaybackUrl(s.muxPlaybackId, '2h'),
          };
        } catch (e) {
          console.warn(`[pending] No pude firmar playbackId ${s.muxPlaybackId}:`, e);
          return s;
        }
      }
      return s;
    });

    return NextResponse.json({
      submissions: enrichedSubmissions,
      count: enrichedSubmissions.length,
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo submissions pendientes:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json({
      error: 'Server error',
      message: error.message || 'Error desconocido',
    }, { status: 500 });
  }
}
