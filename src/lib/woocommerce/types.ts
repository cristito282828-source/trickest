/**
 * Types para productos del WooCommerce de Tory Skateshop
 */

export interface ExternalProductImage {
  sourceUrl: string;
  altText: string | null;
}

export interface ExternalProduct {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  price: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  image: ExternalProductImage | null;
}

export interface ExternalCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number | null;
  image: ExternalProductImage | null;
}
