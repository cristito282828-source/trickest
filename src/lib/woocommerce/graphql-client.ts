/**
 * Cliente GraphQL para el WooCommerce de Tory Skateshop
 * Usado para traer productos destacados en la sección "Tory Skateshop" de TheTrickest
 *
 * Soporta múltiples endpoints con fallback automático:
 * 1. WC_GRAPHQL_URL (env var — normalmente https://seagreen-emu-487450.hostingersite.com/graphql)
 * 2. https://seagreen-emu-487450.hostingersite.com/graphql (nuevo host Hostinger)
 * 3. https://toryskateshop.com/graphqltory (legacy, ya no responde)
 */

// Lista de endpoints a probar en orden. El primero que responda 200 OK gana.
const WC_GRAPHQL_ENDPOINTS = [
  process.env.WC_GRAPHQL_URL,
  'https://seagreen-emu-487450.hostingersite.com/graphql',
  'https://toryskateshop.com/graphqltory',
].filter((url): url is string => Boolean(url));

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function tryEndpoint(
  endpoint: string,
  query: string,
  variables: Record<string, any> | undefined,
  revalidateSeconds: number,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }> {
  try {
    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: revalidateSeconds },
    });
    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        ok: false,
        status: response.status,
        error: `HTTP ${response.status} (${elapsed}ms): ${body.slice(0, 200)}`,
      };
    }

    const json: GraphQLResponse<unknown> = await response.json();
    if (json.errors?.length) {
      return {
        ok: false,
        status: 200,
        error: `GraphQL errors: ${JSON.stringify(json.errors)}`,
      };
    }

    return { ok: true, data: json.data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: `Fetch throw: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Ejecuta una query GraphQL contra el endpoint de Tory Skateshop.
 * Prueba cada endpoint de la lista hasta que uno responda bien.
 */
export async function graphqlFetch<T = any>(
  query: string,
  variables?: Record<string, any>,
  revalidateSeconds = 3600 // Cache de 1 hora por defecto
): Promise<T | null> {
  const errors: string[] = [];

  for (const endpoint of WC_GRAPHQL_ENDPOINTS) {
    console.log('[WC GraphQL] Trying endpoint:', endpoint);
    const result = await tryEndpoint(endpoint, query, variables, revalidateSeconds);

    if (result.ok) {
      console.log('[WC GraphQL] Success with endpoint:', endpoint);
      return result.data as T;
    }

    console.error(`[WC GraphQL] Failed endpoint ${endpoint}:`, result.error);
    errors.push(`${endpoint} → ${result.error}`);
  }

  console.error('[WC GraphQL] All endpoints failed:', errors.join(' | '));
  return null;
}
