/**
 * Query para obtener productos destacados de una categoría específica
 * en el WooCommerce de Tory Skateshop
 *
 * Categoría por defecto: "trickest" (configurable vía env)
 */
export const FEATURED_PRODUCTS_QUERY = `
  query GetFeaturedProducts($category: String!, $first: Int = 8) {
    products(where: { category: $category }, first: $first) {
      nodes {
        id
        databaseId
        name
        slug
        ... on SimpleProduct {
          price
          regularPrice
          salePrice
        }
        ... on VariableProduct {
          price
        }
        image {
          sourceUrl
          altText
        }
      }
    }
  }
`;

/**
 * Query para obtener info de una categoría
 */
export const CATEGORY_INFO_QUERY = `
  query GetCategoryInfo($slug: String!) {
    productCategory(id: $slug, idType: SLUG) {
      id
      name
      slug
      description
      count
      image {
        sourceUrl
        altText
      }
    }
  }
`;
