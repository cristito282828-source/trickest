/**
 * Cliente singleton de Mux (server-side).
 *
 * Reutiliza la misma instancia en development (HMR) para no crear
 * clientes duplicados en cada hot-reload. Mismo patrón que src/app/lib/prisma.ts.
 */
import Mux from '@mux/mux-node';

const tokenId = process.env.MUX_TOKEN_ID;
const tokenSecret = process.env.MUX_TOKEN_SECRET;

// Mux SDK v15 espera DOS cosas distintas para JWT signing:
// 1) jwtSigningKey = el KEY ID (string como "01zyE7..."). Va al header "kid" del JWT.
// 2) jwtPrivateKey = el PEM completo. Se usa para firmar.
// Si pones el PEM en jwtSigningKey, Mux lo usa como "kid" y falla la verificación.

const keyId =
  process.env.MUX_SIGNING_KEY_ID ||
  // Fallback: extraer del nombre del archivo "mux-signing-key-XXXX.pem"
  (() => {
    const file = process.env.MUX_SIGNING_KEY_FILE;
    if (!file) return undefined;
    const m = file.match(/mux-signing-key-([A-Za-z0-9_-]+)\.pem$/);
    return m ? m[1] : undefined;
  })();

function resolvePrivateKey(): string {
  // 1) Inline en .env (PEM completo, con \n o saltos de línea reales)
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

const privateKey = resolvePrivateKey();

// Buffer para evitar leer el PEM en cada signed URL
const privateKeyBuffer = privateKey ? (Buffer.from(privateKey) as any) : null;

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
    // Estos dos son independientes y AMBOS necesarios para signed playback:
    // - jwtSigningKey: el KEY ID (string como "01zyE7...")
    // - jwtPrivateKey: el PEM completo del archivo
    jwtSigningKey: keyId,
    jwtPrivateKey: privateKey,
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
  if (!privateKey || !keyId) {
    throw new Error(
      'MUX_SIGNING_KEY no configurado. ' +
        'Para signed playback URLs configura la signing key en dashboard.mux.com ' +
        'o cambia el playback_policy a "public" en /api/uploads/route.ts.'
    );
  }

  // ⚠️ Workaround: el SDK de Mux v15.x tiene un bug donde pone el `kid` en el
  // PAYLOAD del JWT en lugar del header. Mux API requiere kid en el header (RFC 7519).
  // Por eso firmamos manualmente con jsonwebtoken (que pone kid en el header).
  const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');

  const expirationSeconds = expirationToSeconds(expiration);
  const token = jwt.sign(
    {
      sub: playbackId,
      aud: 'v',
      exp: Math.floor(Date.now() / 1000) + expirationSeconds,
    },
    privateKey,
    {
      algorithm: 'RS256',
      keyid: keyId,  // ← va al header (lo que Mux espera)
      noTimestamp: true,
    }
  );

  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
}

function expirationToSeconds(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return 3600; // default 1h
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 3600;
  }
}

/**
 * Devuelve una URL de thumbnail estática para usar como poster en el feed.
 * No requiere firma — los thumbnails son públicos.
 */
export function getMuxThumbnailUrl(playbackId: string, time = 1): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=640&height=360`;
}
