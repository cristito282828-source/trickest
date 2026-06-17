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