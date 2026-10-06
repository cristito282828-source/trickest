/**
 * Endpoint temporal de prueba: verifica que el SDK de Mux puede hablar con la API.
 * Borra este archivo una vez confirmado que las credenciales funcionan.
 *
 * GET /api/mux-test  →  { ok: true, total: N } si las credenciales son válidas
 */
import { NextResponse } from 'next/server';
import { mux } from '@/lib/mux';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const assets = await mux.video.assets.list({ limit: 1 });
    return NextResponse.json({
      ok: true,
      total: assets.data?.length ?? 0,
      message: 'Credenciales de Mux válidas ✅',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint:
          '401/403 → credenciales mal. Revisa MUX_TOKEN_ID y MUX_TOKEN_SECRET. ' +
          'Asegúrate de que el token tenga permisos de video:read.',
      },
      { status: 500 }
    );
  }
}
