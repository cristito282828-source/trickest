/**
 * Cliente singleton de Mux (server-side).
 *
 * Reutiliza la misma instancia en development (HMR) para no crear
 * clientes duplicados en cada hot-reload. Mismo patrón que src/app/lib/prisma.ts.
 */
import Mux from '@mux/mux-node';

const tokenId = process.env.MUX_TOKEN_ID;
const tokenSecret = process.env.MUX_TOKEN_SECRET;

// Resolver la signing key desde .env o desde un archivo .pem.
// Preferimos el archivo porque es más limpio y seguro (no requiere escapar \n).
function resolveSigningKey(): string {
  // 1) Inline en .env (mismo formato PEM, sin escapes)
  const inline = process.env.MUX_SIGNING_KEY || process.env.MUX_SIGNING_KEY_PRIVATE;
  if (inline && inline.trim().length > 0) return inline.trim();

  // 2) Path a un archivo .pem
  const filePath = process.env.MUX_SIGNING_KEY_FILE;
  if (filePath && filePath.trim().length > 0) {
    try {
      const fs = require('fs') as typeof import('fs');
      const path = require('path') as typeof import('path');
      const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      const content = fs.readFileSync(abs, 'utf8');
      return content.trim();
    } catch (e) {
      console.warn(`[mux] No pude leer ${filePath}:`, e instanceof Error ? e.message : e);
    }
  }

  return '';
}

const signingKey = resolveSigningKey();

if (!tokenId || !tokenSecret) {
  // En development solo logueamos; en producción lanzamos.
  // Esto permite arrancar la app aunque no hayas puesto las credenciales todavía.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MUX_TOKEN_ID y MUX_TOKEN_SECRET son requeridos en producción');
  } else {
    console.warn(
      '[mux] ⚠️  MUX_TOKEN_ID / MUX_TOKEN_SECRET no configurados. Las rutas que usen Mux fallarán hasta que los agregues al .env'
    );
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __mux: Mux | undefined;
}

export const mux: Mux =
  global.__mux ??
  new Mux({
    tokenId: tokenId ?? '',
    tokenSecret: tokenSecret ?? '',
    // Signing key opcional: solo necesaria si quieres signed playback URLs.
    // Si no la pones, usa playback_policy: ['public'] en los uploads.
    jwtSigningKey: signingKey,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__mux = mux;
}

/**
 * Genera una URL firmada (JWT) para reproducir un asset de Mux con
 * playback_policy "signed". Sin esto, el browser no puede reproducir el video.
 *
 * @param playbackId  El muxPlaybackId guardado en la Submission
 * @param expiration  Tiempo de validez. Default: 1 hora (suficiente para ver el video).
 *
 * ⚠️ Si las signing keys no están configuradas, esta función lanza error.
 * En ese caso, considera cambiar a playback_policy: ['public'] en /api/uploads.
 */
export function getSignedPlaybackUrl(playbackId: string, expiration = '1h'): string {
  if (!signingKey) {
    throw new Error(
      'MUX_SIGNING_KEY no configurado. ' +
        'Para signed playback URLs configura la signing key en dashboard.mux.com ' +
        'o cambia el playback_policy a "public" en /api/uploads/route.ts.'
    );
  }

  // keySecret = tu private key (PEM) o HMAC secret, keyId = el ID que Mux te da.
  // Si el SDK detecta el keyId automáticamente desde el PEM, keyId es opcional.
  const token = mux.jwt.signPlaybackId(playbackId, {
    keySecret: signingKey,
    expiration,
    type: 'video',
  });

  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
}

/**
 * Devuelve una URL de thumbnail estática para usar como poster en el feed.
 * No requiere firma — los thumbnails son públicos.
 */
export function getMuxThumbnailUrl(playbackId: string, time = 1): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=640&height=360`;
}
