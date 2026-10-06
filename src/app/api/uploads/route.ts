/**
 * POST /api/uploads
 *
 * Crea un "direct upload" en Mux. Devuelve una URL firmada a la que
 * el browser del skater sube el video DIRECTO a Mux, sin pasar por
 * tu servidor (ahorra bandwidth y tiempo).
 *
 * Después del upload, Mux dispara un webhook a /api/webhooks/mux
 * cuando el asset está listo para reproducirse.
 *
 * Body: {} (vacío por ahora; en el futuro podríamos pasar challengeId
 *       para guardarlo como metadata en el asset y atarlo a la Submission
 *       sin tener que esperar al webhook).
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { mux } from '@/lib/mux';
import { authOptions } from '@/lib/auth';
import { rateLimitCheck, rateLimitResponse, RateLimits } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 1) Auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 2) Rate limit (reutilizamos el de submitTrick)
  const rl = await rateLimitCheck(req, RateLimits.submitTrick);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    // 3) Crear direct upload en Mux
    //
    // playback_policy 'signed' = necesitas signed URLs para verlo.
    // Más seguro pero requiere signing keys configuradas.
    // Usa 'public' si quieres que cualquiera con el playbackId lo vea
    // (más simple para empezar; lo puedes cambiar luego).
    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXTAUTH_URL || '*',
      new_asset_settings: {
        playback_policy: ['signed'],
        encoding_tier: 'baseline', // 'smart' = mejor calidad, más caro
      },
    });

    return NextResponse.json({
      uploadId: upload.id,
      uploadUrl: upload.url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[uploads] Error creando Mux upload:', message);
    return NextResponse.json(
      { error: 'No se pudo crear el upload. Revisa las credenciales de Mux.' },
      { status: 500 }
    );
  }
}
