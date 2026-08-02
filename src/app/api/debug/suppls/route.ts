import { NextResponse } from 'next/server';
import { graphqlFetch } from '@/lib/woocommerce/graphql-client';
import { FEATURED_PRODUCTS_QUERY, CATEGORY_INFO_QUERY } from '@/lib/woocommerce/queries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/suppls
 *
 * Endpoint de debug para /suppls en producción. Muestra:
 * - Variables de env relevantes
 * - Endpoint WC configurado
 * - Status de la query a WC
 * - Si devuelve productos o no
 *
 * USO: pegar /api/debug/suppls en el browser para diagnosticar
 * por qué /suppls no muestra productos en producción.
 */
export async function GET() {
  const wcGraphqlUrl = process.env.WC_GRAPHQL_URL || 'https://toryskateshop.com/graphqltory';
  const wcCategory = process.env.WC_FEATURED_CATEGORY || 'trickest';
  const isNumericCategory = /^\d+$/.test(wcCategory);

  const debug: Record<string, unknown> = {
    env: {
      WC_GRAPHQL_URL: wcGraphqlUrl,
      WC_FEATURED_CATEGORY: wcCategory,
      isNumericCategory,
    },
    timestamp: new Date().toISOString(),
  };

  // Intentar traer info de la categoría
  const categoryQuery = isNumericCategory
    ? `query GetCategoryById($id: ID!) { productCategory(id: $id, idType: DATABASE_ID) { id name slug count } }`
    : CATEGORY_INFO_QUERY;

  const categoryVars = isNumericCategory ? { id: Number(wcCategory) } : { slug: wcCategory };

  const t0 = Date.now();
  const categoryData = await graphqlFetch<{ productCategory: unknown }>(
    categoryQuery,
    categoryVars,
    0 // sin cache para debug
  );
  debug.categoryQueryMs = Date.now() - t0;
  debug.categoryData = categoryData;

  // Intentar traer productos
  const productsQuery = isNumericCategory
    ? `query GetProductsByCategoryId($categoryId: Int!, $first: Int = 8) {
        products(where: { categoryId: $categoryId }, first: $first) {
          nodes { id databaseId name slug image { sourceUrl } price }
        }
      }`
    : FEATURED_PRODUCTS_QUERY;

  const productsVars = isNumericCategory
    ? { categoryId: Number(wcCategory), first: 8 }
    : { category: wcCategory, first: 8 };

  const t1 = Date.now();
  const productsData = await graphqlFetch<{ products: { nodes: unknown[] } }>(
    productsQuery,
    productsVars,
    0
  );
  debug.productsQueryMs = Date.now() - t1;
  debug.productsCount = productsData?.products?.nodes?.length ?? 0;
  debug.productsData = productsData;

  return NextResponse.json(debug, { status: 200 });
}
