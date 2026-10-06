/**
 * POST /api/webhooks/mux
 *
 * Mux llama este endpoint cuando algo pasa con los videos:
 *   - video.upload.asset_created  → se creó el asset a partir del upload
 *   - video.asset.ready           → el video ya está transcodeado y se puede reproducir
 *   - video.asset.errored         → falló el transcode
 *   - video.asset.deleted         → se borró
 *
 * Configurar en: dashboard.mux.com → Webhooks → Create Webhook
 *   URL: https://tudominio.com/api/webhooks/mux
 *   Events: video.upload.asset_created, video.asset.ready, video.asset.errored
 *
 * En local necesitas ngrok o similar para que Mux pueda llegar a tu server.
 */
import { NextResponse } from 'next/server';
import { mux } from '@/lib/mux';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 1) Validar firma de Mux (seguridad — evita que cualquiera mande eventos falsos)
  const signature = req.headers.get('mux-signature');
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 401 });
  }

  if (!process.env.MUX_WEBHOOK_SECRET) {
    console.error('[mux-webhook] MUX_WEBHOOK_SECRET no está configurado');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await req.text();

  // 1) Validar firma y obtener el evento parseado en un solo paso.
  // unwrap() valida la firma con el secret y lanza si es inválida.
  let event: { type: string; data: any };
  try {
    event = await mux.webhooks.unwrap(body, req.headers, process.env.MUX_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[mux-webhook] Firma inválida:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const eventType: string = event.type;
  const data = event.data;

  console.log(`[mux-webhook] Evento: ${eventType}`, {
    uploadId: data.upload_id,
    assetId: data.id,
    playbackIds: data.playback_ids,
  });

  // Manejar cada tipo de evento
  try {
    switch (eventType) {
      // Cuando el upload terminó y Mux creó el asset
      case 'video.upload.asset_created': {
        // data.upload_id, data.asset_id
        // Guardamos la relación upload <-> asset para cuando llegue el "ready"
        // (por ahora lo logueamos; cuando integremos el modal lo guardamos en BD)
        break;
      }

      // El asset está listo para reproducirse
      case 'video.asset.ready': {
        const assetId: string = data.id;
        const playbackId: string | undefined = data.playback_ids?.[0]?.id;

        if (!playbackId) {
          console.warn('[mux-webhook] asset.ready sin playback_id', assetId);
          break;
        }

        // Actualizamos la Submission que esté esperando este asset.
        // (Por ahora, la lógica de "crear submission con muxAssetId"
        // la agregamos cuando integremos el modal. Mientras tanto, este
        // código no romperá nada si no hay match.)
        const updated = await prisma.submission.updateMany({
          where: { muxAssetId: assetId },
          data: {
            muxPlaybackId: playbackId,
            videoStatus: 'ready',
          },
        });

        console.log(`[mux-webhook] Submissions actualizadas: ${updated.count}`);
        break;
      }

      // El transcode falló
      case 'video.asset.errored': {
        const assetId: string = data.id;
        const errors: any[] = data.errors || [];

        console.error(`[mux-webhook] Asset ${assetId} falló:`, errors);

        await prisma.submission.updateMany({
          where: { muxAssetId: assetId },
          data: { videoStatus: 'errored' },
        });
        break;
      }

      default:
        // Otros eventos (deleted, etc.) los ignoramos por ahora
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[mux-webhook] Error procesando evento:', err);
    // Devolvemos 200 igual para que Mux no reintente si fue un error de BD
    return NextResponse.json({ received: true, error: String(err) });
  }
}
