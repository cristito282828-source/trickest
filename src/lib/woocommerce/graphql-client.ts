/**
 * Cliente GraphQL para el WooCommerce de Tory Skateshop
 * Usado para traer productos destacados en la sección "Tory Skateshop" de TheTrickest
 */

const WC_GRAPHQL_ENDPOINT =
  process.env.WC_GRAPHQL_URL || 'https://toryskateshop.com/graphqltory';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Ejecuta una query GraphQL contra el endpoint de Tory Skateshop
 */
export async function graphqlFetch<T = any>(
  query: string,
  variables?: Record<string, any>,
  revalidateSeconds = 3600 // Cache de 1 hora por defecto
): Promise<T | null> {
  try {
    const response = await fetch(WC_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: revalidateSeconds },
    });

    if (!response.ok) {
      console.error(`[WC GraphQL] HTTP error: ${response.status}`);
      return null;
    }

    const json: GraphQLResponse<T> = await response.json();

    if (json.errors?.length) {
      console.error('[WC GraphQL] Query errors:', json.errors);
      return null;
    }

    return json.data ?? null;
  } catch (error) {
    console.error('[WC GraphQL] Fetch error:', error);
    return null;
  }
}
