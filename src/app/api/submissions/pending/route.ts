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

    // Adjuntar signed playback URL a las que son de Mux.
    // Si el playbackId falta (webhook no llegó), consultamos Mux en vivo
    // y actualizamos la BD. Esto hace al sistema auto-curativo.
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (s) => {
        if (s.videoSource !== 'mux' || !s.muxAssetId) {
          return s;
        }

        let playbackId = s.muxPlaybackId;

        // Si falta el playbackId, consultar Mux directamente
        if (!playbackId) {
          try {
            const asset = await mux.video.assets.retrieve(s.muxAssetId);
            playbackId = asset.playback_ids?.[0]?.id || null;

            // Si lo encontramos, actualizar la BD para futuras requests
            if (playbackId && asset.status === 'ready') {
              await prisma.submission.update({
                where: { id: s.id },
                data: {
                  muxPlaybackId: playbackId,
                  videoStatus: 'ready',
                },
              });
              console.log(`[pending] Self-healed submission ${s.id}: playbackId=${playbackId}`);
            }
          } catch (e) {
            console.warn(`[pending] No pude resolver playbackId de asset ${s.muxAssetId}:`, e);
          }
        }

        if (!playbackId) {
          return s;
        }

        try {
          const muxSignedUrl = getSignedPlaybackUrl(playbackId, '2h');
          return { ...s, muxPlaybackId: playbackId, muxSignedUrl };
        } catch (e) {
          console.warn(`[pending] No pude firmar playbackId ${playbackId}:`, e);
          return { ...s, muxPlaybackId: playbackId };
        }
      })
    );

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
