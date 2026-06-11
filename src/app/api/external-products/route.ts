import { NextRequest, NextResponse } from 'next/server';
import { graphqlFetch } from '@/lib/woocommerce/graphql-client';
import { FEATURED_PRODUCTS_QUERY, CATEGORY_INFO_QUERY } from '@/lib/woocommerce/queries';
import type { ExternalProduct, ExternalCategory } from '@/lib/woocommerce/types';

const FEATURED_CATEGORY = process.env.WC_FEATURED_CATEGORY || 'trickest';
const DEFAULT_LIMIT = 8;

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache de 1 hora

/**
 * GET /api/external-products
 * Devuelve productos destacados de la categoría configurada en Tory Skateshop
 *
 * Las URLs de imágenes se devuelven YA proxied a través de
 * /api/external-image?url=... para evitar problemas de CORS en el canvas
 * (el navegador bloquea ctx.drawImage con imágenes de otro origen sin
 * headers CORS, y toryskateshop.com no envía esos headers).
 *
 * Query params:
 *   - limit: número de productos (default 8, max 20)
 *   - category: override de categoría (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const categoryOverride = searchParams.get('category');

    const limit = Math.min(
      Math.max(parseInt(limitParam || `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT, 1),
      20
    );
    const category = categoryOverride || FEATURED_CATEGORY;

    // 1) Traer info de la categoría
    const categoryData = await graphqlFetch<{ productCategory: ExternalCategory | null }>(
      CATEGORY_INFO_QUERY,
      { slug: category }
    );

    // 2) Traer productos destacados en paralelo lógico
    const productsData = await graphqlFetch<{ products: { nodes: ExternalProduct[] } }>(
      FEATURED_PRODUCTS_QUERY,
      { category, first: limit }
    );

    const rawProducts = productsData?.products?.nodes ?? [];
    const categoryInfo = categoryData?.productCategory ?? null;

    // Proxy las URLs de imágenes a través de nuestro server
    // para evitar CORS al usarlas en un canvas
    const products = rawProducts.map((p) => ({
      ...p,
      image: p.image
        ? {
            ...p.image,
            // Reescribimos la URL al proxy same-origin
            sourceUrl: `/api/external-image?url=${encodeURIComponent(p.image.sourceUrl)}`,
          }
        : null,
    }));

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        category: categoryInfo,
        message: `No hay productos publicados en la categoría "${category}"`,
      });
    }

    return NextResponse.json({
      success: true,
      products,
      category: categoryInfo,
      count: products.length,
    });
  } catch (error) {
    console.error('[API /external-products] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener productos externos' },
      { status: 500 }
    );
  }
}
