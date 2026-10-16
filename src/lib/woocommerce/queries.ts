/**
 * Query para obtener productos destacados de una categoría específica
 * en el WooCommerce de Tory Skateshop
 *
 * Categoría por defecto: "trickest" (configurable vía env)
 */
export const FEATURED_PRODUCTS_QUERY = `
  query GetFeaturedProducts($category: String!, $first: Int = 30) {
    products(where: { category: $category }, first: $first) {
      nodes {
        id
        databaseId
        name
        slug
        image {
          sourceUrl
          altText
        }
        ... on SimpleProduct {
          price
          regularPrice
          salePrice
        }
        ... on VariableProduct {
          price
          attributes {
            nodes {
              name
              label
              variation
              visible
              options
            }
          }
          variations(first: 30) {
            nodes {
              id
              databaseId
              name
              slug
              sku
              price
              regularPrice
              salePrice
              stockStatus
              stockQuantity
              purchasable
              image {
                sourceUrl
                altText
              }
              attributes {
                nodes {
                  name
                  value
                  label
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const RECENT_PRODUCTS_QUERY = `
  query GetRecentProducts($category: String!, $first: Int = 20) {
    products(
      where: { category: $category, orderby: { field: DATE, order: DESC } }
      first: $first
    ) {
      nodes {
        databaseId
        name
        slug
        date
        image {
          sourceUrl
          altText
        }
      }
    }
  }
`;

export const RECENT_PRODUCTS_BY_CATEGORY_ID_QUERY = `
  query GetRecentProductsByCategoryId($categoryId: Int!, $first: Int = 20) {
    products(
      where: { categoryId: $categoryId, orderby: { field: DATE, order: DESC } }
      first: $first
    ) {
      nodes {
        databaseId
        name
        slug
        date
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