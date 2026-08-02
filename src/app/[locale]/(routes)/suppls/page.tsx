import { getTranslations } from 'next-intl/server';
import { graphqlFetch } from '@/lib/woocommerce/graphql-client';
import { FEATURED_PRODUCTS_QUERY } from '@/lib/woocommerce/queries';
import type { ExternalProduct, ExternalCategory } from '@/lib/woocommerce/types';
import OrbitalCanvas from '@/components/orbital/OrbitalCanvas';
import FloatingCart from '@/components/orbital/FloatingCart';

const CATEGORY_SLUG = process.env.WC_FEATURED_CATEGORY || 'trickest';
const CATEGORY_IS_NUMERIC = /^\d+$/.test(CATEGORY_SLUG);

export const revalidate = 3600; // Cache de 1 hora

interface ProductsResponse {
  products: { nodes: ExternalProduct[] };
}

interface CategoryResponse {
  productCategory: ExternalCategory | null;
}

export async function generateMetadata() {
  const t = await getTranslations('supplsPage');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function SupplsPage() {
  const t = await getTranslations('supplsPage');

  // Fetch en paralelo: categoría + productos. Soportamos slug o ID numérico.
  let categoryData: CategoryResponse | null = null;
  let productsData: ProductsResponse | null = null;

  if (CATEGORY_IS_NUMERIC) {
    const categoryId = Number(CATEGORY_SLUG);
    const categoryQuery = `query GetCategoryById($id: ID!) { productCategory(id: $id, idType: DATABASE_ID) { id name slug description count image { sourceUrl altText } } }`;

    const productsByIdQuery = `query GetFeaturedProductsById($categoryId: Int!, $first: Int = 30) {
      products(where: { categoryId: $categoryId }, first: $first) {
        nodes {
          id
          databaseId
          name
          slug
          image { sourceUrl altText }
          ... on SimpleProduct { price regularPrice salePrice }
          ... on VariableProduct {
            price
            attributes { nodes { name label variation visible options } }
            variations(first: 30) { nodes { id databaseId name slug sku price regularPrice salePrice stockStatus stockQuantity purchasable image { sourceUrl altText } attributes { nodes { name value label } } } }
          }
        }
      }
    }`;

    [categoryData, productsData] = await Promise.all([
      graphqlFetch<CategoryResponse>(categoryQuery, { id: categoryId }),
      graphqlFetch<ProductsResponse>(productsByIdQuery, { categoryId, first: 30 }),
    ]);
  } else {
    // slug case (existing behavior)
    [categoryData, productsData] = await Promise.all([
      graphqlFetch<CategoryResponse>(
        `query GetCategoryInfo($slug: String!) {
        productCategory(id: $slug, idType: SLUG) {
          id
          name
          slug
          description
          count
        }
      }`,
        { slug: CATEGORY_SLUG }
      ),
      graphqlFetch<ProductsResponse>(FEATURED_PRODUCTS_QUERY, {
        category: CATEGORY_SLUG,
        first: 30,
      }),
    ]);
  }

  const category = categoryData?.productCategory ?? null;
  const products = productsData?.products?.nodes ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-block bg-accent-pink-500/20 text-accent-pink-300 border-2 border-accent-pink-500 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3">
            {t('badge')}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-accent-cyan-400 uppercase tracking-wider mb-2">
            {t('title')}
          </h1>
          <p className="text-neutral-300 text-sm md:text-base max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
          {category?.count != null && (
            <p className="text-accent-cyan-300 text-xs mt-2 font-bold">
              {t('productCount', { count: category.count })}
            </p>
          )}
        </div>

        {/* Empty state */}
        {products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-lg">{t('noProducts')}</p>
          </div>
        )}

        {/* Canvas orbital con los productos */}
        {products.length > 0 && (
          <OrbitalCanvas
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              // El backend ya devuelve la URL proxied (/api/external-image?url=...)
                // Usar proxy local para evitar problemas CORS al dibujar en canvas
                imageUrl: p.image?.sourceUrl
                  ? `/api/external-image?url=${encodeURIComponent(p.image.sourceUrl)}`
                  : null,
              // WPGQL WC devuelve variations como { nodes: [...] } (connection wrapper)
              variations: p.variations?.nodes ?? [],
              attributes: p.attributes?.nodes ?? [],
            }))}
          />
        )}

        {/* Disclaimer */}
        {products.length > 0 && (
          <p className="text-center text-neutral-500 text-xs mt-6">
            {t('externalDisclaimer')}
          </p>
        )}

        {/* Carrito flotante */}
        <FloatingCart />
      </div>
    </div>
  );
}

