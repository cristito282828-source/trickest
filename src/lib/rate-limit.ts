/**
 * Rate Limiting System (In-Memory)
 *
 * NOTA: Este es un sistema de rate limiting en memoria que funciona bien para:
 * - Desarrollo
 * - Apps con un solo servidor
 * - Protección básica contra ataques de fuerza bruta
 *
 * Para producción con múltiples servidores, considera usar:
 * - Upstash Redis (@upstash/ratelimit)
 * - Redis con ioredis
 * - Vercel KV
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store en memoria (se reinicia cada vez que el servidor se reinicia)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpieza periódica de entradas expiradas (cada 5 minutos)
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => rateLimitStore.delete(key));
  }, 5 * 60 * 1000); // 5 minutos
}

export interface RateLimitConfig {
  /** Número de request permitidos */
  limit: number;
  /** Ventana de tiempo en segundos */
  window: number;
  /** Identificador único para el rate limit */
  identifier: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Verifica si una request debe ser rate limited
 *
 * @param config - Configuración del rate limit
 * @returns Resultado del rate limit check
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const key = `${config.identifier}:${config.window}`;

  const entry = rateLimitStore.get(key);

  // Si no existe entrada o ya expiró, crear una nueva
  if (!entry || now > entry.resetTime) {
    const resetTime = now + (config.window * 1000);
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime,
    };
  }

  // Incrementar contador
  entry.count += 1;

  // Verificar si excede el límite
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Obtiene un identificador único para la request
 *
 * Prioridad:
 * 1. User ID (si está autenticado)
 * 2. IP address
 * 3. Random fallback
 */
export async function getRateLimitIdentifier(req: Request): Promise<string> {
  // Intentar obtener IP de varios headers (común en proxies/CDNs)
  const headers = req.headers;
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    'unknown';

  return ip;
}

/**
 * Middleware helper para Next.js API routes
 *
 * @example
 * ```ts
 * export async function POST(req: Request) {
 *   const rateLimit = await rateLimitCheck(req, {
 *     limit: 5,      // 5 requests
 *     window: 60,    // por 60 segundos
 *     identifier: 'register'
 *   });
 *
 *   if (!rateLimit.success) {
 *     return rateLimitResponse(rateLimit);
 *   }
 *
 *   // ... tu código aquí
 * }
 * ```
 */
export async function rateLimitCheck(
  req: Request,
  config: Omit<RateLimitConfig, 'identifier'>
): Promise<RateLimitResult> {
  const identifier = await getRateLimitIdentifier(req);

  return checkRateLimit({
    ...config,
    identifier: `${identifier}:default`,
  });
}

/**
 * Genera una respuesta de error de rate limit
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait a moment before trying again.',
        retryAfter,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      },
    }
  );
}

// ==================== PRECONFIGURED RATE LIMITS ====================

/**
 * Strict rate limits for sensitive endpoints
 */
export const RateLimits = {
  /** Login: 5 attempts per minute */
  login: {
    limit: 5,
    window: 60,
    identifier: 'login',
  },

  /** Register: 3 attempts per hour */
  register: {
    limit: 3,
    window: 3600,
    identifier: 'register',
  },

  /** Set password: 3 attempts per hour */
  setPassword: {
    limit: 3,
    window: 3600,
    identifier: 'set-password',
  },

  /** Submit trick: 10 per minute */
  submitTrick: {
    limit: 10,
    window: 60,
    identifier: 'submit-trick',
  },

  /** General API: 100 per minute */
  api: {
    limit: 100,
    window: 60,
    identifier: 'api',
  },

  /** Leaderboard: 30 per minute */
  leaderboard: {
    limit: 30,
    window: 60,
    identifier: 'leaderboard',
  },
} as const;
