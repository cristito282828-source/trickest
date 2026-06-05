import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { graphqlFetch } from '@/lib/woocommerce/graphql-client';
import { FEATURED_PRODUCTS_QUERY } from '@/lib/woocommerce/queries';
import type { ExternalProduct, ExternalCategory } from '@/lib/woocommerce/types';

const STORE_URL = 'https://toryskateshop.com';
const CATEGORY_SLUG = process.env.WC_FEATURED_CATEGORY || 'trickest';

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

  // Fetch en paralelo: categoría + productos
  const [categoryData, productsData] = await Promise.all([
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

  const category = categoryData?.productCategory ?? null;
  const products = productsData?.products?.nodes ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-accent-pink-500/20 text-accent-pink-300 border-2 border-accent-pink-500 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4">
            {t('badge')}
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-accent-cyan-400 uppercase tracking-wider mb-4">
            {t('title')}
          </h1>
          <p className="text-neutral-300 text-base md:text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
          {category?.count != null && (
            <p className="text-accent-cyan-300 text-sm mt-3 font-bold">
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

        {/* Grid de productos */}
        {products.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <a
                  key={product.id}
                  href={`${STORE_URL}/?product=${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-[2px] rounded-2xl shadow-2xl shadow-accent-cyan-500/20 hover:shadow-accent-cyan-500/50 transform hover:scale-105 transition-all duration-300"
                >
                  <div className="bg-neutral-900 rounded-2xl overflow-hidden h-full flex flex-col">
                    {/* Imagen */}
                    <div className="relative aspect-square bg-neutral-800 overflow-hidden">
                      {product.image?.sourceUrl ? (
                        <Image
                          src={product.image.sourceUrl}
                          alt={product.image.altText || product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                          🛹
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wide line-clamp-2 group-hover:text-accent-cyan-300 transition-colors mb-2">
                        {product.name}
                      </h3>
                      {product.price && (
                        <p className="text-accent-yellow-400 font-black text-lg md:text-xl mt-auto">
                          {product.price}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-center text-neutral-500 text-xs mt-10">
              {t('externalDisclaimer')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

