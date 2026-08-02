import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/external-image?url=<encoded_url>
 *
 * Proxy de imágenes externas para evitar problemas de CORS en el canvas.
 * El server descarga la imagen y la reenvía al cliente con headers
 * CORS correctos (mismo origen).
 *
 * Query params:
 *   - url: URL completa de la imagen a proxyar (URL-encoded)
 *
 * Cache: 1 día (las imágenes de producto no cambian frecuentemente)
 */
export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 24 horas

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'Missing "url" query parameter' },
        { status: 400 }
      );
    }

    // Validar que la URL sea de toryskateshop.com (seguridad: solo proxyamos nuestro partner)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    const allowedHosts = [
      'toryskateshop.com',
      'www.toryskateshop.com',
      // Nuevo WordPress host (Hostinger) usado por el partner de pruebas
      'seagreen-emu-487450.hostingersite.com',
    ];
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: 'Host not allowed' },
        { status: 403 }
      );
    }

    // Fetch la imagen desde el server (sin CORS)
    const imageResponse = await fetch(url, {
      headers: {
        // Algunos servers bloquean requests sin User-Agent
        'User-Agent': 'Mozilla/5.0 (compatible; TheTrickest/1.0)',
      },
      next: { revalidate: 86400 }, // Cache 24h
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResponse.status}` },
        { status: imageResponse.status }
      );
    }

    // Obtener el buffer y content-type
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Retornar la imagen con CORS headers correctos (mismo origen)
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        // CORS: aunque es same-origin, agregamos por si el cliente lo necesita
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('[API /external-image] Error:', error);
    return NextResponse.json(
      { error: 'Internal error proxying image' },
      { status: 500 }
    );
  }
}
